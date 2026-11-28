import { useState } from 'react';
import {
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Search,
  History,
  Edit3,
  Loader2,
  Clock,
} from 'lucide-react';
import {
  STOCK_STATUS,
  computeStockStatus,
  getInventoryHistory,
  adjustInventory,
} from '../../services/inventoryService';
import './InventoryDashboard.css';

/**
 * InventoryDashboard Component inside AdminPage
 *
 * Provides:
 * - Summary counts: Total, In Stock, Low Stock Warning, Out of Stock, Untracked
 * - Search by product title, slotCode, or category
 * - Stock filter tabs
 * - Quick stock adjustment modal with audit log reason
 * - View full adjustment history
 */
export default function InventoryDashboard({ products, onProductUpdated, adminUid }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [adjustingProduct, setAdjustingProduct] = useState(null);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [viewingHistory, setViewingHistory] = useState(false);

  // Adjustment Modal State
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustVariants, setAdjustVariants] = useState([]);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustError, setAdjustError] = useState('');

  // Calculate summary metrics
  const summary = {
    total: products.length,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
    untracked: 0,
  };

  products.forEach((p) => {
    const inv = p.inventory;
    if (!inv || !inv.trackingEnabled) {
      summary.untracked += 1;
    } else {
      const st = inv.stockStatus || computeStockStatus(inv);
      if (st === STOCK_STATUS.IN_STOCK) summary.inStock += 1;
      else if (st === STOCK_STATUS.LOW_STOCK) summary.lowStock += 1;
      else if (st === STOCK_STATUS.OUT_OF_STOCK) summary.outOfStock += 1;
      else summary.untracked += 1;
    }
  });

  const filteredProducts = products.filter((p) => {
    const inv = p.inventory;
    const st = !inv || !inv.trackingEnabled ? STOCK_STATUS.UNKNOWN : inv.stockStatus || computeStockStatus(inv);

    if (statusFilter !== 'all') {
      if (statusFilter === 'untracked' && st !== STOCK_STATUS.UNKNOWN) return false;
      if (statusFilter !== 'untracked' && st !== statusFilter) return false;
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match =
        (p.title || '').toLowerCase().includes(q) ||
        (p.slotCode || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  const openAdjustModal = (product) => {
    setAdjustingProduct(product);
    setAdjustmentReason('');
    setAdjustError('');
    const inv = product.inventory || {};
    if (Array.isArray(inv.variants) && inv.variants.length > 0) {
      setAdjustVariants(inv.variants.map((v) => ({ ...v })));
      setAdjustQty(0);
    } else {
      setAdjustVariants([]);
      setAdjustQty(Number(inv.quantity) || 0);
    }
  };

  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    if (!adjustmentReason.trim()) {
      setAdjustError('Please provide a reason for this stock adjustment.');
      return;
    }

    setIsAdjusting(true);
    setAdjustError('');

    try {
      const payload = {
        reason: adjustmentReason.trim(),
        adminUid: adminUid || 'aBlTShPkDvbT1GQ4Du0Vk3DBtEW2',
        type: 'manual_adjustment',
      };

      if (adjustVariants.length > 0) {
        payload.variants = adjustVariants;
      } else {
        payload.newQuantity = Math.max(0, parseInt(adjustQty, 10) || 0);
      }

      await adjustInventory(adjustingProduct.id, payload);
      setAdjustingProduct(null);
      if (onProductUpdated) onProductUpdated();
    } catch (err) {
      setAdjustError(err.message || 'Failed to update stock. Check permissions.');
    } finally {
      setIsAdjusting(false);
    }
  };

  const loadHistory = async (productId = null) => {
    setLoadingHistory(true);
    setViewingHistory(true);
    try {
      const logs = await getInventoryHistory(productId, 40);
      setHistoryLogs(logs);
    } catch (err) {
      console.error('Failed to load stock history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="admin-inventory-dash">
      {/* Top Metrics Cards */}
      <div className="admin-inv-metrics-grid">
        <div className="admin-inv-metric-card">
          <div className="admin-inv-metric-card__icon admin-inv-metric-card__icon--total">
            <Package size={20} />
          </div>
          <div className="admin-inv-metric-card__content">
            <span className="admin-inv-metric-card__val">{summary.total}</span>
            <span className="admin-inv-metric-card__label">Catalogue Products</span>
          </div>
        </div>

        <div className="admin-inv-metric-card">
          <div className="admin-inv-metric-card__icon admin-inv-metric-card__icon--instock">
            <CheckCircle2 size={20} />
          </div>
          <div className="admin-inv-metric-card__content">
            <span className="admin-inv-metric-card__val">{summary.inStock}</span>
            <span className="admin-inv-metric-card__label">In Stock</span>
          </div>
        </div>

        <div className="admin-inv-metric-card">
          <div className="admin-inv-metric-card__icon admin-inv-metric-card__icon--lowstock">
            <AlertTriangle size={20} />
          </div>
          <div className="admin-inv-metric-card__content">
            <span className="admin-inv-metric-card__val">{summary.lowStock}</span>
            <span className="admin-inv-metric-card__label">Low Stock Alert</span>
          </div>
        </div>

        <div className="admin-inv-metric-card">
          <div className="admin-inv-metric-card__icon admin-inv-metric-card__icon--outofstock">
            <XCircle size={20} />
          </div>
          <div className="admin-inv-metric-card__content">
            <span className="admin-inv-metric-card__val">{summary.outOfStock}</span>
            <span className="admin-inv-metric-card__label">Out of Stock</span>
          </div>
        </div>

        <div className="admin-inv-metric-card">
          <div className="admin-inv-metric-card__icon admin-inv-metric-card__icon--untracked">
            <HelpCircle size={20} />
          </div>
          <div className="admin-inv-metric-card__content">
            <span className="admin-inv-metric-card__val">{summary.untracked}</span>
            <span className="admin-inv-metric-card__label">Untracked / On Request</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="admin-inv-toolbar">
        <div className="admin-inv-search">
          <Search size={15} className="admin-inv-search-icon" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products by title, slot code, or category..."
          />
        </div>

        <div className="admin-inv-tabs">
          <button
            type="button"
            className={`admin-inv-tab ${statusFilter === 'all' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All ({products.length})
          </button>
          <button
            type="button"
            className={`admin-inv-tab ${statusFilter === STOCK_STATUS.IN_STOCK ? 'is-active' : ''}`}
            onClick={() => setStatusFilter(STOCK_STATUS.IN_STOCK)}
          >
            In Stock ({summary.inStock})
          </button>
          <button
            type="button"
            className={`admin-inv-tab ${statusFilter === STOCK_STATUS.LOW_STOCK ? 'is-active' : ''}`}
            onClick={() => setStatusFilter(STOCK_STATUS.LOW_STOCK)}
          >
            Low Stock ({summary.lowStock})
          </button>
          <button
            type="button"
            className={`admin-inv-tab ${statusFilter === STOCK_STATUS.OUT_OF_STOCK ? 'is-active' : ''}`}
            onClick={() => setStatusFilter(STOCK_STATUS.OUT_OF_STOCK)}
          >
            Out of Stock ({summary.outOfStock})
          </button>
          <button
            type="button"
            className={`admin-inv-tab ${statusFilter === 'untracked' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('untracked')}
          >
            Untracked ({summary.untracked})
          </button>
        </div>

        <button
          type="button"
          className="admin-inv-history-btn"
          onClick={() => loadHistory(null)}
        >
          <History size={14} />
          <span>Audit Log</span>
        </button>
      </div>

      {/* Product Inventory Table */}
      <div className="admin-inv-table-wrap">
        <table className="admin-inv-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Status</th>
              <th>Total Stock</th>
              <th>Size Breakdown</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="6" className="admin-inv-empty">
                  No products match current filter criteria.
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => {
                const inv = p.inventory;
                const tracking = inv && inv.trackingEnabled;
                const st = tracking ? inv.stockStatus || computeStockStatus(inv) : STOCK_STATUS.UNKNOWN;
                const totalQty = tracking
                  ? inv.variants?.length > 0
                    ? inv.variants.reduce((s, v) => s + (Number(v.quantity) || 0), 0)
                    : inv.quantity ?? '—'
                  : '—';

                return (
                  <tr key={p.id}>
                    <td>
                      <div className="admin-inv-prod-cell">
                        {p.image && (
                          <img
                            src={p.image}
                            alt={p.title}
                            className="admin-inv-prod-thumb"
                            loading="lazy"
                          />
                        )}
                        <div>
                          <span className="admin-inv-prod-title">{p.title}</span>
                          <span className="admin-inv-prod-code">{p.slotCode || p.category}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`admin-inv-status-pill admin-inv-status-pill--${st}`}>
                        {st === STOCK_STATUS.IN_STOCK && 'In Stock'}
                        {st === STOCK_STATUS.LOW_STOCK && 'Low Stock'}
                        {st === STOCK_STATUS.OUT_OF_STOCK && 'Out of Stock'}
                        {st === STOCK_STATUS.UNKNOWN && 'Untracked'}
                      </span>
                    </td>
                    <td>
                      <span className="admin-inv-qty-num">{totalQty}</span>
                    </td>
                    <td>
                      {inv?.variants?.length > 0 ? (
                        <div className="admin-inv-variant-chips">
                          {inv.variants.map((v, i) => (
                            <span
                              key={i}
                              className={`admin-inv-variant-chip ${v.quantity === 0 ? 'is-zero' : ''}`}
                            >
                              <strong>{v.size}:</strong> {v.quantity}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="admin-inv-no-variants">Single unit stock</span>
                      )}
                    </td>
                    <td>
                      <div className="admin-inv-last-date">
                        <Clock size={12} />
                        <span>
                          {inv?.lastUpdated
                            ? new Date(inv.lastUpdated).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Not yet adjusted'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="admin-inv-row-actions">
                        <button
                          type="button"
                          className="admin-inv-btn admin-inv-btn--adjust"
                          onClick={() => openAdjustModal(p)}
                        >
                          <Edit3 size={13} />
                          <span>Adjust</span>
                        </button>
                        <button
                          type="button"
                          className="admin-inv-btn admin-inv-btn--history"
                          onClick={() => loadHistory(p.id)}
                          title="View adjustment history"
                        >
                          <History size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Manual Stock Adjustment Modal */}
      {adjustingProduct && (
        <div className="admin-modal-backdrop" onClick={() => setAdjustingProduct(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__head">
              <h3>Adjust Stock: {adjustingProduct.title}</h3>
              <button
                type="button"
                className="admin-modal__close"
                onClick={() => setAdjustingProduct(null)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="admin-modal__body">
              {adjustError && (
                <div className="admin-modal__error">
                  <AlertTriangle size={15} />
                  <span>{adjustError}</span>
                </div>
              )}

              {adjustVariants.length > 0 ? (
                <div className="admin-modal__variants">
                  <label className="admin-modal__label">Size-wise Stock Breakdown</label>
                  <div className="admin-modal__variant-grid">
                    {adjustVariants.map((v, i) => (
                      <div key={i} className="admin-modal__variant-item">
                        <span className="admin-modal__variant-size">{v.size}</span>
                        <input
                          type="number"
                          min="0"
                          value={v.quantity}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                            const updated = [...adjustVariants];
                            updated[i].quantity = val;
                            setAdjustVariants(updated);
                          }}
                          className="admin-inv-input"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="admin-modal__field">
                  <label htmlFor="modal-qty" className="admin-modal__label">
                    New Available Physical Quantity
                  </label>
                  <input
                    id="modal-qty"
                    type="number"
                    min="0"
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(e.target.value)}
                    className="admin-inv-input admin-inv-input--large"
                    required
                  />
                </div>
              )}

              <div className="admin-modal__field">
                <label htmlFor="modal-reason" className="admin-modal__label">
                  Reason for Adjustment * (Audit Log)
                </label>
                <input
                  id="modal-reason"
                  type="text"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="e.g. Received new shipment, physical recount, showroom sample"
                  className="admin-inv-input"
                  required
                />
              </div>

              <div className="admin-modal__actions">
                <button
                  type="button"
                  className="admin-modal__btn admin-modal__btn--cancel"
                  onClick={() => setAdjustingProduct(null)}
                  disabled={isAdjusting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-modal__btn admin-modal__btn--submit"
                  disabled={isAdjusting}
                >
                  {isAdjusting ? <Loader2 size={14} className="admin-inv-spin" /> : null}
                  <span>{isAdjusting ? 'Recording Transaction...' : 'Save Stock Adjustment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock History Audit Log Modal */}
      {viewingHistory && (
        <div className="admin-modal-backdrop" onClick={() => setViewingHistory(false)}>
          <div className="admin-modal admin-modal--large" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__head">
              <div className="admin-modal__title-row">
                <History size={18} />
                <h3>Inventory Audit Log &amp; Transaction History</h3>
              </div>
              <button
                type="button"
                className="admin-modal__close"
                onClick={() => setViewingHistory(false)}
              >
                &times;
              </button>
            </div>

            <div className="admin-modal__body">
              {loadingHistory ? (
                <div className="admin-modal__loading">
                  <Loader2 size={24} className="admin-inv-spin" />
                  <span>Loading audit logs...</span>
                </div>
              ) : historyLogs.length === 0 ? (
                <div className="admin-modal__empty">
                  <span>No recorded stock transactions yet.</span>
                </div>
              ) : (
                <div className="admin-history-list">
                  {historyLogs.map((log) => (
                    <div key={log.id} className="admin-history-item">
                      <div className="admin-history-item__header">
                        <span className="admin-history-item__product">
                          {log.productTitle || log.slotCode || 'Product'}
                        </span>
                        <span className="admin-history-item__badge admin-history-item__badge--manual">
                          {log.type === 'manual_adjustment' ? 'Manual Adjustment' : log.type}
                        </span>
                      </div>
                      <p className="admin-history-item__reason">{log.reason}</p>
                      <div className="admin-history-item__meta">
                        <span>
                          {log.createdAt?.seconds
                            ? new Date(log.createdAt.seconds * 1000).toLocaleString()
                            : 'Just now'}
                        </span>
                        <span>Logged by: {log.adminUid ? log.adminUid.slice(0, 8) : 'Owner'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
