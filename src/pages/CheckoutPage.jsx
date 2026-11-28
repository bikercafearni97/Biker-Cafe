import { useState, useId } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Truck,
  Store,
  MapPin,
  CheckCircle,
  AlertCircle,
  Lock,
  ArrowRight,
  Info,
  CreditCard,
  Banknote,
  Tag,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { useCustomerData } from '../context/CustomerDataContext';
import AddressManager from '../components/address/AddressManager';
import { createOrder, SHOWROOM_PICKUP_LOCATION } from '../services/ordersService';
import { validateCoupon } from '../services/couponsService';
import PageSeo from '../components/seo/PageSeo';
import './CheckoutPage.css';

export default function CheckoutPage() {
  const { cartItems, subtotal, totalCount, clearCart } = useCart();
  const { user } = useCustomerAuth();
  const { addresses, defaultAddress } = useCustomerData();

  // Delivery options: 'home_delivery' | 'shop_pickup'
  const [deliveryMethod, setDeliveryMethod] = useState('home_delivery');

  // Selected address id
  const [selectedAddressId, setSelectedAddressId] = useState(() => {
    return defaultAddress ? defaultAddress.id : (addresses[0]?.id || null);
  });

  // Shop pickup details
  const [pickupDetails, setPickupDetails] = useState({
    pickupDate: '',
    pickupTimeSlot: 'afternoon',
    collectorName: user?.displayName || '',
    collectorPhone: '',
  });

  // Guest contact info if not signed in
  const [guestContact, setGuestContact] = useState({
    name: '',
    phone: '',
    email: '',
  });

  // Payment method: 'cod' | 'online'
  const [paymentMethod, setPaymentMethod] = useState('cod');

  // Customer additional notes
  const [customerNotes, setCustomerNotes] = useState('');

  // Coupon state (Stage 6.12)
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponFeedback, setCouponFeedback] = useState(null);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(null);

  // Form input unique IDs for accessibility
  const pickupDateId = useId();
  const pickupSlotId = useId();
  const pickupNameId = useId();
  const pickupPhoneId = useId();
  const guestNameId = useId();
  const guestPhoneId = useId();
  const guestEmailId = useId();
  const notesId = useId();

  // If cart is empty and no order has just been placed, redirect
  if (cartItems.length === 0 && !orderSuccess) {
    return (
      <div className="checkout-empty container section-pad">
        <PageSeo title="Checkout | BIKER CAFE" robots="noindex, nofollow" />
        <div className="checkout-empty__card">
          <Store size={44} className="checkout-empty__icon" />
          <h2>Your Cart is Empty</h2>
          <p>Add some helmets or riding gear to your cart before proceeding to checkout.</p>
          <Link to="/showroom" className="checkout-btn--primary">
            Explore Showroom
          </Link>
        </div>
      </div>
    );
  }

  // Active address object
  const activeAddress = addresses.find((a) => a.id === selectedAddressId) || defaultAddress || addresses[0] || null;

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;
    setCouponLoading(true);
    setCouponFeedback(null);
    try {
      const res = await validateCoupon(couponCodeInput, subtotal);
      if (res.isValid) {
        setAppliedCoupon(res);
        setCouponFeedback({ type: 'success', text: res.message });
      } else {
        setAppliedCoupon(null);
        setCouponFeedback({ type: 'error', text: res.message });
      }
    } catch {
      setCouponFeedback({ type: 'error', text: 'Failed to validate coupon code.' });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput('');
    setCouponFeedback(null);
  };

  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const netSubtotal = Math.max(0, subtotal - discountAmount);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Validation
    if (deliveryMethod === 'home_delivery') {
      if (!activeAddress) {
        setErrorMessage('Please add or select a delivery address for home delivery.');
        return;
      }
    } else {
      if (!pickupDetails.pickupDate) {
        setErrorMessage('Please select an estimated date for showroom pickup.');
        return;
      }
      if (!pickupDetails.collectorName || pickupDetails.collectorName.trim().length < 2) {
        setErrorMessage('Please enter the name of the person collecting the gear.');
        return;
      }
      if (!pickupDetails.collectorPhone || pickupDetails.collectorPhone.replace(/\D/g, '').length !== 10) {
        setErrorMessage('Please enter a valid 10-digit mobile number for pickup coordination.');
        return;
      }
    }

    if (!user) {
      if (!guestContact.name || guestContact.name.trim().length < 2) {
        setErrorMessage('Please enter your full name for order records.');
        return;
      }
      if (!guestContact.phone || guestContact.phone.replace(/\D/g, '').length !== 10) {
        setErrorMessage('Please enter a valid 10-digit mobile number.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const customerData = user
        ? {
            uid: user.uid,
            name: user.displayName || 'Customer',
            email: user.email || '',
            phone: activeAddress?.phone || '',
          }
        : {
            uid: null,
            name: guestContact.name.trim(),
            email: guestContact.email.trim(),
            phone: guestContact.phone.trim(),
          };

      const result = await createOrder({
        customer: customerData,
        items: cartItems,
        deliveryMethod,
        deliveryAddress: deliveryMethod === 'home_delivery' ? activeAddress : null,
        pickupDetails: deliveryMethod === 'shop_pickup' ? pickupDetails : null,
        paymentMethod,
        customerNotes,
        coupon: appliedCoupon ? { code: appliedCoupon.code, discountAmount } : null,
      });

      if (result.success) {
        setOrderSuccess(result);
        clearCart();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Order creation error:', err);
      setErrorMessage(err.message || 'Failed to place order. Please try again or reach out on WhatsApp.');
    } finally {
      setSubmitting(false);
    }
  };

  // Render Order Success Confirmation
  if (orderSuccess) {
    return (
      <div className="checkout-success-page section-pad container">
        <PageSeo title="Order Confirmed | BIKER CAFE" robots="noindex, nofollow" />
        <div className="checkout-success-card carbon-grid-bg">
          <div className="checkout-success__icon-box">
            <CheckCircle size={44} />
          </div>

          <span className="checkout-success__tag">ORDER SUBMITTED</span>
          <h1 className="checkout-success__title">THANK YOU FOR YOUR ORDER!</h1>
          <p className="checkout-success__ref">
            Order Reference: <strong>{orderSuccess.orderRef}</strong>
          </p>

          <p className="checkout-success__desc">
            Your order has been recorded in our showroom system. Our Arni team will review physical stock
            availability and contact you on WhatsApp / call to confirm the order details.
          </p>

          <div className="checkout-success__details">
            <div className="checkout-success__detail-block">
              <h3>Fulfillment Mode</h3>
              <p>
                {orderSuccess.order.deliveryMethod === 'shop_pickup'
                  ? 'Showroom Pickup at BIKER CAFE Arni'
                  : 'Home Delivery'}
              </p>
            </div>

            <div className="checkout-success__detail-block">
              <h3>Payment Method</h3>
              <p>
                {orderSuccess.order.paymentMethod === 'cod'
                  ? 'Cash on Delivery (Pay on Receipt)'
                  : 'Online Payment (Awaiting Showroom Confirmation)'}
              </p>
            </div>

            <div className="checkout-success__detail-block">
              <h3>Items Subtotal</h3>
              <p>₹{orderSuccess.order.itemsSubtotal.toLocaleString('en-IN')}</p>
            </div>

            <div className="checkout-success__detail-block">
              <h3>Delivery Charge</h3>
              <p>
                {orderSuccess.order.deliveryMethod === 'shop_pickup'
                  ? 'Free (Showroom Pickup)'
                  : 'Showroom will contact with exact quotation'}
              </p>
            </div>
          </div>

          <div className="checkout-success__actions">
            <Link to="/showroom" className="checkout-btn--primary">
              Continue Shopping
            </Link>
            {user && (
              <Link to="/profile" className="checkout-btn--secondary">
                View in Rider Profile
              </Link>
            )}
            <a
              href={`https://wa.me/917395856611?text=${encodeURIComponent(
                `Hello BIKER CAFE, I placed order ${orderSuccess.orderRef}. Please confirm availability.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="checkout-btn--whatsapp"
            >
              WhatsApp Us Regarding Order
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <PageSeo
        title="Checkout & Payment | BIKER CAFE"
        description="Complete your order for premium AXOR motorcycle helmets. Choose Home Delivery or Shop Pickup in Arni."
        robots="noindex, follow"
      />

      <section className="checkout-hero">
        <div className="container">
          <span className="eyebrow">BIKER CAFE // SECURE ORDER</span>
          <h1 className="checkout-hero__title">
            CHECKOUT &amp; <span className="metallic-text">PAYMENT</span>
          </h1>
          <p className="checkout-hero__copy">
            Select your fulfillment mode, confirm delivery location or showroom pickup, and place
            your order with zero upfront stock risk.
          </p>
        </div>
      </section>

      <section className="checkout-main section-pad">
        <div className="container checkout-layout">
          {/* Left Column: Fulfillment & Details */}
          <div className="checkout-form-column">
            {errorMessage && (
              <div className="checkout-alert checkout-alert--error">
                <AlertCircle size={18} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Step 1: Delivery Option Selector */}
            <div className="checkout-card carbon-grid-bg">
              <div className="checkout-card__head">
                <span className="step-badge">1</span>
                <div>
                  <h2 className="checkout-card__title">Choose Delivery Option</h2>
                  <p className="checkout-card__sub">
                    Select how you would like to receive your motorcycle gear.
                  </p>
                </div>
              </div>

              <div className="delivery-option-grid">
                <button
                  type="button"
                  className={`delivery-option-btn ${
                    deliveryMethod === 'home_delivery' ? 'is-selected' : ''
                  }`}
                  onClick={() => setDeliveryMethod('home_delivery')}
                >
                  <Truck size={24} className="delivery-option__icon" />
                  <div className="delivery-option__content">
                    <strong>Home Delivery</strong>
                    <span>Delivered securely to your doorstep across India.</span>
                    <span className="delivery-option__note">
                      *Delivery charge quoted by showroom based on location.
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  className={`delivery-option-btn ${
                    deliveryMethod === 'shop_pickup' ? 'is-selected' : ''
                  }`}
                  onClick={() => setDeliveryMethod('shop_pickup')}
                >
                  <Store size={24} className="delivery-option__icon" />
                  <div className="delivery-option__content">
                    <strong>Shop Pickup (Free)</strong>
                    <span>Collect directly from our Arni showroom.</span>
                    <span className="delivery-option__note">
                      *Zero delivery fee. Inspect &amp; try on helmet before take-off.
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Step 2: Address or Pickup Details */}
            {deliveryMethod === 'home_delivery' ? (
              <div className="checkout-card carbon-grid-bg">
                <div className="checkout-card__head">
                  <span className="step-badge">2</span>
                  <div>
                    <h2 className="checkout-card__title">Shipping Address</h2>
                    <p className="checkout-card__sub">
                      Select or enter your verified delivery address.
                    </p>
                  </div>
                </div>

                <AddressManager
                  isSelectable={true}
                  selectedId={selectedAddressId}
                  onSelect={(id) => setSelectedAddressId(id)}
                />
              </div>
            ) : (
              <div className="checkout-card carbon-grid-bg">
                <div className="checkout-card__head">
                  <span className="step-badge">2</span>
                  <div>
                    <h2 className="checkout-card__title">Showroom Pickup Details</h2>
                    <p className="checkout-card__sub">
                      Visit our flagship Arni showroom to collect and test-fit your gear.
                    </p>
                  </div>
                </div>

                {/* Showroom Address Info Box */}
                <div className="pickup-showroom-box">
                  <div className="pickup-showroom__head">
                    <MapPin size={18} className="pickup-showroom__pin" />
                    <strong>{SHOWROOM_PICKUP_LOCATION.name} Showroom</strong>
                  </div>
                  <p className="pickup-showroom__addr">{SHOWROOM_PICKUP_LOCATION.address}</p>
                  <div className="pickup-showroom__meta">
                    <span>
                      <strong>Hours:</strong> {SHOWROOM_PICKUP_LOCATION.timing}
                    </span>
                    <span>
                      <strong>Contact:</strong> +91 {SHOWROOM_PICKUP_LOCATION.phone}
                    </span>
                  </div>
                  <div className="pickup-showroom__note">
                    <Info size={14} />
                    <span>{SHOWROOM_PICKUP_LOCATION.instructions}</span>
                  </div>
                </div>

                {/* Pickup Scheduling Form */}
                <div className="pickup-form-grid">
                  <div className="checkout-input-group">
                    <label htmlFor={pickupDateId}>
                      Estimated Pickup Date <span className="req">*</span>
                    </label>
                    <input
                      id={pickupDateId}
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={pickupDetails.pickupDate}
                      onChange={(e) =>
                        setPickupDetails((prev) => ({ ...prev, pickupDate: e.target.value }))
                      }
                    />
                  </div>

                  <div className="checkout-input-group">
                    <label htmlFor={pickupSlotId}>Preferred Time Slot</label>
                    <select
                      id={pickupSlotId}
                      value={pickupDetails.pickupTimeSlot}
                      onChange={(e) =>
                        setPickupDetails((prev) => ({ ...prev, pickupTimeSlot: e.target.value }))
                      }
                    >
                      <option value="morning">Morning (10:00 AM – 1:00 PM)</option>
                      <option value="afternoon">Afternoon (1:00 PM – 5:00 PM)</option>
                      <option value="evening">Evening (5:00 PM – 9:00 PM)</option>
                    </select>
                  </div>

                  <div className="checkout-input-group">
                    <label htmlFor={pickupNameId}>
                      Person Collecting Gear <span className="req">*</span>
                    </label>
                    <input
                      id={pickupNameId}
                      type="text"
                      placeholder="Full Name"
                      value={pickupDetails.collectorName}
                      onChange={(e) =>
                        setPickupDetails((prev) => ({ ...prev, collectorName: e.target.value }))
                      }
                    />
                  </div>

                  <div className="checkout-input-group">
                    <label htmlFor={pickupPhoneId}>
                      Collector Mobile Number <span className="req">*</span>
                    </label>
                    <input
                      id={pickupPhoneId}
                      type="tel"
                      maxLength={10}
                      placeholder="10-digit Indian Mobile"
                      value={pickupDetails.collectorPhone}
                      onChange={(e) =>
                        setPickupDetails((prev) => ({ ...prev, collectorPhone: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Guest Contact Details if not signed in */}
            {!user && (
              <div className="checkout-card carbon-grid-bg">
                <div className="checkout-card__head">
                  <span className="step-badge">3</span>
                  <div>
                    <h2 className="checkout-card__title">Rider Contact Details</h2>
                    <p className="checkout-card__sub">
                      Used for order confirmations and tracking updates.
                    </p>
                  </div>
                </div>

                <div className="pickup-form-grid">
                  <div className="checkout-input-group">
                    <label htmlFor={guestNameId}>
                      Full Name <span className="req">*</span>
                    </label>
                    <input
                      id={guestNameId}
                      type="text"
                      placeholder="e.g. Narasimman A"
                      value={guestContact.name}
                      onChange={(e) =>
                        setGuestContact((prev) => ({ ...prev, name: e.target.value }))
                      }
                    />
                  </div>

                  <div className="checkout-input-group">
                    <label htmlFor={guestPhoneId}>
                      Mobile Number <span className="req">*</span>
                    </label>
                    <input
                      id={guestPhoneId}
                      type="tel"
                      maxLength={10}
                      placeholder="10-digit Indian mobile"
                      value={guestContact.phone}
                      onChange={(e) =>
                        setGuestContact((prev) => ({ ...prev, phone: e.target.value }))
                      }
                    />
                  </div>

                  <div className="checkout-input-group full-width">
                    <label htmlFor={guestEmailId}>Email Address (Optional)</label>
                    <input
                      id={guestEmailId}
                      type="email"
                      placeholder="e.g. rider@bikercafe.in"
                      value={guestContact.email}
                      onChange={(e) =>
                        setGuestContact((prev) => ({ ...prev, email: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 (or 4): Payment Method */}
            <div className="checkout-card carbon-grid-bg">
              <div className="checkout-card__head">
                <span className="step-badge">{user ? 3 : 4}</span>
                <div>
                  <h2 className="checkout-card__title">Payment Method</h2>
                  <p className="checkout-card__sub">
                    Support both Cash on Delivery and Online Payment architecture.
                  </p>
                </div>
              </div>

              <div className="payment-options-list">
                {/* Cash on Delivery */}
                <label
                  className={`payment-choice-card ${
                    paymentMethod === 'cod' ? 'is-selected' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                  />
                  <div className="payment-choice__icon">
                    <Banknote size={22} />
                  </div>
                  <div className="payment-choice__text">
                    <div className="payment-choice__title-row">
                      <strong>Cash on Delivery (COD) / Pay on Pickup</strong>
                      <span className="badge-pill">Recommended</span>
                    </div>
                    <p>
                      Pay via cash, UPI, or card when your helmet arrives at your door or upon showroom pickup.
                    </p>
                  </div>
                </label>

                {/* Online Payment */}
                <label
                  className={`payment-choice-card ${
                    paymentMethod === 'online' ? 'is-selected' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="online"
                    checked={paymentMethod === 'online'}
                    onChange={() => setPaymentMethod('online')}
                  />
                  <div className="payment-choice__icon">
                    <CreditCard size={22} />
                  </div>
                  <div className="payment-choice__text">
                    <div className="payment-choice__title-row">
                      <strong>Online Payment (UPI / Cards / Net Banking)</strong>
                      <span className="badge-pill badge-pill--blue">Architecture Ready</span>
                    </div>
                    <p>
                      Order is recorded as pending; showroom coordinates payment link or UPI QR code prior to dispatch.
                    </p>
                  </div>
                </label>
              </div>

              {/* Special Order Notes */}
              <div className="checkout-notes-box">
                <label htmlFor={notesId}>Special Notes / Delivery Remarks (Optional)</label>
                <textarea
                  id={notesId}
                  rows={2}
                  maxLength={300}
                  placeholder="e.g. Please call prior to delivery. Need helmet packed for gifting."
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Order Review & Placement */}
          <aside className="checkout-summary-column">
            <div className="checkout-summary-card carbon-grid-bg">
              <h3 className="checkout-summary-title">Order Review</h3>

              {/* Item Previews */}
              <div className="checkout-items-preview">
                {cartItems.map((item) => (
                  <div key={item.cartItemId} className="checkout-item-row">
                    <img src={item.image} alt={item.title} className="checkout-item-img" />
                    <div className="checkout-item-info">
                      <strong>{item.title}</strong>
                      <span className="checkout-item-meta">
                        Size: {item.selectedSize} · Qty: {item.quantity}
                      </span>
                    </div>
                    <span className="checkout-item-price">{item.priceLabel}</span>
                  </div>
                ))}
              </div>

              <div className="cart-summary-divider" />

              {/* Coupon Code Entry (Stage 6.12) */}
              <div className="checkout-coupon-box">
                <span className="coupon-box-title">
                  <Tag size={14} /> Have a Showroom Coupon?
                </span>

                {appliedCoupon ? (
                  <div className="applied-coupon-pill">
                    <div>
                      <strong>{appliedCoupon.code}</strong>
                      <span>₹{discountAmount.toLocaleString('en-IN')} Discount Applied</span>
                    </div>
                    <button type="button" className="remove-coupon-btn" onClick={handleRemoveCoupon}>
                      Remove
                    </button>
                  </div>
                ) : (
                  <form className="coupon-input-form" onSubmit={handleApplyCoupon}>
                    <input
                      type="text"
                      placeholder="e.g. AXOR10"
                      value={couponCodeInput}
                      onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                    />
                    <button type="submit" disabled={couponLoading || !couponCodeInput.trim()}>
                      {couponLoading ? '...' : 'Apply'}
                    </button>
                  </form>
                )}

                {couponFeedback && (
                  <span className={`coupon-feedback ${couponFeedback.type}`}>
                    {couponFeedback.text}
                  </span>
                )}
              </div>

              <div className="cart-summary-divider" />

              {/* Cost Breakdown */}
              <div className="checkout-breakdown">
                <div className="breakdown-row">
                  <span>Items Subtotal ({totalCount} units)</span>
                  <span className="breakdown-val">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>

                {appliedCoupon && (
                  <div className="breakdown-row discount-row">
                    <span>Coupon Discount ({appliedCoupon.code})</span>
                    <span className="breakdown-val discount-val">
                      -₹{discountAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                <div className="breakdown-row">
                  <span>Delivery Method</span>
                  <span className="breakdown-val">
                    {deliveryMethod === 'shop_pickup' ? 'Shop Pickup' : 'Home Delivery'}
                  </span>
                </div>

                <div className="breakdown-row">
                  <span>Delivery Charge</span>
                  <span
                    className={`breakdown-val ${
                      deliveryMethod === 'shop_pickup' ? 'free' : 'quote'
                    }`}
                  >
                    {deliveryMethod === 'shop_pickup' ? 'FREE' : 'Admin Quotation'}
                  </span>
                </div>

                <div className="breakdown-row">
                  <span>Payment Method</span>
                  <span className="breakdown-val">
                    {paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                  </span>
                </div>
              </div>

              <div className="cart-summary-divider" />

              <div className="checkout-total-row">
                <div>
                  <span className="checkout-total-label">Payable Amount</span>
                  <span className="checkout-total-sub">
                    {deliveryMethod === 'home_delivery'
                      ? '+ Actual delivery fee confirmed by admin'
                      : 'Showroom pickup total'}
                  </span>
                </div>
                <strong className="checkout-total-amount">
                  ₹{netSubtotal.toLocaleString('en-IN')}
                </strong>
              </div>

              {/* Stock Policy Notice */}
              <div className="checkout-policy-box">
                <ShieldCheck size={16} className="policy-icon" />
                <p>
                  <strong>Physical Stock Commitment:</strong> Your order will be reviewed by the
                  BIKER CAFE team in Arni. Physical inventory is committed only upon admin confirmation.
                </p>
              </div>

              <button
                type="button"
                className="checkout-submit-btn"
                onClick={handlePlaceOrder}
                disabled={submitting}
              >
                <Lock size={16} />
                <span>{submitting ? 'Placing Order...' : 'Confirm & Place Order'}</span>
                <ArrowRight size={16} />
              </button>

              <p className="checkout-privacy-note">
                By placing this order, your details are securely transmitted to BIKER CAFE Arni.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
