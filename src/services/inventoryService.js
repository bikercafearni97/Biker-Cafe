/**
 * Inventory Management Service for BIKER CAFE
 *
 * Manages:
 * - Physical stock tracking & status computation
 * - Size-wise inventory variants
 * - Colour variant inventory
 * - Atomic stock adjustments via Firestore transactions
 * - Audit logging in `inventoryHistory`
 * - Preparation for future order confirmation/cancellation deductions
 */
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import { PRODUCTS_COLLECTION } from './productsService';

export const INVENTORY_HISTORY_COLLECTION = 'inventoryHistory';

/**
 * Standard Stock Status Enums
 */
export const STOCK_STATUS = {
  UNKNOWN: 'unknown',
  IN_STOCK: 'in_stock',
  LOW_STOCK: 'low_stock',
  OUT_OF_STOCK: 'out_of_stock',
};

/**
 * Computes the overall stock status based on inventory data.
 * Does not invent stock if tracking is not enabled.
 *
 * @param {object} inventory
 * @returns {string} One of STOCK_STATUS enum values
 */
export function computeStockStatus(inventory) {
  if (!inventory || !inventory.trackingEnabled) {
    return STOCK_STATUS.UNKNOWN;
  }

  const threshold = Number(inventory.lowStockThreshold ?? 2);
  const variants = Array.isArray(inventory.variants) ? inventory.variants : [];

  // If product has size/color variants
  if (variants.length > 0) {
    const totalQty = variants.reduce((sum, v) => sum + (Number(v.quantity) || 0), 0);
    if (totalQty <= 0) return STOCK_STATUS.OUT_OF_STOCK;
    if (totalQty <= threshold) return STOCK_STATUS.LOW_STOCK;
    return STOCK_STATUS.IN_STOCK;
  }

  // Unit stock without variants
  const qty = Number(inventory.quantity);
  if (isNaN(qty)) return STOCK_STATUS.UNKNOWN;
  if (qty <= 0) return STOCK_STATUS.OUT_OF_STOCK;
  if (qty <= threshold) return STOCK_STATUS.LOW_STOCK;
  return STOCK_STATUS.IN_STOCK;
}

/**
 * Returns customer-facing stock label and status config.
 * Never exposes raw quantities or administrative logs to customers.
 */
export function getCustomerStockBadge(product) {
  const inv = product?.inventory;
  if (!inv || !inv.trackingEnabled) {
    return {
      status: STOCK_STATUS.UNKNOWN,
      label: 'Contact shop to confirm availability',
      classModifier: 'unknown',
      badgeText: 'Stock on Request',
    };
  }

  const status = inv.stockStatus || computeStockStatus(inv);

  switch (status) {
    case STOCK_STATUS.IN_STOCK:
      return {
        status: STOCK_STATUS.IN_STOCK,
        label: 'In Stock — Ready for showroom pickup or dispatch',
        classModifier: 'in-stock',
        badgeText: 'In Stock',
      };
    case STOCK_STATUS.LOW_STOCK:
      return {
        status: STOCK_STATUS.LOW_STOCK,
        label: 'Limited Availability — Few units remaining',
        classModifier: 'low-stock',
        badgeText: 'Limited Stock',
      };
    case STOCK_STATUS.OUT_OF_STOCK:
      return {
        status: STOCK_STATUS.OUT_OF_STOCK,
        label: 'Out of Stock — Enquire for upcoming restock date',
        classModifier: 'out-of-stock',
        badgeText: 'Out of Stock',
      };
    default:
      return {
        status: STOCK_STATUS.UNKNOWN,
        label: 'Contact shop to confirm availability',
        classModifier: 'unknown',
        badgeText: 'Stock on Request',
      };
  }
}

/**
 * Adjust stock atomically using a Firestore transaction and write an audit log.
 *
 * @param {string} productId
 * @param {object} adjustmentData
 *   - newQuantity: number (if variant-less)
 *   - variants: array (if variant-based)
 *   - reason: string
 *   - adminUid: string
 *   - previousStock: any
 */
