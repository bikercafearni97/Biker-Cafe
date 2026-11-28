/**
 * homepageCmsService.js
 *
 * Provides Cloud Firestore CRUD operations for Homepage Content Management (CMS):
 * - Promotional Banners (Hero alerts, seasonal discounts, promotional cards)
 * - Announcement Ticker / Alert Bar (Top notification bar on homepage)
 * - Featured Product Slot overrides / Highlights
 *
 * Stored in `homepageContent` collection under dedicated document IDs or entries:
 * - `homepageContent/announcement` (single doc for top banner/ticker)
 * - `homepageContent/promotions` (list or items for promotional cards/banners)
 * - `homepageContent/highlights` (configurable highlight bullets)
 */

import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

export const CMS_DOCS = {
  ANNOUNCEMENT: 'announcement',
  PROMOTIONS: 'promotions',
  HIGHLIGHTS: 'highlights',
};

// Default fallback content so homepage is always rich and reliable even before admin edits
export const DEFAULT_CMS_CONTENT = {
  announcement: {
    enabled: true,
    text: '🏁 VISIT BIKER CAFE SHOWROOM IN ARNI — NEW 2026 AXOR HELMET BATCH NOW IN STOCK! FLAT 10% OFF ON ORDERS ABOVE ₹5,000 WITH CODE "RIDE2026" ⚡',
    linkText: 'Claim Offer',
    linkUrl: '/showroom',
    badge: 'NEW ARRIVALS',
    bgColor: '#161922',
    accentColor: '#e11d2a',
  },
  promotions: [
    {
      id: 'promo-1',
      title: 'SEASONAL RIDER OFFER',
      subtitle: 'Flat 10% Off On Certified Helmets',
      badge: 'LIMITED TIME',
      description: 'Upgrade your track and street protection with ECE 22.06 certified AXOR carbon and composite helmets.',
      imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=900&auto=format&fit=crop&q=80',
      ctaText: 'Explore Showroom',
      ctaLink: '/showroom',
      active: true,
      sortOrder: 1,
    },
    {
      id: 'promo-2',
      title: 'PRECISION VISOR UPGRADES',
      subtitle: 'Anti-Fog Pinlock 70 & Iridium Shields',
      badge: 'OPTICS GEAR',
      description: 'Zero optical distortion and anti-scratch UV coating engineered for night and rain riding.',
      imageUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=900&auto=format&fit=crop&q=80',
      ctaText: 'Find Your Helmet',
      ctaLink: '/helmet-finder',
      active: true,
      sortOrder: 2,
    },
  ],
  highlights: [
    {
      id: 'hl-1',
      title: '01 // VISOR OPTICS',
      detail: 'Pinlock 70 MaxVision Ready, Anti-Scratch UV400, Quick-Release System',
      active: true,
    },
    {
      id: 'hl-2',
      title: '02 // SHELL COMPOSITE',
      detail: 'High-Impact Polycarbonate / Carbon Fiber with Dual-Density EPS Liner',
      active: true,
    },
    {
      id: 'hl-3',
      title: '03 // TRACK VENTILATION',
      detail: 'Dual Chin Vent & Upper Exhaust Ports for High-Speed Dynamic Airflow',
      active: true,
    },
  ],
};

/**
 * Subscribe to real-time announcement bar configuration
 */
export function subscribeAnnouncementContent(onData) {
  try {
    const docRef = doc(db, 'homepageContent', CMS_DOCS.ANNOUNCEMENT);
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        onData({ ...DEFAULT_CMS_CONTENT.announcement, ...snap.data() });
      } else {
        onData(DEFAULT_CMS_CONTENT.announcement);
      }
    }, (error) => {
      console.warn('Real-time announcement listener error:', error?.message);
      onData(DEFAULT_CMS_CONTENT.announcement);
    });
  } catch (error) {
    console.warn('Failed to attach announcement listener:', error?.message);
    onData(DEFAULT_CMS_CONTENT.announcement);
    return () => {};
  }
}

/**
 * Fetch announcement bar configuration
 */
export async function getAnnouncementContent() {
  try {
    const docRef = doc(db, 'homepageContent', CMS_DOCS.ANNOUNCEMENT);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...DEFAULT_CMS_CONTENT.announcement, ...snap.data() };
    }
    return DEFAULT_CMS_CONTENT.announcement;
  } catch (error) {
    console.warn('Using default announcement content:', error);
    return DEFAULT_CMS_CONTENT.announcement;
  }
}

/**
 * Save announcement bar configuration (Admin only)
 */
export async function saveAnnouncementContent(data) {
  const docRef = doc(db, 'homepageContent', CMS_DOCS.ANNOUNCEMENT);
  const payload = {
    ...data,
    updatedAt: serverTimestamp(),
  };
  await setDoc(docRef, payload, { merge: true });
}

/**
 * Fetch promotional banners
 */
export async function getPromotionsContent() {
  try {
    const docRef = doc(db, 'homepageContent', CMS_DOCS.PROMOTIONS);
    const snap = await getDoc(docRef);
    if (snap.exists() && Array.isArray(snap.data()?.items)) {
      return snap.data().items;
    }
    return DEFAULT_CMS_CONTENT.promotions;
  } catch (error) {
    console.warn('Using default promotions content:', error);
    return DEFAULT_CMS_CONTENT.promotions;
  }
}

/**
 * Save promotional banners list (Admin only)
 */
export async function savePromotionsContent(items) {
  const docRef = doc(db, 'homepageContent', CMS_DOCS.PROMOTIONS);
  await setDoc(docRef, { items, updatedAt: serverTimestamp() });
}

/**
 * Fetch craft highlights
 */
export async function getHighlightsContent() {
  try {
    const docRef = doc(db, 'homepageContent', CMS_DOCS.HIGHLIGHTS);
    const snap = await getDoc(docRef);
    if (snap.exists() && Array.isArray(snap.data()?.items)) {
      return snap.data().items;
    }
    return DEFAULT_CMS_CONTENT.highlights;
  } catch (error) {
    console.warn('Using default highlights content:', error);
    return DEFAULT_CMS_CONTENT.highlights;
  }
}

/**
 * Save craft highlights (Admin only)
 */
export async function saveHighlightsContent(items) {
  const docRef = doc(db, 'homepageContent', CMS_DOCS.HIGHLIGHTS);
  await setDoc(docRef, { items, updatedAt: serverTimestamp() });
}
