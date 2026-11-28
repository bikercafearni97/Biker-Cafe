import { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Clock,
  Store,
  Truck,
  RotateCcw,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  X,
  Package,
  CheckCircle,
  XCircle,
  CreditCard,
  Banknote,
  RefreshCw,
} from 'lucide-react';
import {
  subscribeCustomerOrders,
  getCustomerOrders,
  cancelOrder,
  ORDER_STATUSES,
} from '../../services/ordersService';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import './CustomerOrdersSection.css';

// Canonical fulfillment stages for the progress tracker
const TRACKING_STAGES_DELIVERY = [
  { key: ORDER_STATUSES.PENDING, label: 'Order Placed', desc: 'Awaiting showroom verification' },
  { key: ORDER_STATUSES.CONFIRMED, label: 'Confirmed', desc: 'Stock reserved & packed' },
  { key: ORDER_STATUSES.PROCESSING, label: 'Processing', desc: 'Quality inspection & packaging' },
  { key: ORDER_STATUSES.SHIPPED, label: 'Dispatched', desc: 'Handed over to courier' },
  { key: ORDER_STATUSES.DELIVERED, label: 'Delivered', desc: 'Safely delivered to customer' },
];

const TRACKING_STAGES_PICKUP = [
  { key: ORDER_STATUSES.PENDING, label: 'Order Placed', desc: 'Awaiting showroom verification' },
  { key: ORDER_STATUSES.CONFIRMED, label: 'Confirmed', desc: 'Stock allocated in showroom' },
  { key: ORDER_STATUSES.PROCESSING, label: 'Preparing', desc: 'Prepared at Arni showroom counter' },
  { key: ORDER_STATUSES.READY_FOR_PICKUP, label: 'Ready for Pickup', desc: 'Waiting for rider collection' },
  { key: ORDER_STATUSES.DELIVERED, label: 'Collected', desc: 'Collected at showroom' },
];