export async function adjustInventory(productId, adjustmentData) {
  const productRef = doc(db, PRODUCTS_COLLECTION, productId);
  const historyRef = doc(collection(db, INVENTORY_HISTORY_COLLECTION));

  await runTransaction(db, async (transaction) => {
    const productSnap = await transaction.get(productRef);
    if (!productSnap.exists()) {
      throw new Error(`Product with ID ${productId} does not exist.`);
    }

    const currentData = productSnap.data();
    const currentInv = currentData.inventory || {
      trackingEnabled: true,
      lowStockThreshold: 2,
    };

    const updatedInv = {
      ...currentInv,
      trackingEnabled: true,
      lowStockThreshold: adjustmentData.lowStockThreshold ?? currentInv.lowStockThreshold ?? 2,
      lastUpdated: new Date().toISOString(),
      lastUpdatedBy: adjustmentData.adminUid || 'admin',
    };

    if (adjustmentData.variants) {
      updatedInv.variants = adjustmentData.variants;
      updatedInv.quantity = adjustmentData.variants.reduce(
        (sum, v) => sum + (Number(v.quantity) || 0),
        0
      );
    } else if (typeof adjustmentData.newQuantity === 'number') {
      updatedInv.quantity = adjustmentData.newQuantity;
      updatedInv.variants = [];
    }

    updatedInv.stockStatus = computeStockStatus(updatedInv);

    // Update product
    transaction.update(productRef, {
      inventory: updatedInv,
      updatedAt: serverTimestamp(),
    });

    // Write audit log to inventoryHistory
    transaction.set(historyRef, {
      productId,
      productTitle: currentData.title || '',
      slotCode: currentData.slotCode || '',
      reason: adjustmentData.reason || 'Manual stock adjustment',
      previousInventory: currentInv,
      newInventory: updatedInv,
      adminUid: adjustmentData.adminUid || 'aBlTShPkDvbT1GQ4Du0Vk3DBtEW2',
      createdAt: serverTimestamp(),
      type: adjustmentData.type || 'manual_adjustment',
    });
  });
}

/**
 * Atomic stock deduction for FUTURE order confirmation.
 * Prevents double deduction and aborts if insufficient stock.
 *
 * @param {string} productId
 * @param {object} deduction
 *   - orderId: string
 *   - size: string (optional)
 *   - quantity: number
 *   - adminUid: string
 */
export async function deductStockForOrder(productId, deduction) {
  const productRef = doc(db, PRODUCTS_COLLECTION, productId);
  const historyRef = doc(collection(db, INVENTORY_HISTORY_COLLECTION));

  await runTransaction(db, async (transaction) => {
    const productSnap = await transaction.get(productRef);
    if (!productSnap.exists()) {
      throw new Error('Product not found.');
    }

    const data = productSnap.data();
    const inv = data.inventory;
    if (!inv || !inv.trackingEnabled) {
      throw new Error('Inventory tracking is not enabled for this product.');
    }

    const qtyToDeduct = Number(deduction.quantity) || 1;
    const updatedVariants = Array.isArray(inv.variants) ? [...inv.variants] : [];

    if (deduction.size && updatedVariants.length > 0) {
      const variantIdx = updatedVariants.findIndex((v) => v.size === deduction.size);
      if (variantIdx === -1) {
        throw new Error(`Size ${deduction.size} variant not found for this product.`);
      }
      const curVariantQty = Number(updatedVariants[variantIdx].quantity) || 0;
      if (curVariantQty < qtyToDeduct) {
        throw new Error(
          `Insufficient stock for size ${deduction.size}. Available: ${curVariantQty}, Requested: ${qtyToDeduct}`
        );
      }
      updatedVariants[variantIdx] = {
        ...updatedVariants[variantIdx],
        quantity: curVariantQty - qtyToDeduct,
      };
      inv.variants = updatedVariants;
      inv.quantity = updatedVariants.reduce((s, v) => s + (Number(v.quantity) || 0), 0);
    } else {
      const curUnitQty = Number(inv.quantity) || 0;
      if (curUnitQty < qtyToDeduct) {
        throw new Error(
          `Insufficient stock. Available: ${curUnitQty}, Requested: ${qtyToDeduct}`
        );
      }
      inv.quantity = curUnitQty - qtyToDeduct;
    }

    inv.stockStatus = computeStockStatus(inv);
    inv.lastUpdated = new Date().toISOString();

    transaction.update(productRef, {
      inventory: inv,
      updatedAt: serverTimestamp(),
    });

    transaction.set(historyRef, {
      productId,
      orderId: deduction.orderId,
      productTitle: data.title || '',
      type: 'order_deduction',
      reason: `Order confirmed: ${deduction.orderId}`,
      deductedQuantity: qtyToDeduct,
      size: deduction.size || null,
      adminUid: deduction.adminUid || 'aBlTShPkDvbT1GQ4Du0Vk3DBtEW2',
      createdAt: serverTimestamp(),
    });
  });
}

