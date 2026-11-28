import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

export const REVIEWS_COLLECTION = 'productReviews';

/**
 * Stage 6.10 Customer Reviews & Ratings Service
 *
 * Rules:
 * - Product-specific reviews
 * - Star ratings (1 to 5)
 * - Review status: 'pending' (submitted) -> 'approved' (visible to public) -> 'hidden'
 * - Verified-purchase label only when customer has a completed/delivered order containing the product
 * - Customers can edit or report reviews
 * - Admin can approve, hide, moderate, or remove
 */

export async function checkVerifiedPurchase(userId, productId) {
  if (!userId || !productId) return false;
  try {
    const ordersCol = collection(db, 'orders');
    // Check if customer has any order with status 'delivered' containing this productId
    const q = query(
      ordersCol,
      where('customer.uid', '==', userId),
      where('status', '==', 'delivered')
    );
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      const order = d.data();
      if (Array.isArray(order.items) && order.items.some((item) => item.id === productId)) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

export async function submitProductReview({
  productId,
  productTitle,
  user,
  rating,
  title,
  comment,
}) {
  if (!user) throw new Error('You must be signed in to submit a review.');
  if (!rating || rating < 1 || rating > 5) throw new Error('Please select a star rating between 1 and 5.');
  if (!comment || comment.trim().length < 5) throw new Error('Review text must be at least 5 characters.');

  // Check verified purchase
  const isVerified = await checkVerifiedPurchase(user.uid, productId);

  // Check if customer already submitted a review for this product
  const reviewsCol = collection(db, REVIEWS_COLLECTION);
  const qExisting = query(
    reviewsCol,
    where('productId', '==', productId),
    where('userId', '==', user.uid)
  );
  const existingSnap = await getDocs(qExisting);
  if (!existingSnap.empty) {
    throw new Error('You have already submitted a review for this helmet model.');
  }

  const reviewPayload = {
    productId,
    productTitle: productTitle || 'AXOR Helmet',
    userId: user.uid,
    userName: user.displayName || 'Rider Member',
    userPhoto: user.photoURL || null,
    rating: Number(rating),
    title: title ? title.trim().slice(0, 100) : '',
    comment: comment.trim().slice(0, 1000),
    isVerifiedPurchase: isVerified,
    status: 'pending', // 'pending' | 'approved' | 'hidden'
    isReported: false,
    reportReason: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(reviewsCol, reviewPayload);
  return { success: true, id: docRef.id };
}

export async function getProductReviews(productId, includePending = false) {
  if (!productId) return [];
  try {
    const reviewsCol = collection(db, REVIEWS_COLLECTION);
    let q;
    if (includePending) {
      q = query(reviewsCol, where('productId', '==', productId), orderBy('createdAt', 'desc'));
    } else {
      q = query(
        reviewsCol,
        where('productId', '==', productId),
        where('status', '==', 'approved'),
        orderBy('createdAt', 'desc')
      );
    }
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn('Error fetching product reviews:', err.message);
    return [];
  }
}

export async function getAllReviewsForAdmin() {
  const reviewsCol = collection(db, REVIEWS_COLLECTION);
  const q = query(reviewsCol, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function setReviewStatus(reviewId, status) {
  const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);
  await updateDoc(reviewRef, {
    status,
    updatedAt: serverTimestamp(),
  });
  return { success: true };
}

export async function reportReview(reviewId, reason) {
  const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);
  await updateDoc(reviewRef, {
    isReported: true,
    reportReason: reason ? reason.trim().slice(0, 200) : 'Reported as inappropriate',
    updatedAt: serverTimestamp(),
  });
  return { success: true };
}

export async function deleteReview(reviewId) {
  const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);
  await deleteDoc(reviewRef);
  return { success: true };
}
