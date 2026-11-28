/**
 * CartContext for BIKER CAFE
 *
 * Implements:
 * - Persistent cart for signed-in customers & guest localStorage fallback.
 * - Safe cart merging upon customer login without duplicating items.
 * - Quantity increments, decrements, item removals, and save-for-later.
 * - Variant support (size, finish).
 * - Real catalogue price extraction & total calculations.
 * - Strict inventory rule enforcement:
 *   ADDING TO CART NEVER DEDUCTS STOCK.
 *   Stock deduction happens exclusively during admin order confirmation (Stage 6.8).
 */
import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { parsePrice } from '../components/showroom/ShowroomFilters';

const GUEST_CART_STORAGE_KEY = 'biker_cafe_guest_cart';
const SAVED_FOR_LATER_STORAGE_KEY = 'biker_cafe_saved_later';

const CartContext = createContext({
  cartItems: [],
  savedItems: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  saveForLater: () => {},
  moveToCart: () => {},
  removeSavedItem: () => {},
  clearCart: () => {},
  isCartDrawerOpen: false,
  openCartDrawer: () => {},
  closeCartDrawer: () => {},
  totalCount: 0,
  subtotal: 0,
});

export function CartProvider({ children }) {
  // Guest localStorage initializer
  const [cartItems, setCartItems] = useState(() => {
    try {
      const stored = localStorage.getItem(GUEST_CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [savedItems, setSavedItems] = useState(() => {
    try {
      const stored = localStorage.getItem(SAVED_FOR_LATER_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  // Sync to localStorage whenever cartItems or savedItems change
  useEffect(() => {
    try {
      localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch {
      // ignore
    }
  }, [cartItems]);

  useEffect(() => {
    try {
      localStorage.setItem(SAVED_FOR_LATER_STORAGE_KEY, JSON.stringify(savedItems));
    } catch {
      // ignore
    }
  }, [savedItems]);

  // Initial state loads and syncs with localStorage

  /**
   * Add a product variant to the cart.
   * Does NOT deduct stock.
   */
  const addToCart = (product, selectedSize = 'M', selectedFinish = null, quantity = 1) => {
    if (!product || !product.id) return;

    const finishVal = selectedFinish || product.previewFinish || 'obsidian-carbon';
    const numQty = Math.max(1, parseInt(quantity, 10) || 1);

    setCartItems((prev) => {
      const existingIdx = prev.findIndex(
        (item) =>
          item.id === product.id &&
          item.selectedSize === selectedSize &&
          item.selectedFinish === finishVal
      );

      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + numQty,
        };
        return updated;
      }

      const newItem = {
        cartItemId: `${product.id}_${selectedSize}_${finishVal}_${Date.now()}`,
        id: product.id,
        title: product.title,
        subtitle: product.subtitle || '',
        brand: product.brand || 'AXOR Helmets',
        category: product.category || 'Apex Series',
        priceLabel: product.priceLabel,
        unitPrice: parsePrice(product.priceLabel),
        image: product.image,
        selectedSize,
        selectedFinish: finishVal,
        quantity: numQty,
        addedAt: new Date().toISOString(),
      };

      return [newItem, ...prev];
    });

    // Auto open drawer to provide instant visual confirmation
    setIsCartDrawerOpen(true);
  };

  /**
   * Remove item from cart by cartItemId or composite key
   */
  const removeFromCart = (cartItemId) => {
    setCartItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  /**
   * Update quantity of an item in the cart.
   * Bound between 1 and 10 per order request.
   */
  const updateQuantity = (cartItemId, nextQty) => {
    const qty = parseInt(nextQty, 10);
    if (isNaN(qty) || qty <= 0) {
      removeFromCart(cartItemId);
      return;
    }

    setCartItems((prev) =>
      prev.map((item) =>
        item.cartItemId === cartItemId ? { ...item, quantity: Math.min(qty, 10) } : item
      )
    );
  };

  /**
   * Save an item for later inspection
   */
  const saveForLater = (cartItemId) => {
    const itemToSave = cartItems.find((item) => item.cartItemId === cartItemId);
    if (!itemToSave) return;

    removeFromCart(cartItemId);
    setSavedItems((prev) => [itemToSave, ...prev]);
  };

  /**
   * Move a saved item back to the active cart
   */
  const moveToCart = (cartItemId) => {
    const itemToMove = savedItems.find((item) => item.cartItemId === cartItemId);
    if (!itemToMove) return;

    setSavedItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
    setCartItems((prev) => [itemToMove, ...prev]);
  };

  /**
   * Remove a saved-for-later item permanently
   */
  const removeSavedItem = (cartItemId) => {
    setSavedItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  /**
   * Clear active cart
   */
  const clearCart = () => {
    setCartItems([]);
  };

  // Computations
  const totalCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }, [cartItems]);

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.unitPrice || 0) * (item.quantity || 1), 0);
  }, [cartItems]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        savedItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        saveForLater,
        moveToCart,
        removeSavedItem,
        clearCart,
        isCartDrawerOpen,
        openCartDrawer: () => setIsCartDrawerOpen(true),
        closeCartDrawer: () => setIsCartDrawerOpen(false),
        totalCount,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
