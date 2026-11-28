import { useState, useEffect, useCallback } from 'react';
import {
  Tag,
  Plus,
  CheckCircle,
  Trash2,
  RefreshCw,
  Edit2,
  X,
  AlertCircle,
} from 'lucide-react';
import {
  getAllCoupons,
  saveCoupon,
  deleteCoupon,
  toggleCouponActive,
} from '../../services/couponsService';
import './AdminCouponsTab.css';

const EMPTY_COUPON = {
  code: '',
  type: 'percentage',
  value: '',
  minSpend: '',
  maxDiscount: '',
  expiryDate: '',
  usageLimit: 100,
  isActive: true,
  description: '',
};

export default function AdminCouponsTab() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [formData, setFormData] = useState(EMPTY_COUPON);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionNotice, setActionNotice] = useState(null);

  const showNotice = (msg) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllCoupons();
      setCoupons(data);
    } catch (err) {
      console.error('Failed to fetch coupons:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getAllCoupons()
      .then((data) => {
        if (active) {
          setCoupons(data);
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

  const openCreateForm = () => {
    setEditingCode(null);
    setFormData(EMPTY_COUPON);
    setErrorMsg('');
    setIsEditing(true);
  };

  const openEditForm = (cp) => {
    setEditingCode(cp.code);
    setFormData({
      code: cp.code,
      type: cp.type || 'percentage',
      value: cp.value || '',
      minSpend: cp.minSpend || '',
      maxDiscount: cp.maxDiscount || '',
      expiryDate: cp.expiryDate || '',
      usageLimit: cp.usageLimit || 100,
      isActive: cp.isActive !== false,
      description: cp.description || '',
    });
    setErrorMsg('');
    setIsEditing(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!formData.code || formData.code.trim().length < 3) {
      setErrorMsg('Code must be at least 3 alphanumeric characters');
      return;
    }
    if (!formData.value || Number(formData.value) <= 0) {
      setErrorMsg('Discount value must be greater than 0');
      return;
    }

    setSubmitting(true);
    try {
      await saveCoupon(formData);
      showNotice(`Coupon ${formData.code.toUpperCase()} saved successfully.`);
      setIsEditing(false);
      setEditingCode(null);
      await fetchCoupons();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save coupon.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (code) => {
    if (!window.confirm(`Are you sure you want to delete coupon ${code}?`)) return;
    try {
      await deleteCoupon(code);
      showNotice(`Coupon ${code} deleted.`);
      await fetchCoupons();
    } catch (err) {
      alert('Failed to delete coupon: ' + err.message);
    }
  };

  const handleToggle = async (code, currentActive) => {
    try {
      await toggleCouponActive(code, !currentActive);
      showNotice(`Coupon ${code} marked as ${!currentActive ? 'Active' : 'Inactive'}.`);
      await fetchCoupons();
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  return (
    <div className="admin-coupons-tab">
      {/* Header */}
      <div className="coupons-header">
        <div>
          <h3 className="coupons-title">
            <Tag size={20} className="coupons-icon" />
            <span>Showroom Coupons &amp; Promotional Offers</span>
          </h3>
          <p className="coupons-sub">
            Create percentage or flat discount vouchers with minimum spend and usage limits.
          </p>
        </div>

        {!isEditing && (
          <button type="button" className="create-coupon-btn" onClick={openCreateForm}>
            <Plus size={16} />
            <span>Create New Coupon</span>
          </button>
        )}
      </div>

      {actionNotice && (
        <div className="coupons-notice">
          <CheckCircle size={16} />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Coupon Modal Form */}
      {isEditing && (
        <div className="coupon-modal-backdrop" onClick={() => setIsEditing(false)}>
          <div className="coupon-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="coupon-modal-head">
              <h4>{editingCode ? `Edit Coupon: ${editingCode}` : 'Create New Promotional Coupon'}</h4>
              <button
                type="button"
                className="modal-close"
                onClick={() => setIsEditing(false)}
              >
                <X size={18} />
              </button>
            </div>

            {errorMsg && (
              <div className="coupon-modal-error">
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="coupon-form">
              <div className="coupon-form-grid">
                <div className="coupon-form-group">
                  <label htmlFor="coupon-code">Coupon Code <span className="req">*</span></label>
                  <input
                    id="coupon-code"
                    type="text"
                    required
                    placeholder="e.g. AXOR10, BIKER500"
                    value={formData.code}
                    disabled={Boolean(editingCode)}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                    }
                  />
                </div>

                <div className="coupon-form-group">
                  <label htmlFor="coupon-type">Discount Type <span className="req">*</span></label>
                  <select
                    id="coupon-type"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, type: e.target.value }))
                    }
                  >
                    <option value="percentage">Percentage (%) Discount</option>
                    <option value="fixed">Fixed Cash Amount (₹) Off</option>
                  </select>
                </div>

                <div className="coupon-form-group">
                  <label htmlFor="coupon-val">
                    Discount Value {formData.type === 'percentage' ? '(%)' : '(₹)'} <span className="req">*</span>
                  </label>
                  <input
                    id="coupon-val"
                    type="number"
                    min={1}
                    max={formData.type === 'percentage' ? 90 : 50000}
                    required
                    placeholder={formData.type === 'percentage' ? 'e.g. 10' : 'e.g. 500'}
                    value={formData.value}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, value: e.target.value }))
                    }
                  />
                </div>

                <div className="coupon-form-group">
                  <label htmlFor="coupon-minSpend">Minimum Order Amount (₹)</label>
                  <input
                    id="coupon-minSpend"
                    type="number"
                    min={0}
                    placeholder="e.g. 3000 (0 for none)"
                    value={formData.minSpend}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, minSpend: e.target.value }))
                    }
                  />
                </div>

                {formData.type === 'percentage' && (
                  <div className="coupon-form-group">
                    <label htmlFor="coupon-maxDiscount">Maximum Discount Cap (₹)</label>
                    <input
                      id="coupon-maxDiscount"
                      type="number"
                      min={0}
                      placeholder="e.g. 1000 (leave blank for unlimited)"
                      value={formData.maxDiscount}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, maxDiscount: e.target.value }))
                      }
                    />
                  </div>
                )}

                <div className="coupon-form-group">
                  <label htmlFor="coupon-expiry">Expiry Date</label>
                  <input
                    id="coupon-expiry"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.expiryDate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, expiryDate: e.target.value }))
                    }
                  />
                </div>

                <div className="coupon-form-group">
                  <label htmlFor="coupon-limit">Maximum Usage Count</label>
                  <input
                    id="coupon-limit"
                    type="number"
                    min={1}
                    value={formData.usageLimit}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, usageLimit: e.target.value }))
                    }
                  />
                </div>

                <div className="coupon-form-group full-width">
                  <label htmlFor="coupon-desc">Promotion Description</label>
                  <input
                    id="coupon-desc"
                    type="text"
                    placeholder="e.g. Exclusive 10% discount on all premium AXOR Apex and Retro models."
                    value={formData.description}
                    maxLength={200}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="coupon-form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsEditing(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-save" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coupons List Grid */}
      {loading ? (
        <div className="coupons-loading">
          <RefreshCw size={24} className="spin" />
          <p>Loading active coupons...</p>
        </div>
      ) : coupons.length === 0 ? (
        <div className="coupons-empty">
          <Tag size={36} />
          <p>No coupons created yet.</p>
          <button type="button" className="create-coupon-btn" onClick={openCreateForm}>
            Create Your First Coupon
          </button>
        </div>
      ) : (
        <div className="coupons-grid">
          {coupons.map((cp) => (
            <div key={cp.code} className={`coupon-card ${!cp.isActive ? 'is-inactive' : ''}`}>
              <div className="coupon-card__head">
                <span className="coupon-code-badge">{cp.code}</span>
                <span className={`coupon-status-pill ${cp.isActive ? 'active' : 'inactive'}`}>
                  {cp.isActive ? 'Active' : 'Disabled'}
                </span>
              </div>

              <div className="coupon-card__body">
                <div className="coupon-val-row">
                  <strong className="coupon-val">
                    {cp.type === 'percentage' ? `${cp.value}% OFF` : `₹${cp.value} FLAT OFF`}
                  </strong>
                  {cp.maxDiscount && cp.type === 'percentage' && (
                    <span className="coupon-cap">Upto ₹{cp.maxDiscount}</span>
                  )}
                </div>

                {cp.description && <p className="coupon-desc">{cp.description}</p>}

                <div className="coupon-rules">
                  {cp.minSpend ? (
                    <span>Min spend: ₹{cp.minSpend.toLocaleString('en-IN')}</span>
                  ) : (
                    <span>No minimum order</span>
                  )}
                  {cp.expiryDate ? (
                    <span>Expires: {cp.expiryDate}</span>
                  ) : (
                    <span>No expiry date</span>
                  )}
                  <span>
                    Used: {cp.usedCount || 0} / {cp.usageLimit || '∞'}
                  </span>
                </div>
              </div>

              <div className="coupon-card__footer">
                <button
                  type="button"
                  className="card-action-btn"
                  onClick={() => handleToggle(cp.code, cp.isActive)}
                >
                  {cp.isActive ? 'Disable' : 'Enable'}
                </button>
                <div className="footer-right">
                  <button
                    type="button"
                    className="card-icon-btn"
                    onClick={() => openEditForm(cp)}
                    title="Edit coupon"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    type="button"
                    className="card-icon-btn delete"
                    onClick={() => handleDelete(cp.code)}
                    title="Delete coupon"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
