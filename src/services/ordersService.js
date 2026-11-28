import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  getDoc,
  updateDoc,
  runTransaction,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';
import { CLIENT_PLACEHOLDER_INFO } from '../data/showroomPlaceholders';
import { PRODUCTS_COLLECTION } from './productsService';
import {
  INVENTORY_HISTORY_COLLECTION,
  computeStockStatus,
} from './inventoryService';
import { incrementCouponUsage } from './couponsService';
import { awardOrderPoints } from './loyaltyService';

/**
 * Stage 6.8 Order Lifecycle & Atomic Inventory Operations
 */

export const SHOWROOM_PICKUP_LOCATION = {
  name: CLIENT_PLACEHOLDER_INFO.businessName || 'BIKER CAFE',
  owner: CLIENT_PLACEHOLDER_INFO.ownerName || 'A. Narasimman',
  address: CLIENT_PLACEHOLDER_INFO.fullAddress || '123, Karthikeyan Road, Arni – 632301, T.V. Malai District, Tamil Nadu',
  phone: CLIENT_PLACEHOLDER_INFO.phone || '73958 56611',
  timing: '10:00 AM – 9:00 PM (All Days)',
  instructions: 'Please bring your Order ID and a valid photo ID when visiting the showroom to collect your gear.',
};

export const ORDER_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  READY_FOR_PICKUP: 'ready_for_pickup',
  SHIPPED: 'shipped',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
};

/**
 * Create Order (Customer or Guest)
 * Strictly zero stock deduction on submission.
 */
