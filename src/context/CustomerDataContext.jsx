import { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useCustomerAuth } from './CustomerAuthContext';
import { validateAddress } from '../utils/addressValidation';

const WISHLIST_STORAGE_KEY = 'biker_cafe_wishlist';
const RECENT_STORAGE_KEY = 'biker_cafe_recent_viewed';
const COMPARE_STORAGE_KEY = 'biker_cafe_compare';
const ADDRESSES_STORAGE_KEY = 'biker_cafe_guest_addresses';

const CustomerDataContext = createContext({
  wishlist: [],
  toggleWishlist: () => {},
  isWishlisted: () => false,
  removeFromWishlist: () => {},
  recentViewed: [],
  recordView: () => {},
  compareList: [],
  addToCompare: () => {},
  removeFromCompare: () => {},
  clearCompare: () => {},
  isInCompare: () => false,
  mergePrompt: false,
  confirmMerge: () => {},
  dismissMerge: () => {},
  // Stage 6.6 Address Management
  addresses: [],
  addAddress: async () => {},
  updateAddress: async () => {},
  deleteAddress: async () => {},
  setDefaultAddress: async () => {},
  defaultAddress: null,
});

export function CustomerDataProvider({ children }) {
  const { user } = useCustomerAuth();

  const [wishlist, setWishlist] = useState(() => {
    try {
      const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [recentViewed, setRecentViewed] = useState(() => {
    try {
      const stored = localStorage.getItem(RECENT_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [compareList, setCompareList] = useState(() => {
    try {
      const stored = localStorage.getItem(COMPARE_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [addresses, setAddresses] = useState(() => {
    try {
      const stored = localStorage.getItem(ADDRESSES_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [mergePrompt, setMergePrompt] = useState(false);

  // Helper functions declared before effect
  const saveLocalWishlist = (items) => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  };

  const saveLocalRecent = (items) => {
    try {
      localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  };

  const saveLocalCompare = (items) => {
    try {
      localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  };

  const saveLocalAddresses = (items) => {
    try {
      localStorage.setItem(ADDRESSES_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  };

  const syncUserField = async (field, value) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { [field]: value }, { merge: true });
    } catch {
      // ignore
    }
  };

  // Sync with Firestore when user logs in
  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    const fetchUserData = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);

        if (snap.exists() && !cancelled) {
          const data = snap.data();
          const remoteWishlist = Array.isArray(data.wishlist) ? data.wishlist : [];
          const remoteRecent = Array.isArray(data.recentViewed) ? data.recentViewed : [];
          const remoteAddresses = Array.isArray(data.addresses) ? data.addresses : [];

          // Check if local guest wishlist has items not in remote
          try {
            const guestWishlist = JSON.parse(localStorage.getItem(WISHLIST_STORAGE_KEY) || '[]');
            if (Array.isArray(guestWishlist)) {
              const newItems = guestWishlist.filter((id) => !remoteWishlist.includes(id));
              if (newItems.length > 0) {
                setMergePrompt(true);
              }
            }
          } catch {
            // ignore
          }

          // Merge local and remote recently viewed items safely without dropping either
          let localRecent = [];
          try {
            const rawLocal = JSON.parse(localStorage.getItem(RECENT_STORAGE_KEY) || '[]');
            localRecent = Array.isArray(rawLocal) ? rawLocal : [];
          } catch {
            localRecent = [];
          }

          // Deduplicate by product ID, preserving highest/newest timestamp
          const recentMap = new Map();
          [...remoteRecent, ...localRecent].forEach((item) => {
            if (!item || !item.id) return;
            const existing = recentMap.get(item.id);
            if (!existing) {
              recentMap.set(item.id, item);
            } else {
              const existingTime = Number(existing.timestamp) || 0;
              const itemTime = Number(item.timestamp) || 0;
              if (itemTime > existingTime) {
                recentMap.set(item.id, item);
              }
            }
          });

          // Sort newest first and limit to 8
          const mergedRecent = Array.from(recentMap.values())
            .sort((a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0))
            .slice(0, 8);

          setWishlist(remoteWishlist);
          setRecentViewed(mergedRecent);
          saveLocalRecent(mergedRecent);

          // Handle addresses from Firestore
          if (remoteAddresses.length > 0) {
            setAddresses(remoteAddresses);
            saveLocalAddresses(remoteAddresses);
          } else {
            // If remote is empty but guest has local address, preserve local
            const localAddrs = JSON.parse(localStorage.getItem(ADDRESSES_STORAGE_KEY) || '[]');
            if (Array.isArray(localAddrs) && localAddrs.length > 0) {
              setAddresses(localAddrs);
              syncUserField('addresses', localAddrs);
            }
          }

          // If local items were added to remote, sync back to Firestore
          if (mergedRecent.length > 0 && mergedRecent.length !== remoteRecent.length) {
            syncUserField('recentViewed', mergedRecent);
          }
        }
      } catch {
        // ignore offline errors
      }
    };

    fetchUserData();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Wishlist actions
  const toggleWishlist = (productId) => {
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      const next = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
      saveLocalWishlist(next);
      syncUserField('wishlist', next);
      return next;
    });
  };

  const removeFromWishlist = (productId) => {
    setWishlist((prev) => {
      const next = prev.filter((id) => id !== productId);
      saveLocalWishlist(next);
      syncUserField('wishlist', next);
      return next;
    });
  };

  const isWishlisted = (productId) => wishlist.includes(productId);

  // Merge Guest Wishlist on Login
  const confirmMerge = () => {
    try {
      const guestItems = JSON.parse(localStorage.getItem(WISHLIST_STORAGE_KEY) || '[]');
      setWishlist((prev) => {
        const merged = Array.from(new Set([...prev, ...guestItems]));
        saveLocalWishlist(merged);
        syncUserField('wishlist', merged);
        return merged;
      });
    } catch {
      // ignore
    }
    setMergePrompt(false);
  };

  const dismissMerge = () => {
    setMergePrompt(false);
  };

  // Recently Viewed (Max 8 items, unique)
  const recordView = (product) => {
    if (!product || !product.id) return;
    setRecentViewed((prev) => {
      const filtered = prev.filter((item) => (typeof item === 'string' ? item !== product.id : item.id !== product.id));
      const next = [
        {
          id: product.id,
          title: product.title,
          image: product.image,
          category: product.category,
          priceLabel: product.priceLabel,
          timestamp: Date.now(),
        },
        ...filtered,
      ].slice(0, 8);
      saveLocalRecent(next);
      syncUserField('recentViewed', next);
      return next;
    });
  };

  // Compare List (Max 3 items)
  const addToCompare = (product) => {
    if (!product || !product.id) return { success: false, reason: 'Invalid product' };
    if (compareList.some((p) => p.id === product.id)) {
      return { success: false, reason: 'Product already in comparison' };
    }
    if (compareList.length >= 3) {
      return { success: false, reason: 'Comparison limit reached (maximum 3 helmets)' };
    }
    const next = [...compareList, product];
    setCompareList(next);
    saveLocalCompare(next);
    return { success: true };
  };

  const removeFromCompare = (productId) => {
    const next = compareList.filter((p) => p.id !== productId);
    setCompareList(next);
    saveLocalCompare(next);
  };

  const clearCompare = () => {
    setCompareList([]);
    saveLocalCompare([]);
  };

  const isInCompare = (productId) => compareList.some((p) => p.id === productId);

  // Stage 6.6 Address Management Methods
  const addAddress = async (newAddr) => {
    const validation = validateAddress(newAddr);
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    const id = `addr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const isFirst = addresses.length === 0;
    const shouldBeDefault = Boolean(newAddr.isDefault || isFirst);

    let updatedList = addresses.map((addr) => ({
      ...addr,
      isDefault: shouldBeDefault ? false : addr.isDefault,
    }));

    const cleanEntry = {
      id,
      fullName: newAddr.fullName.trim(),
      phone: newAddr.phone.toString().trim(),
      altPhone: newAddr.altPhone ? newAddr.altPhone.toString().trim() : '',
      houseNo: newAddr.houseNo.trim(),
      street: newAddr.street.trim(),
      area: newAddr.area.trim(),
      landmark: newAddr.landmark ? newAddr.landmark.trim() : '',
      city: newAddr.city.trim(),
      district: newAddr.district.trim(),
      state: newAddr.state.trim(),
      pinCode: newAddr.pinCode.toString().trim(),
      instructions: newAddr.instructions ? newAddr.instructions.trim() : '',
      label: newAddr.label || 'Home',
      isDefault: shouldBeDefault,
      updatedAt: Date.now(),
    };

    updatedList = [cleanEntry, ...updatedList];
    setAddresses(updatedList);
    saveLocalAddresses(updatedList);
    await syncUserField('addresses', updatedList);

    return { success: true, address: cleanEntry };
  };

  const updateAddress = async (id, updatedFields) => {
    const existing = addresses.find((a) => a.id === id);
    if (!existing) {
      return { success: false, errors: { general: 'Address not found' } };
    }

    const merged = { ...existing, ...updatedFields };
    const validation = validateAddress(merged);
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    const shouldBeDefault = Boolean(updatedFields.isDefault);

    const updatedList = addresses.map((addr) => {
      if (addr.id === id) {
        return {
          ...addr,
          fullName: merged.fullName.trim(),
          phone: merged.phone.toString().trim(),
          altPhone: merged.altPhone ? merged.altPhone.toString().trim() : '',
          houseNo: merged.houseNo.trim(),
          street: merged.street.trim(),
          area: merged.area.trim(),
          landmark: merged.landmark ? merged.landmark.trim() : '',
          city: merged.city.trim(),
          district: merged.district.trim(),
          state: merged.state.trim(),
          pinCode: merged.pinCode.toString().trim(),
          instructions: merged.instructions ? merged.instructions.trim() : '',
          label: merged.label || 'Home',
          isDefault: shouldBeDefault || addr.isDefault,
          updatedAt: Date.now(),
        };
      }
      return {
        ...addr,
        isDefault: shouldBeDefault ? false : addr.isDefault,
      };
    });

    setAddresses(updatedList);
    saveLocalAddresses(updatedList);
    await syncUserField('addresses', updatedList);

    return { success: true };
  };

  const deleteAddress = async (id) => {
    const target = addresses.find((a) => a.id === id);
    let updatedList = addresses.filter((a) => a.id !== id);

    // If deleting default address, promote first remaining address to default
    if (target?.isDefault && updatedList.length > 0) {
      updatedList = updatedList.map((addr, idx) => ({
        ...addr,
        isDefault: idx === 0,
      }));
    }

    setAddresses(updatedList);
    saveLocalAddresses(updatedList);
    await syncUserField('addresses', updatedList);
    return { success: true };
  };

  const setDefaultAddress = async (id) => {
    const updatedList = addresses.map((addr) => ({
      ...addr,
      isDefault: addr.id === id,
    }));

    setAddresses(updatedList);
    saveLocalAddresses(updatedList);
    await syncUserField('addresses', updatedList);
    return { success: true };
  };

  const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0] || null;

  return (
    <CustomerDataContext.Provider
      value={{
        wishlist,
        toggleWishlist,
        isWishlisted,
        removeFromWishlist,
        recentViewed,
        recordView,
        compareList,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
        mergePrompt,
        confirmMerge,
        dismissMerge,
        // Addresses
        addresses,
        addAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
        defaultAddress,
      }}
    >
      {children}
    </CustomerDataContext.Provider>
  );
}

export function useCustomerData() {
  return useContext(CustomerDataContext);
}
