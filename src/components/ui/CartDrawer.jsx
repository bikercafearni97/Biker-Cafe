import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Bookmark,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import './CartDrawer.css';

export default function CartDrawer() {
  const {
    cartItems,
    isCartDrawerOpen,
    closeCartDrawer,
    updateQuantity,
    removeFromCart,
    saveForLater,
    subtotal,
    totalCount,
  } = useCart();

  return (
    <AnimatePresence>
      {isCartDrawerOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="cart-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCartDrawer}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <motion.aside
            className="cart-drawer-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            role="dialog"
            aria-modal="true"
            aria-label="Shopping Cart Drawer"
          >
            {/* Header */}
            <div className="cart-drawer-header">
              <div className="cart-drawer-header__title-group">
                <ShoppingBag size={18} className="cart-drawer-header__icon" />
                <span className="cart-drawer-header__title">Your Cart</span>
                <span className="cart-drawer-header__count">({totalCount})</span>
              </div>
              <button
                type="button"
                className="cart-drawer-close"
                onClick={closeCartDrawer}
                aria-label="Close cart drawer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="cart-drawer-body">
              {cartItems.length === 0 ? (
                <div className="cart-drawer-empty">
                  <ShoppingBag size={36} className="cart-drawer-empty__icon" />
                  <p className="cart-drawer-empty__title">Your cart is empty</p>
                  <p className="cart-drawer-empty__sub">
                    Explore our curated AXOR helmet lineup and add your preferred size to get started.
                  </p>
                  <Link
                    to="/showroom"
                    className="cart-drawer-empty__btn"
                    onClick={closeCartDrawer}
                  >
                    Browse Showroom
                  </Link>
                </div>
              ) : (
                <div className="cart-drawer-list">
                  {cartItems.map((item) => (
                    <div key={item.cartItemId} className="cart-item">
                      <Link
                        to={`/showroom/${item.id}`}
                        className="cart-item__media"
                        onClick={closeCartDrawer}
                      >
                        <img src={item.image} alt={item.title} className="cart-item__img" />
                      </Link>

                      <div className="cart-item__details">
                        <div className="cart-item__head">
                          <h4 className="cart-item__title">
                            <Link to={`/showroom/${item.id}`} onClick={closeCartDrawer}>
                              {item.title}
                            </Link>
                          </h4>
                          <button
                            type="button"
                            className="cart-item__del"
                            onClick={() => removeFromCart(item.cartItemId)}
                            aria-label={`Remove ${item.title} from cart`}
                            title="Remove item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div className="cart-item__variants">
                          <span className="cart-item__badge">Size: {item.selectedSize}</span>
                        </div>

                        <div className="cart-item__price-row">
                          <span className="cart-item__price">{item.priceLabel}</span>

                          {/* Quantity Controls */}
                          <div className="cart-item__qty-box">
                            <button
                              type="button"
                              className="cart-item__qty-btn"
                              onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                              aria-label="Decrease quantity"
                              disabled={item.quantity <= 1}
                            >
                              <Minus size={12} />
                            </button>
                            <span className="cart-item__qty-num">{item.quantity}</span>
                            <button
                              type="button"
                              className="cart-item__qty-btn"
                              onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                              aria-label="Increase quantity"
                              disabled={item.quantity >= 10}
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Save for Later Button */}
                        <div className="cart-item__actions">
                          <button
                            type="button"
                            className="cart-item__save-btn"
                            onClick={() => saveForLater(item.cartItemId)}
                          >
                            <Bookmark size={12} />
                            <span>Save for Later</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with Subtotal & Proceed */}
            {cartItems.length > 0 && (
              <div className="cart-drawer-footer">
                <div className="cart-drawer-subtotal">
                  <span className="cart-drawer-subtotal__label">Estimated Subtotal</span>
                  <span className="cart-drawer-subtotal__value">
                    ₹{subtotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <p className="cart-drawer-disclaimer">
                  Actual delivery charges confirmed by BIKER CAFE showroom upon order review.
                </p>

                <div className="cart-drawer-buttons">
                  <Link
                    to="/cart"
                    className="cart-drawer-btn cart-drawer-btn--secondary"
                    onClick={closeCartDrawer}
                  >
                    View Cart
                  </Link>

                  <Link
                    to="/checkout"
                    className="cart-drawer-btn cart-drawer-btn--primary"
                    onClick={closeCartDrawer}
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