export default function CustomerOrdersSection() {
  const { user } = useCustomerAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(Boolean(user));
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelError, setCancelError] = useState(null);
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Real-time synchronization with Firestore
  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const unsubscribe = subscribeCustomerOrders(
      user.uid,
      (liveOrders) => {
        setOrders(liveOrders);
        setLoading(false);
        // Keep tracking modal synchronized live if open
        setTrackingOrder((current) => {
          if (!current) return null;
          const updated = liveOrders.find((o) => o.id === current.id);
          return updated || current;
        });
      },
      (err) => {
        console.warn('Real-time order subscription failed, falling back to one-shot:', err);
        getCustomerOrders(user.uid)
          .then((data) => {
            setOrders(data);
            setLoading(false);
          })
          .catch((fetchErr) => {
            console.error('One-shot order fetch also failed:', fetchErr);
            setLoading(false);
          });
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [user]);

  const handleManualRefresh = async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      const data = await getCustomerOrders(user.uid);
      setOrders(data);
      if (trackingOrder) {
        const updated = data.find((o) => o.id === trackingOrder.id);
        if (updated) setTrackingOrder(updated);
      }
    } catch (err) {
      console.error('Manual refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this pending order?')) return;
    setCancellingId(orderId);
    setCancelError(null);
    try {
      await cancelOrder(orderId, 'Cancelled by customer via profile');
      const data = await getCustomerOrders(user.uid);
      setOrders(data);
      if (trackingOrder && trackingOrder.id === orderId) {
        const updated = data.find((o) => o.id === orderId);
        if (updated) setTrackingOrder(updated);
      }
    } catch (err) {
      setCancelError(err.message || 'Failed to cancel order.');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case ORDER_STATUSES.PENDING:
        return <span className="rider-status-badge pending">Awaiting Showroom Review</span>;
      case ORDER_STATUSES.CONFIRMED:
        return <span className="rider-status-badge confirmed">Confirmed (Stock Held)</span>;
      case ORDER_STATUSES.PROCESSING:
        return <span className="rider-status-badge processing">Processing &amp; Packing</span>;
      case ORDER_STATUSES.READY_FOR_PICKUP:
        return <span className="rider-status-badge pickup">Ready for Showroom Pickup</span>;
      case ORDER_STATUSES.SHIPPED:
        return <span className="rider-status-badge shipped">Dispatched / In Transit</span>;
      case ORDER_STATUSES.DELIVERED:
        return <span className="rider-status-badge delivered">Delivered / Collected</span>;
      case ORDER_STATUSES.CANCELLED:
        return <span className="rider-status-badge cancelled">Cancelled</span>;
      case ORDER_STATUSES.REJECTED:
        return <span className="rider-status-badge rejected">Rejected</span>;
      default:
        return <span className="rider-status-badge">{status}</span>;
    }
  };

  const renderProgressTracker = (order) => {
    const isPickup = order.deliveryMethod === 'shop_pickup';
    const stages = isPickup ? TRACKING_STAGES_PICKUP : TRACKING_STAGES_DELIVERY;
    const isCancelled = order.status === ORDER_STATUSES.CANCELLED;
    const isRejected = order.status === ORDER_STATUSES.REJECTED;

    if (isCancelled || isRejected) {
      return (
        <div className="order-tracking-terminal cancelled">
          <XCircle size={28} className="terminal-icon-cancelled" />
          <div className="terminal-content">
            <h4>Order {isCancelled ? 'Cancelled' : 'Rejected'}</h4>
            <p>
              {order.cancellationReason || order.rejectionReason || (isCancelled ? 'This order was cancelled.' : 'Showroom was unable to fulfill this order.')}
            </p>
            {order.stockRestored && (
              <span className="terminal-stock-note">Showroom stock hold released.</span>
            )}
          </div>
        </div>
      );
    }

    // Determine current index
    const stageKeys = stages.map((s) => s.key);
    let currentIndex = stageKeys.indexOf(order.status);
    if (currentIndex === -1) {
      if (order.status === ORDER_STATUSES.OUT_FOR_DELIVERY) {
        currentIndex = stageKeys.indexOf(ORDER_STATUSES.SHIPPED);
      } else {
        currentIndex = 0;
      }
    }

    return (
      <div className="order-tracking-stepper">
        <div className="stepper-track">
          {stages.map((stage, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            return (
              <div
                key={stage.key}
                className={`stepper-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
              >
                <div className="stepper-marker">
                  {isCompleted ? (
                    <CheckCircle size={16} />
                  ) : (
                    <span className="stepper-num">{idx + 1}</span>
                  )}
                </div>
                <div className="stepper-labels">
                  <strong className="step-title">{stage.label}</strong>
                  <span className="step-desc">{stage.desc}</span>
                </div>
                {idx < stages.length - 1 && <div className="stepper-line" />}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="rider-orders-section">
      <div className="rider-orders-section__head">
        <ShoppingBag size={20} className="head-icon" />
        <div className="head-title-wrap">
          <h3>My Orders &amp; Track Gear</h3>
          <p>Track showroom confirmation, physical stock allocation, and courier shipment live.</p>
        </div>
        {user && (
          <button
            type="button"
            className="rider-refresh-btn"
            onClick={handleManualRefresh}
            disabled={refreshing || loading}
            title="Refresh order history"
            aria-label="Refresh orders"
          >
            <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
            <span>{refreshing ? 'Syncing...' : 'Sync'}</span>
          </button>
        )}
      </div>

      {cancelError && (
        <div className="rider-order-alert error" role="alert">
          <AlertCircle size={16} />
          <span>{cancelError}</span>
        </div>
      )}

      {loading ? (
        <div className="rider-orders-loading">
          <Clock size={20} className="spin" />
          <span>Loading your order history...</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="rider-orders-empty">
          <ShoppingBag size={36} />
          <p>You have not placed any orders yet.</p>
          <span className="empty-sub">Once you place an order for helmets or gear, your full tracking timeline will appear here.</span>
        </div>
      ) : (
        <div className="rider-orders-list">
          {orders.map((order) => {
            const isPending = order.status === ORDER_STATUSES.PENDING;
            const orderDateStr = order.createdAt?.toDate
              ? order.createdAt.toDate().toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Recent';

            return (
              <div key={order.id} className="rider-order-card">
                <div className="rider-order-card__head">
                  <div className="order-id-group">
                    <span className="rider-order-card__ref">#{order.orderRef}</span>
                    <span className="rider-order-card__date">{orderDateStr}</span>
                  </div>
                  <div className="order-status-group">
                    {getStatusBadge(order.status)}
                    <button
                      type="button"
                      className="track-gear-btn"
                      onClick={() => setTrackingOrder(order)}
                    >
                      <Package size={14} />
                      <span>Live Tracking</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>

                <div className="rider-order-card__body">
                  <div className="rider-order-items">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="rider-order-item">
                        <img src={item.image} alt={item.title} />
                        <div className="item-text">
                          <strong>{item.title}</strong>
                          <span>
                            Size: {item.selectedSize} · Finish: {item.selectedFinish || 'Gloss'} · Qty: {item.quantity} · {item.priceLabel || `₹${item.unitPrice}`}
                          </span>
                        </div>
                        <span className="item-row-total">
                          ₹{((Number(item.unitPrice) || 0) * (Number(item.quantity) || 1)).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="rider-order-meta-box">
                    <div className="meta-line">
                      <span>Fulfillment Mode:</span>
                      <strong>
                        {order.deliveryMethod === 'shop_pickup' ? (
                          <>
                            <Store size={13} /> Showroom Pickup (Arni)
                          </>
                        ) : (
                          <>
                            <Truck size={13} /> Home Delivery
                          </>
                        )}
                      </strong>
                    </div>

                    <div className="meta-line">
                      <span>Payment Method:</span>
                      <strong>
                        {order.paymentMethod === 'cod' ? (
                          <>
                            <Banknote size={13} /> Cash on Delivery
                          </>
                        ) : (
                          <>
                            <CreditCard size={13} /> Online Payment
                          </>
                        )}
                      </strong>
                    </div>

                    <div className="meta-line">
                      <span>Payment Status:</span>
                      <strong className={`payment-status-tag ${order.paymentStatus || 'pending'}`}>
                        {(order.paymentStatus || 'pending').toUpperCase()}
                      </strong>
                    </div>

                    <div className="meta-line">
                      <span>Delivery Charge:</span>
                      <strong>
                        {order.deliveryCharge !== null && order.deliveryCharge !== undefined
                          ? `₹${Number(order.deliveryCharge).toLocaleString('en-IN')}`
                          : 'Awaiting Showroom Quote'}
                      </strong>
                    </div>

                    {order.discountAmount > 0 && (
                      <div className="meta-line discount">
                        <span>Coupon Savings:</span>
                        <strong>-₹{Number(order.discountAmount).toLocaleString('en-IN')}</strong>
                      </div>
                    )}

                    <div className="meta-line total">
                      <span>Total Amount:</span>
                      <strong>
                        ₹
                        {(
                          order.totalAmount ||
                          order.itemsSubtotal + (Number(order.deliveryCharge) || 0)
                        ).toLocaleString('en-IN')}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Progress Stepper Bar on Card */}
                <div className="rider-order-tracking-card-section">
                  {renderProgressTracker(order)}
                </div>

                {/* Status Timeline updates */}
                {order.statusHistory && order.statusHistory.length > 0 && (
                  <div className="rider-order-timeline">
                    <span className="timeline-title">Audit Trail &amp; Status Logs:</span>
                    <div className="rider-timeline-flow">
                      {order.statusHistory.map((step, idx) => (
                        <div key={idx} className="rider-timeline-step">
                          <span className="step-dot" />
                          <div className="step-info">
                            <strong>{step.status.replace(/_/g, ' ').toUpperCase()}</strong>
                            <span className="step-time">
                              {step.timestamp ? new Date(step.timestamp).toLocaleString('en-IN') : ''}
                            </span>
                            <p>{step.note}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rider-order-card__footer">
                  <a
                    href={`https://wa.me/917395856611?text=${encodeURIComponent(
                      `Hello BIKER CAFE, inquiring about my order ${order.orderRef}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="order-wa-link"
                  >
                    <span>Contact Showroom Support on WhatsApp</span>
                    <ExternalLink size={13} />
                  </a>

                  {isPending && (
                    <button
                      type="button"
                      className="order-cancel-btn"
                      onClick={() => handleCancelOrder(order.id)}
                      disabled={cancellingId === order.id}
                    >
                      <RotateCcw size={13} />
                      <span>{cancellingId === order.id ? 'Cancelling...' : 'Cancel Order'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── LIVE TRACKING MODAL ── */}
      {trackingOrder && (
        <div className="tracking-modal-backdrop" onClick={() => setTrackingOrder(null)}>
          <div className="tracking-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tracking-modal__head">
              <div>
                <span className="modal-eyebrow">ORDER FULFILLMENT TRACKER</span>
                <h3>Order #{trackingOrder.orderRef}</h3>
              </div>
              <button
                type="button"
                className="tracking-modal__close"
                onClick={() => setTrackingOrder(null)}
                aria-label="Close tracking"
              >
                <X size={18} />
              </button>
            </div>

            <div className="tracking-modal__body">
              {/* Stepper */}
              <div className="tracking-modal__stepper-box">
                {renderProgressTracker(trackingOrder)}
              </div>

              {/* Fulfillment Details */}
              <div className="tracking-details-grid">
                <div className="tracking-detail-card">
                  <h4>Fulfillment Information</h4>
                  {trackingOrder.deliveryMethod === 'shop_pickup' ? (
                    <div>
                      <p>
                        <strong>Mode:</strong> Showroom Collection (Arni)
                      </p>
                      <p>
                        <strong>Pickup Date:</strong>{' '}
                        {trackingOrder.pickupDetails?.pickupDate || 'Coordinate with showroom'}
                      </p>
                      <p>
                        <strong>Time Slot:</strong>{' '}
                        {trackingOrder.pickupDetails?.pickupTimeSlot || 'Afternoon'}
                      </p>
                      <p>
                        <strong>Showroom Location:</strong> 123, Karthikeyan Road, Arni – 632301
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p>
                        <strong>Mode:</strong> Courier Home Delivery
                      </p>
                      {trackingOrder.deliveryAddress ? (
                        <p>
                          <strong>Destination:</strong> {trackingOrder.deliveryAddress.houseNo},{' '}
                          {trackingOrder.deliveryAddress.street}, {trackingOrder.deliveryAddress.city},{' '}
                          {trackingOrder.deliveryAddress.state} – {trackingOrder.deliveryAddress.pinCode}
                        </p>
                      ) : (
                        <p>Address provided at checkout</p>
                      )}
                      <p>
                        <strong>Delivery Status:</strong>{' '}
                        {trackingOrder.status === ORDER_STATUSES.SHIPPED
                          ? 'In transit with regional courier partner'
                          : trackingOrder.status === ORDER_STATUSES.DELIVERED
                          ? 'Delivered'
                          : 'Awaiting showroom dispatch'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="tracking-detail-card">
                  <h4>Order Summary</h4>
                  <p>
                    <strong>Items Count:</strong> {trackingOrder.itemsCount || trackingOrder.items?.length} unit(s)
                  </p>
                  <p>
                    <strong>Payment Method:</strong> {trackingOrder.paymentMethod?.toUpperCase()}
                  </p>
                  <p>
                    <strong>Payment Status:</strong>{' '}
                    <span className={`payment-status-tag ${trackingOrder.paymentStatus || 'pending'}`}>
                      {(trackingOrder.paymentStatus || 'pending').toUpperCase()}
                    </span>
                  </p>
                  <p>
                    <strong>Grand Total:</strong> ₹
                    {(
                      trackingOrder.totalAmount ||
                      trackingOrder.itemsSubtotal + (Number(trackingOrder.deliveryCharge) || 0)
                    ).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Items in this shipment */}
              <div className="tracking-modal-items">
                <h4>Items in this Order</h4>
                <div className="tracking-items-list">
                  {trackingOrder.items?.map((item, idx) => (
                    <div key={idx} className="tracking-item-row">
                      <img src={item.image} alt={item.title} />
                      <div className="item-info">
                        <strong>{item.title}</strong>
                        <span>
                          Size: {item.selectedSize} · Finish: {item.selectedFinish || 'Gloss'} · Qty: {item.quantity}
                        </span>
                      </div>
                      <span className="item-price">
                        ₹{((Number(item.unitPrice) || 0) * (Number(item.quantity) || 1)).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Complete Event History */}
              {trackingOrder.statusHistory && trackingOrder.statusHistory.length > 0 && (
                <div className="tracking-history-box">
                  <h4>Live Tracking Timeline</h4>
                  <div className="tracking-history-timeline">
                    {trackingOrder.statusHistory.map((step, idx) => (
                      <div key={idx} className="history-step">
                        <div className="step-point" />
                        <div className="step-content">
                          <div className="step-head">
                            <strong>{step.status.replace(/_/g, ' ').toUpperCase()}</strong>
                            <span>{new Date(step.timestamp).toLocaleString('en-IN')}</span>
                          </div>
                          <p>{step.note}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="tracking-modal__footer">
              <a
                href={`https://wa.me/917395856611?text=${encodeURIComponent(
                  `Hello BIKER CAFE, tracking inquiry for order #${trackingOrder.orderRef}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="tracking-wa-btn"
              >
                <span>WhatsApp Showroom for Live Support</span>
                <ExternalLink size={14} />
              </a>
              <button
                type="button"
                className="tracking-done-btn"
                onClick={() => setTrackingOrder(null)}
              >
                Close Tracking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