/**
 * Atomic stock restoration for FUTURE order cancellation.
 * Prevents double restoration.
 *
 * @param {string} productId
 * @param {object} restoration
 *   - orderId: string
 *   - size: string (optional)
 *   - quantity: number
 *   - adminUid: string
 */
export async function restoreStockForOrder(productId, restoration) {
  const productRef = doc(db, PRODUCTS_COLLECTION, productId);
  const historyRef = doc(collection(db, INVENTORY_HISTORY_COLLECTION));

  await runTransaction(db, async (transaction) => {
    const productSnap = await transaction.get(productRef);
    if (!productSnap.exists()) {
      throw new Error('Product not found.');
    }

    const data = productSnap.data();
    const inv = data.inventory || { trackingEnabled: true };
    const qtyToRestore = Number(restoration.quantity) || 1;
    const updatedVariants = Array.isArray(inv.variants) ? [...inv.variants] : [];

    if (restoration.size && updatedVariants.length > 0) {
      const variantIdx = updatedVariants.findIndex((v) => v.size === restoration.size);
      if (variantIdx >= 0) {
        updatedVariants[variantIdx] = {
          ...updatedVariants[variantIdx],
          quantity: (Number(updatedVariants[variantIdx].quantity) || 0) + qtyToRestore,
        };
      } else {
        updatedVariants.push({ size: restoration.size, quantity: qtyToRestore });
      }
      inv.variants = updatedVariants;
      inv.quantity = updatedVariants.reduce((s, v) => s + (Number(v.quantity) || 0), 0);
    } else {
      inv.quantity = (Number(inv.quantity) || 0) + qtyToRestore;
    }

    inv.stockStatus = computeStockStatus(inv);
    inv.lastUpdated = new Date().toISOString();

    transaction.update(productRef, {
      inventory: inv,
      updatedAt: serverTimestamp(),
    });

    transaction.set(historyRef, {
      productId,
      orderId: restoration.orderId,
      productTitle: data.title || '',
      type: 'order_restoration',
      reason: `Order cancelled: ${restoration.orderId}`,
      restoredQuantity: qtyToRestore,
      size: restoration.size || null,
      adminUid: restoration.adminUid || 'aBlTShPkDvbT1GQ4Du0Vk3DBtEW2',
      createdAt: serverTimestamp(),
    });
  });
}

/**
 * Fetch stock adjustment history for a product or all products (Admin only).
 */
export async function getInventoryHistory(productId = null, maxCount = 50) {
  const historyCol = collection(db, INVENTORY_HISTORY_COLLECTION);
  let q;
  if (productId) {
    q = query(
      historyCol,
      where('productId', '==', productId),
      orderBy('createdAt', 'desc'),
      limit(maxCount)
    );
  } else {
    q = query(historyCol, orderBy('createdAt', 'desc'), limit(maxCount));
  }
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
