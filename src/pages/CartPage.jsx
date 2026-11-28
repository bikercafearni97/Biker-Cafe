import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bookmark,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import PageSeo from '../components/seo/PageSeo';
import './CartPage.css';

export default function CartPage() {
  const {
    cartItems,
    savedItems,
    updateQuantity,
    removeFromCart,
    saveForLater,
    moveToCart,
    removeSavedItem,
    clearCart,
    subtotal,
    totalCount,
  } = useCart();

  return (
    <div className="cart-page">
      <PageSeo
        title="Shopping Cart | BIKER CAFE — ARNI"
        description="Review your selected AXOR helmets and riding gear before checkout. Confirm physical showroom availability and delivery options."
        robots="noindex, follow"
      />

      <section className="cart-hero">
        <div className="container">
          <span className="eyebrow">BIKER CAFE // RIDER CHECKOUT</span>
          <h1 className="cart-hero__title">
            SHOPPING <span className="metallic-text">CART</span>
          </h1>
          <p className="cart-hero__copy">
            Review your selected helmet models and sizing before order submission. Physical stock
            is held at our Arni showroom and validated prior to confirmation.
          </p>
        </div>
      </section>

      <section className="cart-main section-pad">
        <div className="container cart-layout">
          {/* Left Column: Cart Items & Saved for Later */}
          <div className="cart-items-column">
            {/* Active Items */}
            <div className="cart-panel carbon-grid-bg">
              <div className="cart-panel__head">
                <div className="cart-panel__title-group">
                  <ShoppingBag size={18} className="cart-panel__icon" />
                  <h2 className="cart-panel__title">Active Items</h2>
                  <span className="cart-panel__badge">{totalCount} items</span>
                </div>
                {cartItems.length > 0 && (
                  <button
                    type="button"
                    className="cart-panel__clear-btn"
                    onClick={clearCart}
                  >
                    Clear Cart
                  </button>
                )}
              </div>

              {cartItems.length === 0 ? (
                <div className="cart-empty-box">
                  <ShoppingBag size={40} className="cart-empty-box__icon" />
                  <h3 className="cart-empty-box__title">Your shopping cart is empty</h3>
                  <p className="cart-empty-box__text">
                    Browse our AXOR showroom and select your size variant to add helmets to your cart.
                  </p>
                  <Link to="/showroom" className="cart-empty-box__btn">
                    Explore Showroom
                  </Link>
                </div>
              ) : (
                <div className="cart-item-list">
                  {cartItems.map((item) => (
                    <div key={item.cartItemId} className="cart-page-item">
                      <Link to={`/showroom/${item.id}`} className="cart-page-item__media">
                        <img src={item.image} alt={item.title} className="cart-page-item__img" />
                      </Link>

                      <div className="cart-page-item__content">
                        <div className="cart-page-item__header">
                          <div>
                            <span className="cart-page-item__brand">{item.brand}</span>
                            <h3 className="cart-page-item__title">
                              <Link to={`/showroom/${item.id}`}>{item.title}</Link>
                            </h3>
                            <p className="cart-page-item__sub">{item.subtitle}</p>
                          </div>
                          <span className="cart-page-item__price">{item.priceLabel}</span>
                        </div>

                        <div className="cart-page-item__meta">
                          <span className="cart-meta-tag">Size: {item.selectedSize}</span>
                          <span className="cart-meta-tag cart-meta-tag--finish">
                            Finish: {item.selectedFinish.replace('-', ' ')}
                          </span>
                        </div>

                        <div className="cart-page-item__actions">
                          {/* Quantity selector */}
                          <div className="cart-qty-control">
                            <button
                              type="button"
                              className="cart-qty-btn"
                              onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              aria-label="Decrease quantity"
                            >
                              <Minus size={13} />
                            </button>
                            <span className="cart-qty-val">{item.quantity}</span>
                            <button
                              type="button"
                              className="cart-qty-btn"
                              onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                              disabled={item.quantity >= 10}
                              aria-label="Increase quantity"
                            >
                              <Plus size={13} />
                            </button>
                          </div>

                          <button
                            type="button"
                            className="cart-tool-link"
                            onClick={() => saveForLater(item.cartItemId)}
                          >
                            <Bookmark size={13} />
                            <span>Save for Later</span>
                          </button>

                          <button
                            type="button"
                            className="cart-tool-link cart-tool-link--danger"
                            onClick={() => removeFromCart(item.cartItemId)}
                          >
                            <Trash2 size={13} />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Saved for Later Section */}
            {savedItems.length > 0 && (
              <div className="cart-panel carbon-grid-bg cart-panel--saved">
                <div className="cart-panel__head">
                  <div className="cart-panel__title-group">
                    <Bookmark size={18} className="cart-panel__icon" />
                    <h2 className="cart-panel__title">Saved for Later</h2>
                    <span className="cart-panel__badge">{savedItems.length} items</span>
                  </div>
                </div>

                <div className="cart-item-list">
                  {savedItems.map((item) => (
                    <div key={item.cartItemId} className="cart-page-item cart-page-item--saved">
                      <Link to={`/showroom/${item.id}`} className="cart-page-item__media">
                        <img src={item.image} alt={item.title} className="cart-page-item__img" />
                      </Link>

                      <div className="cart-page-item__content">
                        <div className="cart-page-item__header">
                          <div>
                            <span className="cart-page-item__brand">{item.brand}</span>
                            <h3 className="cart-page-item__title">
                              <Link to={`/showroom/${item.id}`}>{item.title}</Link>
                            </h3>
                            <span className="cart-meta-tag">Size: {item.selectedSize}</span>
                          </div>
                          <span className="cart-page-item__price">{item.priceLabel}</span>
                        </div>

                        <div className="cart-page-item__actions">
                          <button
                            type="button"
                            className="cart-action-btn cart-action-btn--primary"
                            onClick={() => moveToCart(item.cartItemId)}
                          >
                            Move to Cart
                          </button>
                          <button
                            type="button"
                            className="cart-tool-link cart-tool-link--danger"
                            onClick={() => removeSavedItem(item.cartItemId)}
                          >
                            <Trash2 size={13} />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Order Summary */}
          {cartItems.length > 0 && (
            <aside className="cart-summary-column">
              <div className="cart-summary-card carbon-grid-bg">
                <h3 className="cart-summary-title">Order Summary</h3>

                <div className="cart-summary-rows">
                  <div className="cart-summary-row">
                    <span>Items Total ({totalCount} units)</span>
                    <span className="cart-summary-val">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="cart-summary-row">
                    <span>Delivery Charge</span>
                    <span className="cart-summary-val cart-summary-val--quote">
                      Confirmed by Showroom
                    </span>
                  </div>
                </div>

                <div className="cart-summary-divider" />

                <div className="cart-summary-total">
                  <span>Estimated Total</span>
                  <span className="cart-summary-total__amount">
                    ₹{subtotal.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="cart-summary-notice">
                  <ShieldCheck size={16} className="cart-summary-notice__icon" />
                  <p>
                    <strong>Stock Guarantee Rule:</strong> Adding to cart does not deduct physical
                    stock. Inventory is verified and committed upon order confirmation.
                  </p>
                </div>

                <Link to="/checkout" className="cart-checkout-btn">
                  <span>Proceed to Checkout</span>
                  <ArrowRight size={16} />
                </Link>

                <Link to="/showroom" className="cart-continue-link">
                  <span>&larr; Continue Shopping</span>
                </Link>
              </div>
            </aside>
          )}
        </div>
      </section>
    </div>
  );
}
