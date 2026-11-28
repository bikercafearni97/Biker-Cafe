import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  MapPin,
  ShoppingBag,
  Inbox,
  Eye,
  X,
  Heart,
  Palette,
} from 'lucide-react';
import { getAllCustomers, getCustomerDetails } from '../../services/customersService';
import './AdminCustomersTab.css';

export default function AdminCustomersTab() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Failed to fetch customer directory:', err);
      setError('Failed to load registered customer directory.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getAllCustomers()
      .then((data) => {
        if (active) {
          setCustomers(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          console.error('Failed to load customers:', err);
          setError('Failed to load registered customers.');
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleInspectCustomer = async (cust) => {
    setDetailLoading(true);
    try {
      const details = await getCustomerDetails(cust.uid);
      setSelectedCustomer(details || cust);
    } catch (err) {
      console.error('Failed to load full customer details:', err);
      setSelectedCustomer(cust);
    } finally {
      setDetailLoading(false);
    }
  };

  const filteredCustomers = customers.filter((cust) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchName = cust.displayName?.toLowerCase().includes(q);
    const matchEmail = cust.email?.toLowerCase().includes(q);
    return matchName || matchEmail;
  });

  return (
    <div className="admin-customers-tab">
      {/* Metric Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <span className="admin-stat-card__label">Total Registered Riders</span>
          <strong className="admin-stat-card__val">{customers.length}</strong>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-card__label">With Saved Addresses</span>
          <strong className="admin-stat-card__val">
            {customers.filter((c) => c.addressesCount > 0).length}
          </strong>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-card__label">Active Wishlists</span>
          <strong className="admin-stat-card__val">
            {customers.filter((c) => c.wishlistCount > 0).length}
          </strong>
        </div>
      </div>

      {/* Search and Action Bar */}
      <div className="admin-customers-controls">
        <div className="admin-customers-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by rider name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button
          type="button"
          className="admin-customers-refresh"
          onClick={fetchCustomers}
          title="Refresh Customer Directory"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Directory Table */}
      {loading ? (
        <div className="admin-customers-loading">
          <RefreshCw size={24} className="spin" />
          <p>Loading registered rider profiles...</p>
        </div>
      ) : error ? (
        <div className="admin-customers-error">{error}</div>
      ) : filteredCustomers.length === 0 ? (
        <div className="admin-customers-empty">
          <Users size={40} />
          <h3>No Customers Found</h3>
          <p>No registered rider profiles match your search criteria.</p>
        </div>
      ) : (
        <div className="admin-customers-table-wrapper">
          <table className="admin-customers-table">
            <thead>
              <tr>
                <th>Rider Profile</th>
                <th>Email Address</th>
                <th>Saved Addresses</th>
                <th>Wishlist</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((cust) => (
                <tr key={cust.uid} className="customer-row">
                  <td className="cell-rider">
                    {cust.photoURL ? (
                      <img
                        src={cust.photoURL}
                        alt={cust.displayName}
                        className="rider-avatar-small"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="rider-avatar-placeholder">
                        <Users size={16} />
                      </div>
                    )}
                    <div>
                      <strong>{cust.displayName}</strong>
                      <span className="rider-uid">{cust.uid.slice(0, 10)}...</span>
                    </div>
                  </td>
                  <td className="cell-email">
                    <span>{cust.email}</span>
                  </td>
                  <td className="cell-stats">
                    <span className="count-chip">
                      <MapPin size={13} /> {cust.addressesCount} address(es)
                    </span>
                  </td>
                  <td className="cell-stats">
                    <span className="count-chip">
                      <Heart size={13} /> {cust.wishlistCount} item(s)
                    </span>
                  </td>
                  <td className="cell-date">
                    <span>{cust.createdAt ? new Date(cust.createdAt).toLocaleDateString('en-IN') : 'Member'}</span>
                  </td>
                  <td className="cell-action">
                    <button
                      type="button"
                      className="cust-btn-inspect"
                      onClick={() => handleInspectCustomer(cust)}
                      title="Inspect Profile &amp; History"
                    >
                      <Eye size={15} />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Customer Details Modal ── */}
      {selectedCustomer && (
        <div className="cust-modal-backdrop" onClick={() => setSelectedCustomer(null)}>
          <div className="cust-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="cust-modal-head">
              <div className="cust-head-user">
                {selectedCustomer.photoURL ? (
                  <img
                    src={selectedCustomer.photoURL}
                    alt={selectedCustomer.displayName}
                    className="modal-avatar"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="modal-avatar-fallback">
                    <Users size={24} />
                  </div>
                )}
                <div>
                  <h3>{selectedCustomer.displayName}</h3>
                  <span className="modal-email">{selectedCustomer.email}</span>
                  <span className="modal-uid">UID: {selectedCustomer.uid}</span>
                </div>
              </div>

              <button
                type="button"
                className="cust-modal-close"
                onClick={() => setSelectedCustomer(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="cust-modal-body">
              {detailLoading ? (
                <div className="detail-loading">
                  <RefreshCw size={20} className="spin" />
                  <span>Loading full activity history...</span>
                </div>
              ) : (
                <>
                  {/* Preferences Row */}
                  <div className="cust-metrics-box">
                    <div className="metric-item">
                      <Heart size={16} className="metric-icon" />
                      <div>
                        <strong>{selectedCustomer.wishlist?.length || 0} Items</strong>
                        <span>Wishlist Saved</span>
                      </div>
                    </div>

                    <div className="metric-item">
                      <ShoppingBag size={16} className="metric-icon" />
                      <div>
                        <strong>{selectedCustomer.orders?.length || 0} Orders</strong>
                        <span>Total Placed</span>
                      </div>
                    </div>

                    <div className="metric-item">
                      <Inbox size={16} className="metric-icon" />
                      <div>
                        <strong>{selectedCustomer.enquiries?.length || 0} Enquiries</strong>
                        <span>Contact Requests</span>
                      </div>
                    </div>

                    {selectedCustomer.theme && (
                      <div className="metric-item">
                        <Palette size={16} className="metric-icon" />
                        <div>
                          <strong>{selectedCustomer.theme.accent || 'Crimson'}</strong>
                          <span>Preferred Theme</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Saved Addresses */}
                  <div className="cust-history-section">
                    <h4>Saved Delivery Addresses ({selectedCustomer.addresses?.length || 0})</h4>
                    {selectedCustomer.addresses?.length === 0 ? (
                      <p className="empty-sub">No delivery addresses saved in this profile.</p>
                    ) : (
                      <div className="cust-addr-grid">
                        {selectedCustomer.addresses?.map((addr, idx) => (
                          <div key={idx} className="cust-addr-card">
                            <span className="addr-tag">{addr.label || 'Home'}</span>
                            <strong>{addr.fullName} (+91 {addr.phone})</strong>
                            <p>
                              {addr.houseNo}, {addr.street}, {addr.area}, {addr.city}, {addr.state} -{' '}
                              <strong>{addr.pinCode}</strong>
                            </p>
                            {addr.landmark && <span className="landmark">Near {addr.landmark}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Order History */}
                  <div className="cust-history-section">
                    <h4>Recent Order History ({selectedCustomer.orders?.length || 0})</h4>
                    {selectedCustomer.orders?.length === 0 ? (
                      <p className="empty-sub">No purchase orders recorded yet.</p>
                    ) : (
                      <div className="cust-history-list">
                        {selectedCustomer.orders?.map((ord) => (
                          <div key={ord.id} className="cust-history-row">
                            <div>
                              <strong>{ord.orderRef}</strong>
                              <span className="order-meta">
                                {ord.itemsCount} item(s) · ₹{(ord.totalAmount || ord.itemsSubtotal).toLocaleString('en-IN')}
                              </span>
                            </div>
                            <span className={`status-pill ${ord.status}`}>
                              {ord.status.replace(/_/g, ' ').toUpperCase()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Enquiry History */}
                  <div className="cust-history-section">
                    <h4>Customer Enquiries &amp; Messages ({selectedCustomer.enquiries?.length || 0})</h4>
                    {selectedCustomer.enquiries?.length === 0 ? (
                      <p className="empty-sub">No contact enquiries submitted by this rider account.</p>
                    ) : (
                      <div className="cust-history-list">
                        {selectedCustomer.enquiries?.map((enq) => (
                          <div key={enq.id} className="cust-history-row">
                            <div>
                              <strong>{enq.topic || 'General Enquiry'}</strong>
                              <p className="enq-preview">{enq.message}</p>
                            </div>
                            <span className={`status-pill ${enq.status}`}>
                              {enq.status.toUpperCase()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
