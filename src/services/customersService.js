import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Stage 6.9 Customer Management Service (Admin only)
 *
 * Features:
 * - List all registered customers from `/users`
 * - Search by name or email
 * - View customer profile & preferences (wishlist, recent views, addresses)
 * - View enquiry history associated with customer UID
 * - View order history associated with customer UID
 * - Track customer activity for legitimate shop operations
 */

export async function getAllCustomers() {
  const usersCol = collection(db, 'users');
  const snap = await getDocs(usersCol);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      uid: d.id,
      displayName: data.displayName || 'Rider Member',
      email: data.email || 'No email registered',
      photoURL: data.photoURL || null,
      createdAt: data.createdAt || null,
      wishlistCount: Array.isArray(data.wishlist) ? data.wishlist.length : 0,
      recentViewedCount: Array.isArray(data.recentViewed) ? data.recentViewed.length : 0,
      addressesCount: Array.isArray(data.addresses) ? data.addresses.length : 0,
      addresses: Array.isArray(data.addresses) ? data.addresses : [],
      theme: data.theme || null,
    };
  });
}

export async function getCustomerDetails(userId) {
  if (!userId) return null;
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  const data = snap.data();

  // Fetch enquiries submitted by this customer
  let enquiries = [];
  try {
    const enqCol = collection(db, 'enquiries');
    const q = query(enqCol, where('userId', '==', userId));
    const enqSnap = await getDocs(q);
    enquiries = enqSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn('Could not fetch customer enquiries:', err.message);
  }

  // Fetch orders placed by this customer
  let orders = [];
  try {
    const ordersCol = collection(db, 'orders');
    const q = query(ordersCol, where('customer.uid', '==', userId), orderBy('createdAt', 'desc'));
    const orderSnap = await getDocs(q);
    orders = orderSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn('Could not fetch customer orders:', err.message);
  }

  return {
    uid: snap.id,
    ...data,
    enquiries,
    orders,
  };
}
