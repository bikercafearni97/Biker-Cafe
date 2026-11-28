/**
 * useShowroomProducts
 *
 * Fetches visible products from Firestore (showroomProducts collection).
 * Falls back to the static SHOWROOM_SLOTS array if Firestore is unavailable
 * or the collection is empty, so the public showroom is never broken.
 */
import { useEffect, useState } from 'react';
import { getPublicProducts } from '../services/productsService';
import { SHOWROOM_SLOTS } from '../data/showroomPlaceholders';

export function useShowroomProducts() {
  const [products, setProducts] = useState(null); // null = loading
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    getPublicProducts()
      .then((items) => {
        if (cancelled) return;
        // If Firestore returns empty (not yet seeded), fall back to static data
        setProducts(items.length > 0 ? items : SHOWROOM_SLOTS);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        // Any error (network, rules not deployed) → fall back to static data silently
        console.warn('[useShowroomProducts] Firestore unavailable, using static data:', err?.message);
        setProducts(SHOWROOM_SLOTS);
        setError(err);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    products: products ?? [], // empty array while loading
    loading: products === null,
    error,
    isStatic: products === SHOWROOM_SLOTS,
  };
}
