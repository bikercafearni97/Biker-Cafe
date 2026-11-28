import { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Truck,
  Store,
  Eye,
  AlertTriangle,
  RotateCcw,
  IndianRupee,
  RefreshCw,
  X,
} from 'lucide-react';
import {
  getAllOrders,
  confirmOrderWithStockDeduction,
  cancelOrderWithStockRestoration,
  rejectOrder,
  updateOrderStatus,
  updateOrderPaymentStatus,
  ORDER_STATUSES,
} from '../../services/ordersService';
import './AdminOrdersTab.css';

export default function AdminOrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeSection, setActiveSection] = useState('all');
  const [deliveryFilter, setDeliveryFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Action modal states
  const [confirmModalOrder, setConfirmModalOrder] = useState(null);
  const [deliveryChargeInput, setDeliveryChargeInput] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [rejectModalOrder, setRejectModalOrder] = useState(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [cancelModalOrder, setCancelModalOrder] = useState(null);
  const [cancelReasonInput, setCancelReasonInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState(null);

  const showFeedback = (msg) => {
    setFeedbackNotice(msg);
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  const openConfirmModal = (order) => {
    setConfirmModalOrder(order);
    setConfirmError('');
    if (order.deliveryMethod === 'shop_pickup') {
      setDeliveryChargeInput('0');
    } else {
      setDeliveryChargeInput(
        order.deliveryCharge !== null && order.deliveryCharge !== undefined
          ? String(order.deliveryCharge)
          : ''
      );
    }
  };

  const fetchOrders = useCallback(async () => {
    try {
      const data = await getAllOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Failed to load orders. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getAllOrders()
      .then((data) => {
        if (active) {
          setOrders(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          console.error('Failed to fetch orders:', err);
          setError('Failed to load orders. Please refresh.');
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // Filtered orders list
  const filteredOrders = orders.filter((order) => {
    // 6-Section Filter
    if (activeSection === 'received' && order.status !== ORDER_STATUSES.PENDING) return false;
    if (activeSection === 'confirmed' && order.status !== ORDER_STATUSES.CONFIRMED) return false;
    if (activeSection === 'processing' && order.status !== ORDER_STATUSES.PROCESSING && order.status !== ORDER_STATUSES.READY_FOR_PICKUP) return false;
    if (activeSection === 'dispatched' && order.status !== ORDER_STATUSES.SHIPPED && order.status !== ORDER_STATUSES.OUT_FOR_DELIVERY) return false;
    if (activeSection === 'delivered' && order.status !== ORDER_STATUSES.DELIVERED) return false;
    if (activeSection === 'cancelled' && order.status !== ORDER_STATUSES.CANCELLED && order.status !== ORDER_STATUSES.REJECTED) return false;

    // Status dropdown filter
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    // Delivery method filter
    if (deliveryFilter !== 'all' && order.deliveryMethod !== deliveryFilter) return false;
    // Payment filter
    if (paymentFilter !== 'all' && order.paymentMethod !== paymentFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRef = order.orderRef?.toLowerCase().includes(q);
      const matchName = order.customer?.name?.toLowerCase().includes(q);
      const matchPhone = order.customer?.phone?.includes(q);
      const matchCity = order.deliveryAddress?.city?.toLowerCase().includes(q);
      return matchRef || matchName || matchPhone || matchCity;
    }
    return true;
  });

  // 6 Section Counts
  const sectionCounts = {
    all: orders.length,
    received: orders.filter((o) => o.status === ORDER_STATUSES.PENDING).length,
    confirmed: orders.filter((o) => o.status === ORDER_STATUSES.CONFIRMED).length,
    processing: orders.filter((o) => o.status === ORDER_STATUSES.PROCESSING || o.status === ORDER_STATUSES.READY_FOR_PICKUP).length,
    dispatched: orders.filter((o) => o.status === ORDER_STATUSES.SHIPPED || o.status === ORDER_STATUSES.OUT_FOR_DELIVERY).length,
    delivered: orders.filter((o) => o.status === ORDER_STATUSES.DELIVERED).length,
    cancelled: orders.filter((o) => o.status === ORDER_STATUSES.CANCELLED || o.status === ORDER_STATUSES.REJECTED).length,
  };

  // Metric counts
  const pendingCount = sectionCounts.received;
  const confirmedCount = sectionCounts.confirmed;
  const deliveredCount = sectionCounts.delivered;

  // Handle Confirm Order (Atomic stock deduction)
  const handleConfirmSubmit = async (e) => {
    e.preventDefault();
    if (!confirmModalOrder) return;
    setConfirmError('');
    setActionLoading(true);
    try {
      const charge = confirmModalOrder.deliveryMethod === 'shop_pickup' ? 0 : Number(deliveryChargeInput) || 0;
      await confirmOrderWithStockDeduction(confirmModalOrder.id, {
        deliveryCharge: charge,
      });
      showFeedback(`Order ${confirmModalOrder.orderRef} confirmed! Stock deducted.`);
      setConfirmModalOrder(null);
      setDeliveryChargeInput('');
      setConfirmError('');
      await fetchOrders();
    } catch (err) {
      console.error('Order confirmation failed:', err);
      setConfirmError(err.message || 'Failed to confirm order. Please verify inventory and try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reject Order (Unconfirmed, zero stock restoration needed)
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectModalOrder) return;
    setActionLoading(true);
    try {
      await rejectOrder(rejectModalOrder.id, rejectReasonInput || 'Rejected by showroom');
      showFeedback(`Order ${rejectModalOrder.orderRef} rejected.`);
      setRejectModalOrder(null);
      setRejectReasonInput('');
      await fetchOrders();
    } catch (err) {
      alert(`Failed to reject order: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Cancel Order (Restores stock if confirmed)
  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancelModalOrder) return;
    setActionLoading(true);
    try {
      await cancelOrderWithStockRestoration(cancelModalOrder.id, {
        reason: cancelReasonInput || 'Cancelled by showroom admin',
      });
      showFeedback(`Order ${cancelModalOrder.orderRef} cancelled.`);
      setCancelModalOrder(null);
      setCancelReasonInput('');
      await fetchOrders();
    } catch (err) {
      alert(`Failed to cancel order: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Status Update Step
  const handleAdvanceStatus = async (orderId, nextStatus) => {
    setActionLoading(true);
    try {
      await updateOrderStatus(orderId, nextStatus);
      showFeedback(`Order status moved to "${nextStatus.replace(/_/g, ' ')}"`);
      await fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status: nextStatus }));
      }
    } catch (err) {
      alert(`Failed to advance status: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Payment Status Toggle
  const handleTogglePaymentStatus = async (orderId, newStatus) => {
    setActionLoading(true);
    try {
      await updateOrderPaymentStatus(orderId, newStatus);
      showFeedback(`Payment status marked as "${newStatus}"`);
      await fetchOrders();
    } catch (err) {
      alert(`Failed to update payment status: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case ORDER_STATUSES.PENDING:
        return <span className="status-badge status-badge--pending">Pending Review</span>;
      case ORDER_STATUSES.CONFIRMED:
        return <span className="status-badge status-badge--confirmed">Confirmed (Stock Held)</span>;
      case ORDER_STATUSES.PROCESSING:
        return <span className="status-badge status-badge--processing">Processing</span>;
      case ORDER_STATUSES.READY_FOR_PICKUP:
        return <span className="status-badge status-badge--pickup">Ready for Pickup</span>;
      case ORDER_STATUSES.SHIPPED:
        return <span className="status-badge status-badge--shipped">Shipped</span>;
      case ORDER_STATUSES.OUT_FOR_DELIVERY:
        return <span className="status-badge status-badge--out">Out for Delivery</span>;
      case ORDER_STATUSES.DELIVERED:
        return <span className="status-badge status-badge--delivered">Delivered</span>;
      case ORDER_STATUSES.CANCELLED:
        return <span className="status-badge status-badge--cancelled">Cancelled</span>;
      case ORDER_STATUSES.REJECTED:
        return <span className="status-badge status-badge--rejected">Rejected</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  return (
    <div className="admin-orders-tab">
      {/* 6 Status-Based Management Sections Tabs */}
      <div className="admin-order-sections-bar">
        <button
          type="button"
          className={`order-section-btn ${activeSection === 'all' ? 'is-active' : ''}`}
          onClick={() => { setActiveSection('all'); setStatusFilter('all'); }}
        >
          <span>All Orders</span>
          <span className="section-count-badge">{sectionCounts.all}</span>
        </button>
        <button
          type="button"
          className={`order-section-btn ${activeSection === 'received' ? 'is-active' : ''}`}
          onClick={() => { setActiveSection('received'); setStatusFilter('all'); }}
        >
          <span>1. Orders Received</span>
          <span className="section-count-badge section-count-badge--pending">{sectionCounts.received}</span>
        </button>
        <button
          type="button"
          className={`order-section-btn ${activeSection === 'confirmed' ? 'is-active' : ''}`}
          onClick={() => { setActiveSection('confirmed'); setStatusFilter('all'); }}
        >
          <span>2. Confirmed</span>
          <span className="section-count-badge section-count-badge--confirmed">{sectionCounts.confirmed}</span>
        </button>
        <button
          type="button"
          className={`order-section-btn ${activeSection === 'processing' ? 'is-active' : ''}`}
          onClick={() => { setActiveSection('processing'); setStatusFilter('all'); }}
        >
          <span>3. Processing</span>
          <span className="section-count-badge">{sectionCounts.processing}</span>
        </button>
        <button
          type="button"
          className={`order-section-btn ${activeSection === 'dispatched' ? 'is-active' : ''}`}
          onClick={() => { setActiveSection('dispatched'); setStatusFilter('all'); }}
        >
          <span>4. Dispatched</span>
          <span className="section-count-badge">{sectionCounts.dispatched}</span>
        </button>
        <button
          type="button"
          className={`order-section-btn ${activeSection === 'delivered' ? 'is-active' : ''}`}
          onClick={() => { setActiveSection('delivered'); setStatusFilter('all'); }}
        >
          <span>5. Delivered</span>
          <span className="section-count-badge section-count-badge--delivered">{sectionCounts.delivered}</span>
        </button>
        <button
          type="button"
          className={`order-section-btn ${activeSection === 'cancelled' ? 'is-active' : ''}`}
          onClick={() => { setActiveSection('cancelled'); setStatusFilter('all'); }}
        >
          <span>6. Cancelled / Rejected</span>
          <span className="section-count-badge section-count-badge--cancelled">{sectionCounts.cancelled}</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <span className="admin-stat-card__label">Total Orders</span>
          <strong className="admin-stat-card__val">{orders.length}</strong>
        </div>
        <div className="admin-stat-card admin-stat-card--new">
          <span className="admin-stat-card__label">Pending Review</span>
          <strong className="admin-stat-card__val">{pendingCount}</strong>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-card__label">Confirmed (Active)</span>
          <strong className="admin-stat-card__val">{confirmedCount}</strong>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-card__label">Fulfilled</span>
          <strong className="admin-stat-card__val">{deliveredCount}</strong>
        </div>
      </div>

      {feedbackNotice && (
        <div className="admin-orders-notice">
          <CheckCircle size={16} />
          <span>{feedbackNotice}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="admin-orders-controls">
        <div className="admin-orders-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search order ref, customer name, phone, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="admin-orders-filter-row">
          <div className="filter-select-wrapper">
            <Filter size={14} />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value={ORDER_STATUSES.PENDING}>Pending Review</option>
              <option value={ORDER_STATUSES.CONFIRMED}>Confirmed</option>
              <option value={ORDER_STATUSES.PROCESSING}>Processing</option>
              <option value={ORDER_STATUSES.READY_FOR_PICKUP}>Ready for Pickup</option>
              <option value={ORDER_STATUSES.SHIPPED}>Shipped</option>
              <option value={ORDER_STATUSES.DELIVERED}>Delivered</option>
              <option value={ORDER_STATUSES.CANCELLED}>Cancelled</option>
              <option value={ORDER_STATUSES.REJECTED}>Rejected</option>
            </select>
          </div>

          <div className="filter-select-wrapper">
            <select value={deliveryFilter} onChange={(e) => setDeliveryFilter(e.target.value)}>
              <option value="all">All Fulfillment</option>
              <option value="home_delivery">Home Delivery</option>
              <option value="shop_pickup">Shop Pickup</option>
            </select>
          </div>

          <div className="filter-select-wrapper">
            <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
              <option value="all">All Payments</option>
              <option value="cod">Cash on Delivery</option>
              <option value="online">Online Payment</option>
            </select>
          </div>

          <button
            type="button"
            className="admin-orders-refresh"
            onClick={fetchOrders}
            title="Refresh Orders"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="admin-orders-loading">
          <RefreshCw size={24} className="spin" />
          <p>Loading customer orders...</p>
        </div>
      ) : error ? (
        <div className="admin-orders-error">{error}</div>
      ) : filteredOrders.length === 0 ? (
        <div className="admin-orders-empty">
          <ShoppingBag size={40} />
          <h3>No Orders Found</h3>
          <p>No orders match your search criteria or status filter.</p>
        </div>
      ) : (
        <div className="admin-orders-table-wrapper">
          <table className="admin-orders-table">
            <thead>
              <tr>
                <th>Order Ref</th>
                <th>Customer</th>
                <th>Fulfillment</th>
                <th>Items</th>
                <th>Total (₹)</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className={`order-row ${order.status === 'pending' ? 'is-pending' : ''}`}>
                  <td className="cell-ref">
                    <strong>{order.orderRef}</strong>
                    <span className="cell-date">
                      {order.createdAt?.toDate
                        ? order.createdAt.toDate().toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })
                        : 'Recent'}
                    </span>
                  </td>
                  <td className="cell-customer">
                    <strong>{order.customer?.name}</strong>
                    <span>{order.customer?.phone || 'No phone'}</span>
                  </td>
                  <td className="cell-delivery">
                    <span className="delivery-chip">
                      {order.deliveryMethod === 'shop_pickup' ? (
                        <>
                          <Store size={13} /> Pickup
                        </>
                      ) : (
                        <>
                          <Truck size={13} /> Delivery
                        </>
                      )}
                    </span>
                  </td>
                  <td className="cell-items">
                    <span>{order.itemsCount} unit(s)</span>
                  </td>
                  <td className="cell-total">
                    <strong>₹{(order.totalAmount || order.itemsSubtotal).toLocaleString('en-IN')}</strong>
                    {order.deliveryCharge === null && order.deliveryMethod === 'home_delivery' && (
                      <span className="unquoted-tag">+ delivery quote</span>
                    )}
                  </td>
                  <td className="cell-payment">
                    <span className="payment-chip">
                      {order.paymentMethod?.toUpperCase()}
                    </span>
                    <span className={`payment-status ${order.paymentStatus}`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="cell-status">{getStatusBadge(order.status)}</td>
                  <td className="cell-actions">
                    <button
                      type="button"
                      className="order-btn-view"
                      onClick={() => setSelectedOrder(order)}
                      title="View Details"
                    >
                      <Eye size={15} />
                    </button>

                    {order.status === ORDER_STATUSES.PENDING && (
                      <>
                        <button
                          type="button"
                          className="order-btn-confirm"
                          onClick={() => openConfirmModal(order)}
                          title="Confirm & Deduct Stock"
                        >
                          <CheckCircle size={15} />
                        </button>
                        <button
                          type="button"
                          className="order-btn-reject"
                          onClick={() => setRejectModalOrder(order)}
                          title="Reject Order"
                        >
                          <XCircle size={15} />
                        </button>
                      </>
                    )}

                    {order.status !== ORDER_STATUSES.CANCELLED &&
                      order.status !== ORDER_STATUSES.REJECTED &&
                      order.status !== ORDER_STATUSES.DELIVERED &&
                      order.status !== ORDER_STATUSES.PENDING && (
                        <button
                          type="button"
                          className="order-btn-cancel"
                          onClick={() => setCancelModalOrder(order)}
                          title="Cancel Order & Restore Stock"
                        >
                          <RotateCcw size={14} />
                        </button>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Order Detail Modal ── */}
      {selectedOrder && (
        <div className="order-modal-backdrop" onClick={() => setSelectedOrder(null)}>
          <div className="order-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="order-modal-head">
              <div>
                <h3>Order #{selectedOrder.orderRef}</h3>
                <span className="order-modal-sub">
                  Created on{' '}
                  {selectedOrder.createdAt?.toDate
                    ? selectedOrder.createdAt.toDate().toLocaleString('en-IN')
                    : 'Recent'}
                </span>
              </div>
              <button
                type="button"
                className="order-modal-close"
                onClick={() => setSelectedOrder(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="order-modal-body">
              {/* Order Status & Stock Badge */}
              <div className="order-modal-banner">
                <div>
                  <strong>Current Status:</strong> {getStatusBadge(selectedOrder.status)}
                </div>
                <div className="order-modal-stock-flag">
                  {selectedOrder.stockDeducted ? (
                    <span className="stock-flag stock-flag--deducted">
                      ✓ Stock Deducted from Showroom
                    </span>
                  ) : (
                    <span className="stock-flag stock-flag--held">
                      ○ Zero Stock Deducted (Pending Confirmation)
                    </span>
                  )}
                </div>
              </div>

              {/* Status Flow Stepper Buttons for Admin */}
              {selectedOrder.status !== ORDER_STATUSES.CANCELLED &&
                selectedOrder.status !== ORDER_STATUSES.REJECTED && (
                  <div className="order-modal-workflow">
                    <h4>Advance Fulfillment Stage</h4>
                    <div className="workflow-buttons">
                      {selectedOrder.status === ORDER_STATUSES.PENDING && (
                        <button
                          type="button"
                          className="workflow-btn confirm"
                          onClick={() => {
                            const orderToConfirm = selectedOrder;
                            setSelectedOrder(null);
                            openConfirmModal(orderToConfirm);
                          }}
                        >
                          Confirm &amp; Deduct Stock
                        </button>
                      )}
                      {selectedOrder.status === ORDER_STATUSES.CONFIRMED && (
                        <button
                          type="button"
                          className="workflow-btn"
                          onClick={() => handleAdvanceStatus(selectedOrder.id, ORDER_STATUSES.PROCESSING)}
                        >
                          Mark as Processing
                        </button>
                      )}
                      {selectedOrder.status === ORDER_STATUSES.PROCESSING && (
                        <>
                          {selectedOrder.deliveryMethod === 'shop_pickup' ? (
                            <button
                              type="button"
                              className="workflow-btn"
                              onClick={() =>
                                handleAdvanceStatus(selectedOrder.id, ORDER_STATUSES.READY_FOR_PICKUP)
                              }
                            >
                              Ready for Showroom Pickup
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="workflow-btn"
                              onClick={() =>
                                handleAdvanceStatus(selectedOrder.id, ORDER_STATUSES.SHIPPED)
                              }
                            >
                              Mark as Shipped / Dispatched
                            </button>
                          )}
                        </>
                      )}
                      {(selectedOrder.status === ORDER_STATUSES.SHIPPED ||
                        selectedOrder.status === ORDER_STATUSES.READY_FOR_PICKUP) && (
                        <button
                          type="button"
                          className="workflow-btn complete"
                          onClick={() => handleAdvanceStatus(selectedOrder.id, ORDER_STATUSES.DELIVERED)}
                        >
                          Mark as Delivered / Collected
                        </button>
                      )}
                    </div>
                  </div>
                )}

              {/* Customer & Delivery Information */}
              <div className="order-modal-grid">
                <div className="order-modal-box">
                  <h4>Customer Information</h4>
                  <p>
                    <strong>Name:</strong> {selectedOrder.customer?.name}
                  </p>
                  <p>
                    <strong>Mobile:</strong> {selectedOrder.customer?.phone || 'N/A'}
                  </p>
                  {selectedOrder.customer?.email && (
                    <p>
                      <strong>Email:</strong> {selectedOrder.customer?.email}
                    </p>
                  )}
                  <p>
                    <strong>Account:</strong>{' '}
                    {selectedOrder.customer?.isGuest ? 'Guest Checkout' : 'Registered Rider Member'}
                  </p>
                </div>

                <div className="order-modal-box">
                  <h4>Fulfillment Details</h4>
                  {selectedOrder.deliveryMethod === 'shop_pickup' ? (
                    <div>
                      <p>
                        <strong>Mode:</strong> Showroom Pickup (BIKER CAFE Arni)
                      </p>
                      <p>
                        <strong>Pickup Date:</strong>{' '}
                        {selectedOrder.pickupDetails?.pickupDate || 'Not specified'}
                      </p>
                      <p>
                        <strong>Time Slot:</strong>{' '}
                        {selectedOrder.pickupDetails?.pickupTimeSlot || 'Afternoon'}
                      </p>
                      <p>
                        <strong>Collector:</strong>{' '}
                        {selectedOrder.pickupDetails?.collectorName} (+91{' '}
                        {selectedOrder.pickupDetails?.collectorPhone})
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p>
                        <strong>Mode:</strong> Home Delivery
                      </p>
                      {selectedOrder.deliveryAddress ? (
                        <p>
                          <strong>Address:</strong> {selectedOrder.deliveryAddress.houseNo},{' '}
                          {selectedOrder.deliveryAddress.street},{' '}
                          {selectedOrder.deliveryAddress.area},{' '}
                          {selectedOrder.deliveryAddress.city},{' '}
                          {selectedOrder.deliveryAddress.state} -{' '}
                          <strong>{selectedOrder.deliveryAddress.pinCode}</strong>
                        </p>
                      ) : (
                        <p>No address specified</p>
                      )}
                      {selectedOrder.deliveryAddress?.landmark && (
                        <p>
                          <strong>Landmark:</strong> Near {selectedOrder.deliveryAddress.landmark}
                        </p>
                      )}
                      {selectedOrder.deliveryAddress?.instructions && (
                        <p>
                          <strong>Instructions:</strong> {selectedOrder.deliveryAddress.instructions}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div className="order-modal-items">
                <h4>Ordered Helmets &amp; Gear</h4>
                <div className="modal-items-list">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="modal-item-row">
                      <img src={item.image} alt={item.title} className="modal-item-img" />
                      <div className="modal-item-info">
                        <strong>{item.title}</strong>
                        <span>
                          Size: {item.selectedSize} · Finish: {item.selectedFinish} · Qty: {item.quantity}
                        </span>
                      </div>
                      <strong className="modal-item-total">
                        ₹{(item.lineTotal || item.unitPrice * item.quantity).toLocaleString('en-IN')}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment & Charges */}
              <div className="order-modal-summary">
                <div className="summary-row">
                  <span>Items Subtotal:</span>
                  <strong>₹{selectedOrder.itemsSubtotal.toLocaleString('en-IN')}</strong>
                </div>
                <div className="summary-row">
                  <span>Delivery Charge:</span>
                  <strong>
                    {selectedOrder.deliveryCharge !== null
                      ? `₹${Number(selectedOrder.deliveryCharge).toLocaleString('en-IN')}`
                      : 'Pending Showroom Quotation'}
                  </strong>
                </div>
                <div className="summary-row total">
                  <span>Total Amount:</span>
                  <strong>
                    ₹
                    {(
                      selectedOrder.totalAmount ||
                      selectedOrder.itemsSubtotal + (Number(selectedOrder.deliveryCharge) || 0)
                    ).toLocaleString('en-IN')}
                  </strong>
                </div>

                <div className="summary-payment-status">
                  <span>Payment Method: <strong>{selectedOrder.paymentMethod?.toUpperCase()}</strong></span>
                  <span>Payment Status: <strong className={`status-${selectedOrder.paymentStatus}`}>{selectedOrder.paymentStatus}</strong></span>
                  {selectedOrder.paymentStatus !== 'received' && (
                    <button
                      type="button"
                      className="mark-paid-btn"
                      onClick={() => handleTogglePaymentStatus(selectedOrder.id, 'received')}
                    >
                      Mark as Received
                    </button>
                  )}
                </div>
              </div>

              {/* Order Timeline */}
              {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                <div className="order-modal-history">
                  <h4>Status Timeline &amp; Audit Trail</h4>
                  <div className="timeline-list">
                    {selectedOrder.statusHistory.map((step, idx) => (
                      <div key={idx} className="timeline-item">
                        <span className="timeline-dot" />
                        <div className="timeline-content">
                          <strong>{step.status.replace(/_/g, ' ').toUpperCase()}</strong>
                          <span className="timeline-time">
                            {new Date(step.timestamp).toLocaleString('en-IN')}
                          </span>
                          <p>{step.note}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Order Modal (Quoting Delivery & Committing Stock) ── */}
      {confirmModalOrder && (
        <div className="order-modal-backdrop" onClick={() => !actionLoading && setConfirmModalOrder(null)}>
          <div className="action-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="action-dialog__head">
              <CheckCircle size={22} className="confirm-icon" />
              <h3>Confirm Order &amp; Commit Physical Stock</h3>
            </div>

            <p className="action-dialog__desc">
              Confirming order <strong>{confirmModalOrder.orderRef}</strong> will validate and
              atomically deduct physical inventory from the showroom stock.
            </p>

            {confirmError && (
              <div className="action-dialog__error" role="alert" style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #ef4444',
                color: '#fca5a5',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm, 6px)',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                lineHeight: 1.4,
              }}>
                <AlertTriangle size={16} style={{ flexShrink: 0, color: '#ef4444' }} />
                <span>{confirmError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmSubmit}>
              {confirmModalOrder.deliveryMethod === 'home_delivery' ? (
                <div className="action-dialog__input-group">
                  <label htmlFor="delivery-charge">
                    Actual Delivery Charge for this Order (₹) <span className="req">*</span>
                  </label>
                  <div className="input-with-icon">
                    <IndianRupee size={16} />
                    <input
                      id="delivery-charge"
                      type="number"
                      min={0}
                      required
                      placeholder="e.g. 150"
                      value={deliveryChargeInput}
                      onChange={(e) => setDeliveryChargeInput(e.target.value)}
                    />
                  </div>
                  <span className="input-hint">
                    Calculated by showroom based on destination and courier rates.
                  </span>
                </div>
              ) : (
                <div className="action-dialog__info-box" style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm, 6px)',
                  fontSize: '0.82rem',
                  color: 'var(--silver-muted, #94a3b8)',
                }}>
                  <span>Showroom Pickup: <strong>Delivery charge is ₹0 (Free)</strong></span>
                </div>
              )}

              <div className="action-dialog__actions">
                <button
                  type="button"
                  className="dialog-btn-cancel"
                  onClick={() => {
                    setConfirmModalOrder(null);
                    setConfirmError('');
                  }}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="dialog-btn-submit"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Deducting Stock...' : 'Confirm & Deduct Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Reject Order Modal ── */}
      {rejectModalOrder && (
        <div className="order-modal-backdrop" onClick={() => setRejectModalOrder(null)}>
          <div className="action-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="action-dialog__head">
              <XCircle size={22} className="reject-icon" />
              <h3>Reject Order</h3>
            </div>

            <p className="action-dialog__desc">
              Rejecting order <strong>{rejectModalOrder.orderRef}</strong> will notify the customer.
              Since stock was not deducted, no inventory changes will occur.
            </p>

            <form onSubmit={handleRejectSubmit}>
              <div className="action-dialog__input-group">
                <label htmlFor="reject-reason">Reason for Rejection</label>
                <textarea
                  id="reject-reason"
                  rows={2}
                  placeholder="e.g. Out of stock at distributor, delivery area unserviceable."
                  value={rejectReasonInput}
                  onChange={(e) => setRejectReasonInput(e.target.value)}
                />
              </div>

              <div className="action-dialog__actions">
                <button
                  type="button"
                  className="dialog-btn-cancel"
                  onClick={() => setRejectModalOrder(null)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="dialog-btn-danger"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Rejecting...' : 'Reject Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Cancel Order Modal (Restoring Stock) ── */}
      {cancelModalOrder && (
        <div className="order-modal-backdrop" onClick={() => setCancelModalOrder(null)}>
          <div className="action-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="action-dialog__head">
              <AlertTriangle size={22} className="warning-icon" />
              <h3>Cancel Order &amp; Restore Stock</h3>
            </div>

            <p className="action-dialog__desc">
              Order <strong>{cancelModalOrder.orderRef}</strong> was confirmed. Cancelling will
              restore the allocated inventory back to showroom stock exactly once.
            </p>

            <form onSubmit={handleCancelSubmit}>
              <div className="action-dialog__input-group">
                <label htmlFor="cancel-reason">Cancellation Reason</label>
                <textarea
                  id="cancel-reason"
                  rows={2}
                  placeholder="e.g. Customer requested cancellation, payment failed."
                  value={cancelReasonInput}
                  onChange={(e) => setCancelReasonInput(e.target.value)}
                />
              </div>

              <div className="action-dialog__actions">
                <button
                  type="button"
                  className="dialog-btn-cancel"
                  onClick={() => setCancelModalOrder(null)}
                  disabled={actionLoading}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="dialog-btn-danger"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Restoring Stock...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
