/**
 * loyaltyService.js
 *
 * Provides customer loyalty and rewards logic for BIKER CAFE:
 * - 1 Point per ₹100 spent on delivered orders
 * - Tier progression:
 *    - Rookie Rider (0 - 99 pts)
 *    - Street Veteran (100 - 299 pts) -> 5% discount conversion
 *    - Track Master (300+ pts) -> 10% discount conversion + priority showroom service
 * - Audit ledger: `pointsHistory` stored in user subcollection `/users/{userId}/loyaltyHistory`
 * - Point redemption for discount coupons
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from '../firebase';

export const LOYALTY_TIERS = {
  ROOKIE: {
    name: 'Rookie Rider',
    minPoints: 0,
    perk: 'Standard showroom rewards',
    badgeColor: '#a1a1aa',
  },
  VETERAN: {
    name: 'Street Veteran',
    minPoints: 100,
    perk: '5% bonus redemption value & early access to new helmet batches',
    badgeColor: '#38bdf8',
  },
  MASTER: {
    name: 'Track Master',
    minPoints: 300,
    perk: '10% bonus redemption value, priority sizing consultation & exclusive paddock events',
    badgeColor: '#e11d2a',
  },
};

export function computeLoyaltyTier(points = 0) {
  if (points >= LOYALTY_TIERS.MASTER.minPoints) return LOYALTY_TIERS.MASTER;
  if (points >= LOYALTY_TIERS.VETERAN.minPoints) return LOYALTY_TIERS.VETERAN;
  return LOYALTY_TIERS.ROOKIE;
}

/**
 * Get user's current loyalty points balance and history
 */
export async function getUserLoyalty(userId) {
  if (!userId) return { balance: 0, tier: LOYALTY_TIERS.ROOKIE, history: [] };

  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    const balance = userSnap.exists() ? Number(userSnap.data().loyaltyPoints) || 0 : 0;
    const tier = computeLoyaltyTier(balance);

    // Fetch history
    const historyRef = collection(db, 'users', userId, 'loyaltyHistory');
    const q = query(historyRef, orderBy('createdAt', 'desc'));
    const histSnap = await getDocs(q);
    const history = histSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    return { balance, tier, history };
  } catch (error) {
    console.warn('Error fetching loyalty data:', error);
    return { balance: 0, tier: LOYALTY_TIERS.ROOKIE, history: [] };
  }
}

/**
 * Award loyalty points on order completion (Admin or automated on delivered)
 * 1 point per ₹100 spent (rounded down)
 */
export async function awardOrderPoints(userId, orderId, orderTotal, orderRef) {
  if (!userId) return null;
  const pointsToAward = Math.floor(Number(orderTotal) / 100);
  if (pointsToAward <= 0) return null;

  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, { loyaltyPoints: increment(pointsToAward) }, { merge: true });

  const historyRef = collection(db, 'users', userId, 'loyaltyHistory');
  const entry = {
    type: 'earned',
    points: pointsToAward,
    orderId,
    orderRef: orderRef || orderId,
    description: `Earned from completed order ${orderRef || orderId}`,
    createdAt: serverTimestamp(),
  };
  await addDoc(historyRef, entry);

  return pointsToAward;
}

/**
 * Redeem loyalty points for a discount voucher
 * e.g. 50 points = ₹100 off
 */
export async function redeemLoyaltyPoints(userId, pointsToRedeem) {
  if (!userId) throw new Error('Sign in required to redeem points');
  const pts = Number(pointsToRedeem);
  if (pts <= 0) throw new Error('Invalid points amount');

  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) throw new Error('User not found');

  const currentPoints = Number(userSnap.data().loyaltyPoints) || 0;
  if (currentPoints < pts) {
    throw new Error(`Insufficient points balance. You have ${currentPoints} points.`);
  }

  // 1 point = ₹2 voucher value
  const voucherValue = pts * 2;
  const voucherCode = `RIDER-${Date.now().toString().slice(-4)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

  // Deduct points
  await updateDoc(userRef, {
    loyaltyPoints: increment(-pts),
  });

  // Log redemption history
  const historyRef = collection(db, 'users', userId, 'loyaltyHistory');
  await addDoc(historyRef, {
    type: 'redeemed',
    points: -pts,
    voucherValue,
    voucherCode,
    description: `Redeemed ${pts} points for ₹${voucherValue} voucher (${voucherCode})`,
    createdAt: serverTimestamp(),
  });

  // Also create a private coupon in coupons collection so they can use it immediately at checkout!
  const couponRef = doc(db, 'coupons', voucherCode);
  await setDoc(couponRef, {
    code: voucherCode,
    discountType: 'fixed',
    discountValue: voucherValue,
    minSpend: voucherValue * 2, // e.g. min spend ₹200 for ₹100 off
    description: `Rider Loyalty Voucher (₹${voucherValue} OFF)`,
    active: true,
    usageLimit: 1,
    usageCount: 0,
    forUserId: userId,
    createdAt: serverTimestamp(),
  });

  return { voucherCode, voucherValue };
}