export async function createOrder({
  customer,
  items,
  deliveryMethod,
  deliveryAddress = null,
  pickupDetails = null,
  paymentMethod,
  customerNotes = '',
  coupon = null,
}) {
  if (!items || items.length === 0) {
    throw new Error('Order must contain at least one item');
  }

  const itemsSubtotal = items.reduce((sum, item) => {
    const unitPrice = Number(item.unitPrice) || 0;
    const qty = Number(item.quantity) || 1;
    return sum + unitPrice * qty;
  }, 0);

  const discountAmount = coupon ? Number(coupon.discountAmount) || 0 : 0;
  const netSubtotal = Math.max(0, itemsSubtotal - discountAmount);

  const cleanItems = items.map((item) => ({
    id: item.id,
    cartItemId: item.cartItemId || item.id,
    title: item.title,
    subtitle: item.subtitle || '',
    brand: item.brand || 'AXOR',
    image: item.image,
    selectedSize: item.selectedSize || 'M',
    selectedFinish: item.selectedFinish || 'gloss',
    unitPrice: Number(item.unitPrice) || 0,
    priceLabel: item.priceLabel || `₹${item.unitPrice}`,
    quantity: Number(item.quantity) || 1,
    lineTotal: (Number(item.unitPrice) || 0) * (Number(item.quantity) || 1),
  }));

  const orderRefCode = `BK-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

  const orderPayload = {
    orderRef: orderRefCode,
    status: ORDER_STATUSES.PENDING,
    deliveryMethod,
    paymentMethod,
    paymentStatus: 'pending',
    itemsSubtotal,
    discountAmount,
    coupon: coupon ? { code: coupon.code, discountAmount } : null,
    deliveryCharge: deliveryMethod === 'shop_pickup' ? 0 : null,
    deliveryChargeStatus: deliveryMethod === 'shop_pickup' ? 'not_applicable' : 'pending_quote',
    totalAmount: netSubtotal,
    itemsCount: cleanItems.reduce((acc, item) => acc + item.quantity, 0),
    items: cleanItems,
    customer: {
      uid: customer?.uid || null,
      isGuest: !customer?.uid,
      name: customer?.name || customer?.displayName || 'Guest Rider',
      email: customer?.email || '',
      phone: customer?.phone || '',
    },
    deliveryAddress: deliveryMethod === 'home_delivery' ? deliveryAddress : null,
    pickupLocation: deliveryMethod === 'shop_pickup' ? SHOWROOM_PICKUP_LOCATION : null,
    pickupDetails: deliveryMethod === 'shop_pickup' ? pickupDetails : null,
    customerNotes: customerNotes ? customerNotes.trim().slice(0, 300) : '',
    stockDeducted: false, // critical guard for zero double-deduction
    stockRestored: false, // critical guard for zero double-restoration
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    statusHistory: [
      {
        status: ORDER_STATUSES.PENDING,
        timestamp: Date.now(),
        note: coupon
          ? `Order submitted by customer with coupon ${coupon.code} (₹${discountAmount} off). Awaiting showroom review.`
          : 'Order submitted by customer. Awaiting showroom stock review.',
      },
    ],
  };

  const ordersCol = collection(db, 'orders');
  const docRef = await addDoc(ordersCol, orderPayload);

  // If coupon was applied, increment usage count
  if (coupon?.code) {
    incrementCouponUsage(coupon.code);
  }

  // Send admin notification
  try {
    const adminNotifCol = collection(db, 'adminNotifications');
    await addDoc(adminNotifCol, {
      type: 'new_order',
      title: `New Order: ${orderRefCode}`,
      message: `${orderPayload.customer.name} placed an order for ${orderPayload.itemsCount} item(s) via ${deliveryMethod === 'shop_pickup' ? 'Shop Pickup' : 'Home Delivery'} (${paymentMethod.toUpperCase()}).`,
      orderId: docRef.id,
      orderRef: orderRefCode,
      createdAt: serverTimestamp(),
      isRead: false,
    });
  } catch (err) {
    console.warn('Admin notification creation skipped:', err.message);
  }

  return {
    success: true,
    orderId: docRef.id,
    orderRef: orderRefCode,
    order: orderPayload,
  };
}

/**
 * Fetch all orders for the Admin Dashboard
 */
export async function getAllOrders() {
  const ordersCol = collection(db, 'orders');
  const q = query(ordersCol, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Fetch customer orders
 */
export async function getCustomerOrders(userId) {
  if (!userId) return [];
  try {
    const ordersCol = collection(db, 'orders');
    const q = query(
      ordersCol,
      where('customer.uid', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('Error fetching customer orders with ordering:', err);
    // Resilient fallback in case compound index is pending on Firestore:
    // Query by customer.uid alone and sort client-side
    try {
      const ordersCol = collection(db, 'orders');
      const fallbackQuery = query(
        ordersCol,
        where('customer.uid', '==', userId)
      );
      const snap = await getDocs(fallbackQuery);
      const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      return orders.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        return timeB - timeA;
      });
    } catch (fallbackErr) {
      console.error('Fallback query for customer orders also failed:', fallbackErr);
      return [];
    }
  }
}

/**
 * Real-time listener for customer orders
 * Automatically updates when admin confirms or advances order status.
 */
export function subscribeCustomerOrders(userId, onData, onError) {
  if (!userId) return () => {};

  const ordersCol = collection(db, 'orders');
  
  // Try indexed query first
  try {
    const q = query(
      ordersCol,
      where('customer.uid', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        onData(items);
      },
      (err) => {
        console.warn('subscribeCustomerOrders indexed listener failed, trying fallback:', err.message);
        // Fallback without orderBy in case composite index is not deployed yet
        const fallbackQ = query(
          ordersCol,
          where('customer.uid', '==', userId)
        );
        return onSnapshot(
          fallbackQ,
          (fallbackSnap) => {
            const items = fallbackSnap.docs.map((docSnap) => ({
              id: docSnap.id,
              ...docSnap.data(),
            }));
            items.sort((a, b) => {
              const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
              const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
              return timeB - timeA;
            });
            onData(items);
          },
          (fallbackError) => {
            if (onError) onError(fallbackError);
          }
        );
      }
    );
  } catch (err) {
    if (onError) onError(err);
    return () => {};
  }
}

export async function getOrderById(orderId) {
  if (!orderId) return null;
  const docRef = doc(db, 'orders', orderId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Real-time listener for a single order (for live tracking modal or page)
 */
export function subscribeOrderById(orderId, onData, onError) {
  if (!orderId) return () => {};
  const docRef = doc(db, 'orders', orderId);
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        onData({ id: snap.id, ...snap.data() });
      } else {
        onData(null);
      }
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}

/**
 * ADMIN: Confirm Order with Atomic Inventory Validation & Stock Deduction
 *
 * Requirements:
 * - Admin confirmation validates physical available stock.
 * - If insufficient stock, confirmation is BLOCKED with a clear user message.
 * - Deducts stock atomically via Firestore transaction.
 * - Prevents double deduction (`stockDeducted: true`).
 * - Emits audit logs in `inventoryHistory`.
 * - Updates order delivery charge if entered.
 * - Preserves coupon discounts when computing final total.
 */
export async function confirmOrderWithStockDeduction(orderId, { deliveryCharge = null, adminUid = 'aBlTShPkDvbT1GQ4Du0Vk3DBtEW2' } = {}) {
  const orderRef = doc(db, 'orders', orderId);

  return await runTransaction(db, async (transaction) => {
    const orderSnap = await transaction.get(orderRef);
    if (!orderSnap.exists()) {
      throw new Error('Order not found');
    }
    const order = orderSnap.data();

    if (order.status !== ORDER_STATUSES.PENDING) {
      throw new Error(`Order cannot be confirmed from status "${order.status}". Only pending orders can be confirmed.`);
    }

    if (order.stockDeducted) {
      throw new Error('Stock has already been deducted for this order.');
    }

    // 1. Read all product docs to check inventory
    const productDocs = {};
    for (const item of (order.items || [])) {
      if (!item.id) continue;
      const pRef = doc(db, PRODUCTS_COLLECTION, item.id);
      const pSnap = await transaction.get(pRef);
      if (pSnap.exists()) {
        productDocs[item.id] = { ref: pRef, data: pSnap.data() };
      }
    }

    // 2. Validate stock availability for each item
    for (const item of (order.items || [])) {
      const p = productDocs[item.id];
      if (p && p.data && p.data.inventory && p.data.inventory.trackingEnabled) {
        const inv = p.data.inventory;
        const variants = Array.isArray(inv.variants) ? inv.variants : [];
        const requestedQty = Number(item.quantity) || 1;

        if (item.selectedSize && variants.length > 0) {
          const v = variants.find((variant) => variant.size === item.selectedSize);
          const available = v ? Number(v.quantity) || 0 : 0;
          if (available < requestedQty) {
            throw new Error(
              `Insufficient stock for "${item.title}" (Size: ${item.selectedSize}). Available: ${available}, Required: ${requestedQty}`
            );
          }
        } else {
          const available = Number(inv.quantity) || 0;
          if (available < requestedQty) {
            throw new Error(
              `Insufficient stock for "${item.title}". Available: ${available}, Required: ${requestedQty}`
            );
          }
        }
      }
    }

    // 3. Deduct stock and record history logs
    for (const item of (order.items || [])) {
      const p = productDocs[item.id];
      if (p && p.data && p.data.inventory && p.data.inventory.trackingEnabled) {
        const inv = { ...p.data.inventory };
        const variants = Array.isArray(inv.variants) ? [...inv.variants] : [];
        const requestedQty = Number(item.quantity) || 1;

        if (item.selectedSize && variants.length > 0) {
          const vIdx = variants.findIndex((variant) => variant.size === item.selectedSize);
          if (vIdx >= 0) {
            variants[vIdx] = {
              ...variants[vIdx],
              quantity: Math.max(0, (Number(variants[vIdx].quantity) || 0) - requestedQty),
            };
          }
          inv.variants = variants;
          inv.quantity = variants.reduce((s, v) => s + (Number(v.quantity) || 0), 0);
        } else {
          inv.quantity = Math.max(0, (Number(inv.quantity) || 0) - requestedQty);
        }

        inv.stockStatus = computeStockStatus(inv);
        inv.lastUpdated = new Date().toISOString();

        transaction.update(p.ref, {
          inventory: inv,
          updatedAt: serverTimestamp(),
        });

        const historyRef = doc(collection(db, INVENTORY_HISTORY_COLLECTION));
        transaction.set(historyRef, {
          productId: item.id,
          orderId,
          orderRef: order.orderRef,
          productTitle: item.title,
          type: 'order_deduction',
          reason: `Order confirmed: ${order.orderRef}`,
          deductedQuantity: requestedQty,
          size: item.selectedSize || null,
          adminUid,
          createdAt: serverTimestamp(),
        });
      }
    }

    // 4. Update Order Document
    // Preserve coupon discount if present: net = itemsSubtotal - discountAmount
    const numericDeliveryCharge = deliveryCharge !== null ? Number(deliveryCharge) : (Number(order.deliveryCharge) || 0);
    const discountAmount = Number(order.discountAmount) || 0;
    const netSubtotal = Math.max(0, (Number(order.itemsSubtotal) || 0) - discountAmount);
    const finalTotal = netSubtotal + numericDeliveryCharge;

    const updatedHistory = [
      ...(order.statusHistory || []),
      {
        status: ORDER_STATUSES.CONFIRMED,
        timestamp: Date.now(),
        note: `Order confirmed by showroom admin. Stock deducted. Delivery charge: ₹${numericDeliveryCharge}.`,
      },
    ];

    transaction.update(orderRef, {
      status: ORDER_STATUSES.CONFIRMED,
      deliveryCharge: numericDeliveryCharge,
      deliveryChargeStatus: 'confirmed',
      totalAmount: finalTotal,
      stockDeducted: true,
      statusHistory: updatedHistory,
      updatedAt: serverTimestamp(),
    });

    return { success: true, finalTotal };
  });
}

/**
 * ADMIN: Cancel Order with Atomic Stock Restoration
 * - Restores stock ONLY if stock was previously deducted.
 * - Prevents double-restoration (`stockRestored: true`).
 */
export async function cancelOrderWithStockRestoration(orderId, { reason = 'Cancelled by admin', adminUid = 'aBlTShPkDvbT1GQ4Du0Vk3DBtEW2' }) {
  const orderRef = doc(db, 'orders', orderId);

  return await runTransaction(db, async (transaction) => {
    const orderSnap = await transaction.get(orderRef);
    if (!orderSnap.exists()) throw new Error('Order not found');
    const order = orderSnap.data();

    if (order.status === ORDER_STATUSES.CANCELLED || order.status === ORDER_STATUSES.REJECTED) {
      throw new Error(`Order is already ${order.status}`);
    }

    // If stock was deducted and NOT yet restored, restore it atomically
    if (order.stockDeducted && !order.stockRestored) {
      for (const item of order.items) {
        const pRef = doc(db, PRODUCTS_COLLECTION, item.id);
        const pSnap = await transaction.get(pRef);
        if (pSnap.exists()) {
          const pData = pSnap.data();
          const inv = pData.inventory || { trackingEnabled: true };
          const variants = Array.isArray(inv.variants) ? [...inv.variants] : [];
          const qtyToRestore = Number(item.quantity) || 1;

          if (item.selectedSize && variants.length > 0) {
            const vIdx = variants.findIndex((v) => v.size === item.selectedSize);
            if (vIdx >= 0) {
              variants[vIdx] = {
                ...variants[vIdx],
                quantity: (Number(variants[vIdx].quantity) || 0) + qtyToRestore,
              };
            } else {
              variants.push({ size: item.selectedSize, quantity: qtyToRestore });
            }
            inv.variants = variants;
            inv.quantity = variants.reduce((s, v) => s + (Number(v.quantity) || 0), 0);
          } else {
            inv.quantity = (Number(inv.quantity) || 0) + qtyToRestore;
          }

          inv.stockStatus = computeStockStatus(inv);
          inv.lastUpdated = new Date().toISOString();

          transaction.update(pRef, {
            inventory: inv,
            updatedAt: serverTimestamp(),
          });

          const historyRef = doc(collection(db, INVENTORY_HISTORY_COLLECTION));
          transaction.set(historyRef, {
            productId: item.id,
            orderId,
            orderRef: order.orderRef,
            productTitle: item.title,
            type: 'order_restoration',
            reason: `Order cancelled (${reason})`,
            restoredQuantity: qtyToRestore,
            size: item.selectedSize || null,
            adminUid,
            createdAt: serverTimestamp(),
          });
        }
      }
    }

    const updatedHistory = [
      ...(order.statusHistory || []),
      {
        status: ORDER_STATUSES.CANCELLED,
        timestamp: Date.now(),
        note: reason,
      },
    ];

    transaction.update(orderRef, {
      status: ORDER_STATUSES.CANCELLED,
      cancellationReason: reason,
      stockRestored: Boolean(order.stockDeducted),
      statusHistory: updatedHistory,
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  });
}

/**
 * ADMIN: Reject unconfirmed order
 * Since it was never confirmed, no stock is restored.
 */
export async function rejectOrder(orderId, reason = 'Order rejected by showroom') {
  const orderRef = doc(db, 'orders', orderId);
  const snap = await getDoc(orderRef);
  if (!snap.exists()) throw new Error('Order not found');
  const order = snap.data();

  if (order.status !== ORDER_STATUSES.PENDING) {
    throw new Error('Only pending orders can be rejected.');
  }

  const updatedHistory = [
    ...(order.statusHistory || []),
    {
      status: ORDER_STATUSES.REJECTED,
      timestamp: Date.now(),
      note: reason,
    },
  ];

  await updateDoc(orderRef, {
    status: ORDER_STATUSES.REJECTED,
    rejectionReason: reason,
    statusHistory: updatedHistory,
    updatedAt: serverTimestamp(),
  });

  return { success: true };
}

export async function cancelOrder(orderId, reason = 'Cancelled by customer') {
  return cancelOrderWithStockRestoration(orderId, {
    reason,
    adminUid: 'customer',
  });
}
export async function updateOrderStatus(orderId, nextStatus, note = '') {
  const orderRef = doc(db, 'orders', orderId);
  const snap = await getDoc(orderRef);
  if (!snap.exists()) throw new Error('Order not found');
  const order = snap.data();

  const updatedHistory = [
    ...(order.statusHistory || []),
    {
      status: nextStatus,
      timestamp: Date.now(),
      note: note || `Order status updated to ${nextStatus}`,
    },
  ];

  const updateFields = {
    status: nextStatus,
    statusHistory: updatedHistory,
    updatedAt: serverTimestamp(),
  };

  // If status is delivered and payment was COD, mark payment as received
  if (nextStatus === ORDER_STATUSES.DELIVERED && order.paymentMethod === 'cod') {
    updateFields.paymentStatus = 'received';
  }

  // Award loyalty points on delivery if customer is registered
  if (nextStatus === ORDER_STATUSES.DELIVERED && order.customer?.uid) {
    try {
      await awardOrderPoints(
        order.customer.uid,
        orderId,
        order.totalAmount || order.itemsSubtotal,
        order.orderRef
      );
    } catch (err) {
      console.warn('Failed to award loyalty points:', err);
    }
  }

  await updateDoc(orderRef, updateFields);
  return { success: true };
}

/**
 * ADMIN: Update Payment Status (with audit log)
 */
export async function updateOrderPaymentStatus(orderId, paymentStatus, note = '') {
  const orderRef = doc(db, 'orders', orderId);
  const snap = await getDoc(orderRef);
  if (!snap.exists()) throw new Error('Order not found');
  const order = snap.data();

  const updatedHistory = [
    ...(order.statusHistory || []),
    {
      status: order.status,
      timestamp: Date.now(),
      note: `Payment status changed to ${paymentStatus}. ${note}`.trim(),
    },
  ];

  await updateDoc(orderRef, {
    paymentStatus,
    statusHistory: updatedHistory,
    updatedAt: serverTimestamp(),
  });

  return { success: true };
}
