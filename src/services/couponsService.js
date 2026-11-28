import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from '../firebase';

export const COUPONS_COLLECTION = 'coupons';

/**
 * Stage 6.12 Coupon & Offers Service
 *
 * Types:
 * - 'percentage': discount = subtotal * (value / 100), bounded by maxDiscount
 * - 'fixed': discount = value (capped at subtotal)
 *
 * Fields:
 * - code: string (uppercase, e.g. 'AXOR10', 'BIKER500')
 * - type: 'percentage' | 'fixed'
 * - value: number (e.g. 10 for 10%, or 500 for ₹500)
 * - minSpend: number (minimum subtotal required)
 * - maxDiscount: number | null (cap for percentage discounts)
 * - expiryDate: string (YYYY-MM-DD)
 * - usageLimit: number (e.g. 100 uses max)
 * - usedCount: number
 * - isActive: boolean
 * - description: string
 */

export async function getAllCoupons() {
  const colRef = collection(db, COUPONS_COLLECTION);
  const snap = await getDocs(colRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function saveCoupon(couponData) {
  const code = couponData.code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!code || code.length < 3) {
    throw new Error('Coupon code must be at least 3 alphanumeric characters');
  }

  const docRef = doc(db, COUPONS_COLLECTION, code);
  const payload = {
    code,
    type: couponData.type || 'percentage',
    value: Number(couponData.value) || 0,
    minSpend: Number(couponData.minSpend) || 0,
    maxDiscount: couponData.maxDiscount ? Number(couponData.maxDiscount) : null,
    expiryDate: couponData.expiryDate || null,
    usageLimit: couponData.usageLimit ? Number(couponData.usageLimit) : 100,
    usedCount: Number(couponData.usedCount) || 0,
    isActive: Boolean(couponData.isActive !== false),
    description: couponData.description ? couponData.description.trim().slice(0, 200) : '',
    updatedAt: serverTimestamp(),
  };

  await setDoc(docRef, payload, { merge: true });
  return { success: true, code };
}

export async function deleteCoupon(code) {
  const docRef = doc(db, COUPONS_COLLECTION, code.toUpperCase());
  await deleteDoc(docRef);
  return { success: true };
}

export async function toggleCouponActive(code, isActive) {
  const docRef = doc(db, COUPONS_COLLECTION, code.toUpperCase());
  await updateDoc(docRef, { isActive, updatedAt: serverTimestamp() });
  return { success: true };
}

/**
 * Validate and calculate coupon discount for checkout
 */
export async function validateCoupon(code, subtotal) {
  if (!code || typeof code !== 'string') {
    return { isValid: false, message: 'Please enter a coupon code.' };
  }

  const cleanCode = code.trim().toUpperCase();
  const docRef = doc(db, COUPONS_COLLECTION, cleanCode);
  const snap = await getDoc(docRef);

  if (!snap.exists()) {
    return { isValid: false, message: 'Invalid coupon code.' };
  }

  const coupon = snap.data();

  if (!coupon.isActive) {
    return { isValid: false, message: 'This coupon is currently inactive.' };
  }

  // Check expiry
  if (coupon.expiryDate) {
    const today = new Date().toISOString().split('T')[0];
    if (today > coupon.expiryDate) {
      return { isValid: false, message: 'This coupon has expired.' };
    }
  }

  // Check usage limit
  if (coupon.usageLimit && (coupon.usedCount || 0) >= coupon.usageLimit) {
    return { isValid: false, message: 'This coupon has reached its maximum usage limit.' };
  }

  // Check minimum spend
  if (coupon.minSpend && subtotal < coupon.minSpend) {
    return {
      isValid: false,
      message: `Minimum order amount of ₹${coupon.minSpend.toLocaleString('en-IN')} required for this coupon.`,
    };
  }

  // Calculate discount
  const calculatedDiscount =
    coupon.type === 'percentage'
      ? Math.round(subtotal * (coupon.value / 100))
      : coupon.value;

  const boundedDiscount =
    coupon.type === 'percentage' && coupon.maxDiscount && calculatedDiscount > coupon.maxDiscount
      ? coupon.maxDiscount
      : calculatedDiscount;

  // Cannot discount more than subtotal
  const discountAmount = Math.min(boundedDiscount, subtotal);

  return {
    isValid: true,
    code: cleanCode,
    type: coupon.type,
    value: coupon.value,
    discountAmount,
    coupon,
    message: `Coupon ${cleanCode} applied successfully!`,
  };
}

/**
 * Record usage increment when order is placed
 */
export async function incrementCouponUsage(code) {
  if (!code) return;
  try {
    const docRef = doc(db, COUPONS_COLLECTION, code.toUpperCase());
    await updateDoc(docRef, {
      usedCount: increment(1),
    });
  } catch (err) {
    console.warn('Coupon usage increment skipped:', err.message);
  }
}
