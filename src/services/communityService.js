/**
 * communityService.js
 *
 * Provides Cloud Firestore interactions for the BIKER CAFE Rider Community:
 * - Community Posts / Riding Stories (`communityPosts` collection)
 * - Rider Meetups & Events (`communityEvents` collection)
 * - Post Likes & Comments
 * - Admin Moderation (Approve, Pin, Hide, Delete)
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '../firebase';

export const POST_CATEGORIES = [
  { id: 'all', label: 'All Stories' },
  { id: 'ride-story', label: 'Ride Stories' },
  { id: 'gear-review', label: 'Gear Experiences' },
  { id: 'route-guide', label: 'Routes & Destinations' },
  { id: 'bike-mods', label: 'Bike Modifications' },
];

/**
 * Get approved community posts (or all for admin)
 */
export async function getCommunityPosts({ category = 'all', includePending = false, maxLimit = 30 } = {}) {
  try {
    const postsRef = collection(db, 'communityPosts');
    let q;

    if (includePending) {
      if (category && category !== 'all') {
        q = query(postsRef, where('category', '==', category), orderBy('createdAt', 'desc'), limit(maxLimit));
      } else {
        q = query(postsRef, orderBy('createdAt', 'desc'), limit(maxLimit));
      }
    } else {
      if (category && category !== 'all') {
        q = query(
          postsRef,
          where('status', '==', 'approved'),
          where('category', '==', category),
          orderBy('createdAt', 'desc'),
          limit(maxLimit)
        );
      } else {
        q = query(
          postsRef,
          where('status', '==', 'approved'),
          orderBy('createdAt', 'desc'),
          limit(maxLimit)
        );
      }
    }

    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.warn('Error fetching community posts:', error);
    return [];
  }
}

/**
 * Create a new rider story / community post
 */
export async function createCommunityPost(user, postData) {
  if (!user || !user.uid) throw new Error('You must be signed in to share your story.');
  
  const postsRef = collection(db, 'communityPosts');
  const payload = {
    userId: user.uid,
    authorName: user.displayName || 'Anonymous Rider',
    authorPhoto: user.photoURL || '',
    title: (postData.title || '').trim(),
    category: postData.category || 'ride-story',
    location: (postData.location || '').trim(),
    motorcycle: (postData.motorcycle || '').trim(),
    helmetUsed: (postData.helmetUsed || '').trim(),
    content: (postData.content || '').trim(),
    images: Array.isArray(postData.images) ? postData.images : [],
    likes: [],
    likeCount: 0,
    commentCount: 0,
    comments: [],
    isPinned: false,
    status: 'approved', // Auto-approved by default for friendly rider community, admin can moderate/hide
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(postsRef, payload);
  return { id: docRef.id, ...payload };
}

/**
 * Toggle like on a community post
 */
export async function togglePostLike(postId, userId) {
  if (!userId) throw new Error('Sign in required to like posts.');
  const postRef = doc(db, 'communityPosts', postId);
  const snap = await getDoc(postRef);
  if (!snap.exists()) throw new Error('Post not found');

  const likes = snap.data().likes || [];
  const hasLiked = likes.includes(userId);

  if (hasLiked) {
    await updateDoc(postRef, {
      likes: arrayRemove(userId),
      likeCount: increment(-1),
    });
    return false;
  } else {
    await updateDoc(postRef, {
      likes: arrayUnion(userId),
      likeCount: increment(1),
    });
    return true;
  }
}

/**
 * Add a comment to a community post
 */
export async function addPostComment(postId, user, commentText) {
  if (!user || !user.uid) throw new Error('Sign in required to comment.');
  const trimmed = (commentText || '').trim();
  if (!trimmed) throw new Error('Comment cannot be empty.');

  const commentObj = {
    id: 'comm-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    userId: user.uid,
    authorName: user.displayName || 'Rider',
    authorPhoto: user.photoURL || '',
    text: trimmed,
    createdAt: new Date().toISOString(),
  };

  const postRef = doc(db, 'communityPosts', postId);
  await updateDoc(postRef, {
    comments: arrayUnion(commentObj),
    commentCount: increment(1),
  });

  return commentObj;
}

/**
 * Get Community Events & Meetups
 */
export async function getCommunityEvents() {
  try {
    const eventsRef = collection(db, 'communityEvents');
    const q = query(eventsRef, orderBy('eventDate', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.warn('Error fetching community events:', error);
    return [];
  }
}

/**
 * Create or save an event (Admin only)
 */
export async function saveCommunityEvent(eventData) {
  const eventsRef = collection(db, 'communityEvents');
  if (eventData.id) {
    const docRef = doc(db, 'communityEvents', eventData.id);
    await updateDoc(docRef, { ...eventData, updatedAt: serverTimestamp() });
    return eventData;
  } else {
    const payload = {
      title: eventData.title,
      description: eventData.description,
      location: eventData.location,
      destination: eventData.destination || '',
      eventDate: eventData.eventDate, // ISO string or readable date
      time: eventData.time || '06:00 AM',
      meetupPoint: eventData.meetupPoint || 'BIKER CAFE Showroom, Arni',
      distance: eventData.distance || '',
      bannerUrl: eventData.bannerUrl || '',
      attendees: [],
      attendeeCount: 0,
      status: 'upcoming',
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(eventsRef, payload);
    return { id: docRef.id, ...payload };
  }
}

/**
 * Delete a community event (Admin only)
 */
export async function deleteCommunityEvent(eventId) {
  const docRef = doc(db, 'communityEvents', eventId);
  await deleteDoc(docRef);
}

/**
 * RSVP / Join an event
 */
export async function toggleEventRsvp(eventId, user) {
  if (!user || !user.uid) throw new Error('Sign in required to RSVP.');
  const docRef = doc(db, 'communityEvents', eventId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) throw new Error('Event not found');

  const attendees = snap.data().attendees || [];
  const isAttending = attendees.some((a) => a.userId === user.uid);

  if (isAttending) {
    const updated = attendees.filter((a) => a.userId !== user.uid);
    await updateDoc(docRef, {
      attendees: updated,
      attendeeCount: increment(-1),
    });
    return false;
  } else {
    const attendee = {
      userId: user.uid,
      name: user.displayName || 'Rider',
      photoURL: user.photoURL || '',
      joinedAt: new Date().toISOString(),
    };
    await updateDoc(docRef, {
      attendees: arrayUnion(attendee),
      attendeeCount: increment(1),
    });
    return true;
  }
}

/**
 * Admin Moderation: Set post status (approved, hidden, rejected)
 */
export async function setPostStatus(postId, status) {
  const postRef = doc(db, 'communityPosts', postId);
  await updateDoc(postRef, { status, updatedAt: serverTimestamp() });
}

/**
 * Admin Moderation: Pin or Unpin post
 */
export async function togglePostPin(postId, currentPinState) {
  const postRef = doc(db, 'communityPosts', postId);
  await updateDoc(postRef, { isPinned: !currentPinState, updatedAt: serverTimestamp() });
}

/**
 * Admin Moderation: Delete post
 */
export async function deleteCommunityPost(postId) {
  const postRef = doc(db, 'communityPosts', postId);
  await deleteDoc(postRef);
}
