import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  AlertTriangle,
  Download,
  Printer,
  RefreshCw,
  Users,
  Award,
} from 'lucide-react';
import { getDashboardAnalytics, exportOrdersToCsv } from '../../services/analyticsService';
import './AdminAnalyticsTab.css';

export default function AdminAnalyticsTab() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDashboardAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getDashboardAnalytics()
      .then((data) => {
        if (active) {
          setAnalytics(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          console.error(err);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (analytics?.orders) {
      exportOrdersToCsv(analytics.orders);
    }
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <RefreshCw size={24} className="spin" />
        <p>Calculating live showroom metrics and sales reports...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="analytics-empty">
        <AlertTriangle size={36} />
        <p>Analytics currently unavailable. Please refresh.</p>
      </div>
    );
  }

  const { orderStats, revenue, popularProducts, inventoryHealth, enquiryStats, customers } = analytics;

  return (
    <div className="admin-analytics-tab">
      {/* Header Actions */}
      <div className="analytics-top-actions">
        <div>
          <h3 className="analytics-title">
            <TrendingUp size={22} className="analytics-icon" />
            <span>Showroom Intelligence &amp; Performance Reports</span>
          </h3>
          <p className="analytics-sub">
            Real sales data distinguishing received vs. pending payments, stock health, and customer volume.
          </p>
        </div>

        <div className="analytics-buttons-row">
          <button
            type="button"
            className="analytics-btn export"
            onClick={handleExportExcel}
            title="Download CSV for Excel"
          >
            <Download size={15} />
            <span>Export to Excel (CSV)</span>
          </button>

          <button
            type="button"
            className="analytics-btn print"
            onClick={handlePrint}
            title="Print Summary Report"
          >
            <Printer size={15} />
            <span>Print Report (PDF)</span>
          </button>

          <button
            type="button"
            className="analytics-btn refresh"
            onClick={fetchAnalytics}
            title="Refresh Data"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Primary Financial Metric Cards */}
      <div className="analytics-kpi-grid">
        {/* Confirmed Realized Revenue */}
        <div className="kpi-card highlight-green">
          <div className="kpi-card__head">
            <span className="kpi-label">Received Revenue</span>
            <div className="kpi-badge received">Realized</div>
          </div>
          <strong className="kpi-value">₹{revenue.received.toLocaleString('en-IN')}</strong>
          <span className="kpi-note">Directly paid and received in showroom accounts</span>
        </div>

        {/* Pending Revenue */}
        <div className="kpi-card highlight-amber">
          <div className="kpi-card__head">
            <span className="kpi-label">Pending Collection</span>
            <div className="kpi-badge pending">Awaiting</div>
          </div>
          <strong className="kpi-value">₹{revenue.pending.toLocaleString('en-IN')}</strong>
          <span className="kpi-note">COD awaiting delivery or unpaid orders</span>
        </div>

        {/* Total Orders */}
        <div className="kpi-card">
          <div className="kpi-card__head">
            <span className="kpi-label">Total Orders Placed</span>
            <ShoppingBag size={16} className="kpi-icon" />
          </div>
          <strong className="kpi-value">{orderStats.total}</strong>
          <span className="kpi-note">
            {orderStats.delivered} delivered · {orderStats.confirmed + orderStats.processing + orderStats.readyForPickup + orderStats.shipped} active
          </span>
        </div>

        {/* Registered Riders */}
        <div className="kpi-card">
          <div className="kpi-card__head">
            <span className="kpi-label">Registered Customers</span>
            <Users size={16} className="kpi-icon" />
          </div>
          <strong className="kpi-value">{customers.length}</strong>
          <span className="kpi-note">Rider member profiles created</span>
        </div>
      </div>

      {/* Orders Pipeline Breakdown */}
      <div className="analytics-section-card">
        <h4>Order Lifecycle Pipeline</h4>
        <div className="pipeline-bars-grid">
          <div className="pipeline-item">
            <span className="pipeline-status">Pending Review</span>
            <strong className="pipeline-num status-pending">{orderStats.pending}</strong>
            <span className="pipeline-desc">Zero stock deducted</span>
          </div>

          <div className="pipeline-item">
            <span className="pipeline-status">Confirmed (Active)</span>
            <strong className="pipeline-num status-confirmed">{orderStats.confirmed}</strong>
            <span className="pipeline-desc">Physical stock held</span>
          </div>

          <div className="pipeline-item">
            <span className="pipeline-status">Processing &amp; Packing</span>
            <strong className="pipeline-num status-processing">{orderStats.processing}</strong>
            <span className="pipeline-desc">In preparation</span>
          </div>

          <div className="pipeline-item">
            <span className="pipeline-status">Ready / Shipped</span>
            <strong className="pipeline-num status-shipped">
              {orderStats.readyForPickup + orderStats.shipped}
            </strong>
            <span className="pipeline-desc">Dispatched or ready</span>
          </div>

          <div className="pipeline-item">
            <span className="pipeline-status">Delivered &amp; Completed</span>
            <strong className="pipeline-num status-delivered">{orderStats.delivered}</strong>
            <span className="pipeline-desc">Fulfilled to rider</span>
          </div>

          <div className="pipeline-item">
            <span className="pipeline-status">Cancelled / Rejected</span>
            <strong className="pipeline-num status-cancelled">
              {orderStats.cancelled + orderStats.rejected}
            </strong>
            <span className="pipeline-desc">Stock restored or rejected</span>
          </div>
        </div>
      </div>

      {/* Two-Column Insights Grid */}
      <div className="analytics-dual-grid">
        {/* Popular Helmet Models */}
        <div className="analytics-section-card">
          <div className="section-head-row">
            <h4>Top Helmets by Demand</h4>
            <Award size={16} className="head-icon" />
          </div>

          {popularProducts.length === 0 ? (
            <p className="empty-notice">No orders recorded yet to rank helmet popularity.</p>
          ) : (
            <div className="popular-products-list">
              {popularProducts.slice(0, 5).map((p, idx) => (
                <div key={p.id} className="popular-product-row">
                  <span className="rank-badge">#{idx + 1}</span>
                  <img src={p.image} alt={p.title} className="popular-product-img" />
                  <div className="popular-product-info">
                    <strong>{p.title}</strong>
                    <span>{p.brand}</span>
                  </div>
                  <div className="popular-product-stats">
                    <span className="units-count">{p.unitsSold} units</span>
                    <span className="rev-count">₹{p.revenue.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inventory Stock Health */}
        <div className="analytics-section-card">
          <div className="section-head-row">
            <h4>Physical Stock Health</h4>
            <AlertTriangle size={16} className="head-icon warning" />
          </div>

          <div className="stock-health-summary">
            <div className="health-block">
              <span className="health-num red">{inventoryHealth.outOfStock.length}</span>
              <span className="health-label">Out of Stock</span>
            </div>
            <div className="health-block">
              <span className="health-num amber">{inventoryHealth.lowStock.length}</span>
              <span className="health-label">Low Stock</span>
            </div>
            <div className="health-block">
              <span className="health-num green">
                {inventoryHealth.totalTracked -
                  (inventoryHealth.outOfStock.length + inventoryHealth.lowStock.length)}
              </span>
              <span className="health-label">Healthy Stock</span>
            </div>
          </div>

          {inventoryHealth.lowStock.length > 0 || inventoryHealth.outOfStock.length > 0 ? (
            <div className="stock-alert-list">
              {inventoryHealth.outOfStock.map((p) => (
                <div key={p.id} className="stock-alert-row out">
                  <span>{p.title}</span>
                  <span className="stock-tag">0 units</span>
                </div>
              ))}
              {inventoryHealth.lowStock.map((p) => (
                <div key={p.id} className="stock-alert-row low">
                  <span>{p.title}</span>
                  <span className="stock-tag">
                    {p.inventory?.quantity || 1} units remaining
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-notice green-text">All tracked showroom helmet stock is healthy.</p>
          )}
        </div>
      </div>

      {/* Customer Enquiries & Payment Split */}
      <div className="analytics-dual-grid">
        <div className="analytics-section-card">
          <h4>Payment Method Split</h4>
          <div className="split-rows">
            <div className="split-row">
              <span>Cash on Delivery (Pay on Receipt)</span>
              <strong>{revenue.codCount} orders</strong>
            </div>
            <div className="split-row">
              <span>Online Payment Architecture</span>
              <strong>{revenue.onlineCount} orders</strong>
            </div>
          </div>
        </div>

        <div className="analytics-section-card">
          <h4>Customer Enquiries Overview</h4>
          <div className="split-rows">
            <div className="split-row">
              <span>Total Received</span>
              <strong>{enquiryStats.total}</strong>
            </div>
            <div className="split-row">
              <span>New &amp; Unresolved</span>
              <strong className="status-pending">{enquiryStats.new}</strong>
            </div>
            <div className="split-row">
              <span>Resolved</span>
              <strong className="status-delivered">{enquiryStats.resolved}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
