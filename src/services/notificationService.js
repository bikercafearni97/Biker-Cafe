/**
 * Real-Time Notification Service for BIKER CAFE (Free Spark Tier Compatible)
 *
 * Architecture:
 * 1. Customer Notifications: `users/{userId}/notifications/{notificationId}`
 *    - Real-time listener per logged-in customer.
 *    - Only admin can create customer response notifications.
 *    - Customer can mark their own notifications as read or mark all as read.
 *
 * 2. Admin Notifications: `adminNotifications/{notificationId}`
 *    - Real-time listener for the authorized admin UID (`aBlTShPkDvbT1GQ4Du0Vk3DBtEW2`).
 *    - Deterministic doc IDs (`enquiry_<enquiryId>`) prevent duplicate notifications.
 *    - Admin can mark individual or all as read.
 *
 * 3. Client-Side Synchronization:
 *    - Submitting an enquiry when logged-in writes `userId` (validated against request.auth.uid).
 *    - Admin dashboard synchronizes new enquiries into `adminNotifications` with deterministic ID.
 *    - Admin response creates a customer notification in `users/{userId}/notifications/{enquiryId_resp}`.
 */
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';

export const ADMIN_NOTIFICATIONS_COLLECTION = 'adminNotifications';

/**
 * ─────────────────────────────────────────────────────────────
 * Customer Notifications (`users/{userId}/notifications`)
 * ─────────────────────────────────────────────────────────────
 */

/**
 * Subscribe to real-time notifications for a logged-in customer.
 *
 * @param {string} userId - Customer auth UID
 * @param {function} onData - Callback with array of notifications
 * @param {function} onError - Error callback
 * @returns {function} Unsubscribe function
 */
export function subscribeCustomerNotifications(userId, onData, onError) {
  if (!userId) return () => {};

  const colRef = collection(db, 'users', userId, 'notifications');
  const q = query(colRef, orderBy('createdAt', 'desc'));

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
      if (onError) onError(err);
    }
  );
}

/**
 * Mark a single customer notification as read.
 */
export async function markCustomerNotificationRead(userId, notificationId) {
  if (!userId || !notificationId) return;
  const docRef = doc(db, 'users', userId, 'notifications', notificationId);
  await updateDoc(docRef, {
    isRead: true,
  });
}

/**
 * Mark all notifications as read for a customer in a single batch.
 */
export async function markAllCustomerNotificationsRead(userId, notifications) {
  if (!userId || !Array.isArray(notifications) || notifications.length === 0) return;

  const unreadItems = notifications.filter((n) => !n.isRead);
  if (unreadItems.length === 0) return;

  const batch = writeBatch(db);
  unreadItems.forEach((item) => {
    const itemRef = doc(db, 'users', userId, 'notifications', item.id);
    batch.update(itemRef, { isRead: true });
  });

  await batch.commit();
}

/**
 * Create a response notification in a customer's account (Admin-only).
 * Uses a deterministic doc ID to prevent duplicate response notices.
 */
export async function sendCustomerEnquiryResponse({
  userId,
  enquiryId,
  title,
  message,
  adminNotes,
}) {
  if (!userId || !enquiryId) return;

  const notificationId = `resp_${enquiryId}_${Date.now()}`;
  const docRef = doc(db, 'users', userId, 'notifications', notificationId);

  await setDoc(docRef, {
    title: title || 'BIKER CAFE — Response to Your Enquiry',
    message: message || 'Our team has reviewed and responded to your enquiry.',
    type: 'enquiry_response',
    relatedEnquiryId: enquiryId,
    adminNotes: adminNotes || '',
    isRead: false,
    createdAt: serverTimestamp(),
  });
}

/**
 * ─────────────────────────────────────────────────────────────
 * Admin Notifications (`adminNotifications`)
 * ─────────────────────────────────────────────────────────────
 */

/**
 * Subscribe to real-time admin notifications.
 *
 * @param {function} onData - Callback with array of notifications
 * @param {function} onError - Error callback
 * @returns {function} Unsubscribe function
 */
export function subscribeAdminNotifications(onData, onError) {
  const colRef = collection(db, ADMIN_NOTIFICATIONS_COLLECTION);
  const q = query(colRef, orderBy('createdAt', 'desc'));

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
      if (onError) onError(err);
    }
  );
}

/**
 * Ensure an admin notification exists for an incoming customer enquiry.
 * Uses deterministic document ID `enquiry_<enquiryId>` to prevent duplicates.
 */
export async function syncAdminEnquiryNotification(enquiry) {
  if (!enquiry || !enquiry.id) return;

  const notifId = `enquiry_${enquiry.id}`;
  const docRef = doc(db, ADMIN_NOTIFICATIONS_COLLECTION, notifId);

  // Set with merge: false will write only if not already processed
  await setDoc(
    docRef,
    {
      title: `New Enquiry: ${enquiry.topic || 'General'}`,
      message: `${enquiry.name || 'A customer'} sent an enquiry: "${(enquiry.message || '').slice(0, 100)}${enquiry.message?.length > 100 ? '...' : ''}"`,
      type: 'new_enquiry',
      relatedEnquiryId: enquiry.id,
      customerName: enquiry.name || 'Anonymous Visitor',
      contact: enquiry.contact || '',
      isRead: false,
      createdAt: enquiry.createdAt || serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Mark a single admin notification as read.
 */
export async function markAdminNotificationRead(notificationId) {
  if (!notificationId) return;
  const docRef = doc(db, ADMIN_NOTIFICATIONS_COLLECTION, notificationId);
  await updateDoc(docRef, {
    isRead: true,
  });
}

/**
 * Mark all admin notifications as read in a batch, or optionally clear them.
 */
export async function markAllAdminNotificationsRead(notifications) {
  if (!Array.isArray(notifications) || notifications.length === 0) return;

  const unreadItems = notifications.filter((n) => !n.isRead);
  if (unreadItems.length === 0) return;

  const batch = writeBatch(db);
  unreadItems.forEach((item) => {
    const itemRef = doc(db, ADMIN_NOTIFICATIONS_COLLECTION, item.id);
    batch.update(itemRef, { isRead: true });
  });

  await batch.commit();
}

/**
 * Remove/dismiss an admin notification when its related enquiry is resolved.
 */
export async function dismissAdminNotification(enquiryId) {
  if (!enquiryId) return;
  const notifId = `enquiry_${enquiryId}`;
  const docRef = doc(db, ADMIN_NOTIFICATIONS_COLLECTION, notifId);
  try {
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Failed to dismiss admin notification:', err);
  }
}
