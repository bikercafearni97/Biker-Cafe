import { useState } from 'react';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Home,
  Briefcase,
  Navigation,
  AlertCircle,
  X,
} from 'lucide-react';
import { useCustomerData } from '../../context/CustomerDataContext';
import { INDIAN_STATES, validateAddress } from '../../utils/addressValidation';
import './AddressManager.css';

const EMPTY_FORM = {
  fullName: '',
  phone: '',
  altPhone: '',
  houseNo: '',
  street: '',
  area: '',
  landmark: '',
  city: '',
  district: '',
  state: 'Tamil Nadu',
  pinCode: '',
  instructions: '',
  label: 'Home',
  isDefault: false,
};

export default function AddressManager({ isSelectable = false, selectedId = null, onSelect = null }) {
  const {
    addresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  } = useCustomerData();

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [actionNotice, setActionNotice] = useState(null);

  const showNotice = (msg) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const openAddForm = () => {
    setEditingId(null);
    setFormData({
      ...EMPTY_FORM,
      isDefault: addresses.length === 0,
    });
    setErrors({});
    setIsEditing(true);
  };

  const openEditForm = (addr) => {
    setEditingId(addr.id);
    setFormData({
      fullName: addr.fullName || '',
      phone: addr.phone || '',
      altPhone: addr.altPhone || '',
      houseNo: addr.houseNo || '',
      street: addr.street || '',
      area: addr.area || '',
      landmark: addr.landmark || '',
      city: addr.city || '',
      district: addr.district || '',
      state: addr.state || 'Tamil Nadu',
      pinCode: addr.pinCode || '',
      instructions: addr.instructions || '',
      label: addr.label || 'Home',
      isDefault: Boolean(addr.isDefault),
    });
    setErrors({});
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validateAddress(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        const res = await updateAddress(editingId, formData);
        if (res.success) {
          showNotice('Delivery address updated successfully');
          setIsEditing(false);
          setEditingId(null);
        } else {
          setErrors(res.errors || {});
        }
      } else {
        const res = await addAddress(formData);
        if (res.success) {
          showNotice('New delivery address added');
          setIsEditing(false);
          setEditingId(null);
          if (isSelectable && onSelect && res.address) {
            onSelect(res.address.id);
          }
        } else {
          setErrors(res.errors || {});
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this delivery address?')) {
      await deleteAddress(id);
      showNotice('Address removed');
    }
  };

  const handleSetDefault = async (id, e) => {
    e.stopPropagation();
    await setDefaultAddress(id);
    showNotice('Default delivery address updated');
  };

  const getLabelIcon = (label) => {
    switch (label?.toLowerCase()) {
      case 'home':
        return <Home size={14} />;
      case 'work':
        return <Briefcase size={14} />;
      default:
        return <Navigation size={14} />;
    }
  };

  return (
    <div className="address-manager">
      <div className="address-manager__header">
        <div>
          <h3 className="address-manager__title">
            <MapPin size={20} className="address-manager__icon" />
            <span>Delivery Addresses</span>
          </h3>
          <p className="address-manager__sub">
            Manage your verified shipping locations for speedy superbike gear delivery.
          </p>
        </div>

        {!isEditing && (
          <button
            type="button"
            className="address-manager__add-btn"
            onClick={openAddForm}
          >
            <Plus size={16} />
            <span>Add New Address</span>
          </button>
        )}
      </div>

      {actionNotice && (
        <div className="address-manager__notice">
          <CheckCircle size={16} />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Address Form (Add or Edit) */}
      {isEditing && (
        <form className="address-form" onSubmit={handleSubmit} noValidate>
          <div className="address-form__head">
            <h4>{editingId ? 'Edit Delivery Address' : 'Add New Delivery Address'}</h4>
            <button
              type="button"
              className="address-form__close"
              onClick={handleCancel}
              aria-label="Close form"
            >
              <X size={18} />
            </button>
          </div>

          {errors.general && (
            <div className="address-form__error-banner">
              <AlertCircle size={16} />
              <span>{errors.general}</span>
            </div>
          )}

          <div className="address-form__grid">
            {/* Full Name */}
            <div className="address-form__group">
              <label htmlFor="addr-fullName">
                Recipient Full Name <span className="req">*</span>
              </label>
              <input
                id="addr-fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="e.g. Narasimman A"
                className={errors.fullName ? 'has-error' : ''}
              />
              {errors.fullName && <span className="field-err">{errors.fullName}</span>}
            </div>

            {/* Mobile Number */}
            <div className="address-form__group">
              <label htmlFor="addr-phone">
                Mobile Number <span className="req">*</span>
              </label>
              <input
                id="addr-phone"
                name="phone"
                type="tel"
                maxLength={10}
                value={formData.phone}
                onChange={handleChange}
                placeholder="10-digit Indian mobile (e.g. 7395856611)"
                className={errors.phone ? 'has-error' : ''}
              />
              {errors.phone && <span className="field-err">{errors.phone}</span>}
            </div>

            {/* Alternate Mobile Number */}
            <div className="address-form__group">
              <label htmlFor="addr-altPhone">Alternate Mobile (Optional)</label>
              <input
                id="addr-altPhone"
                name="altPhone"
                type="tel"
                maxLength={10}
                value={formData.altPhone}
                onChange={handleChange}
                placeholder="Optional backup contact number"
                className={errors.altPhone ? 'has-error' : ''}
              />
              {errors.altPhone && <span className="field-err">{errors.altPhone}</span>}
            </div>

            {/* House / Flat / Door No. */}
            <div className="address-form__group">
              <label htmlFor="addr-houseNo">
                Flat / Door / House No. <span className="req">*</span>
              </label>
              <input
                id="addr-houseNo"
                name="houseNo"
                type="text"
                value={formData.houseNo}
                onChange={handleChange}
                placeholder="e.g. 123 / Plot 4B"
                className={errors.houseNo ? 'has-error' : ''}
              />
              {errors.houseNo && <span className="field-err">{errors.houseNo}</span>}
            </div>

            {/* Street / Road */}
            <div className="address-form__group full-width">
              <label htmlFor="addr-street">
                Street / Road Name <span className="req">*</span>
              </label>
              <input
                id="addr-street"
                name="street"
                type="text"
                value={formData.street}
                onChange={handleChange}
                placeholder="e.g. Karthikeyan Road"
                className={errors.street ? 'has-error' : ''}
              />
              {errors.street && <span className="field-err">{errors.street}</span>}
            </div>

            {/* Area / Locality */}
            <div className="address-form__group">
              <label htmlFor="addr-area">
                Area / Locality <span className="req">*</span>
              </label>
              <input
                id="addr-area"
                name="area"
                type="text"
                value={formData.area}
                onChange={handleChange}
                placeholder="e.g. Gandhi Nagar"
                className={errors.area ? 'has-error' : ''}
              />
              {errors.area && <span className="field-err">{errors.area}</span>}
            </div>

            {/* Landmark */}
            <div className="address-form__group">
              <label htmlFor="addr-landmark">Landmark (Optional)</label>
              <input
                id="addr-landmark"
                name="landmark"
                type="text"
                value={formData.landmark}
                onChange={handleChange}
                placeholder="e.g. Near Old Bus Stand"
                className={errors.landmark ? 'has-error' : ''}
              />
              {errors.landmark && <span className="field-err">{errors.landmark}</span>}
            </div>

            {/* City / Town */}
            <div className="address-form__group">
              <label htmlFor="addr-city">
                City / Town <span className="req">*</span>
              </label>
              <input
                id="addr-city"
                name="city"
                type="text"
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g. Arni"
                className={errors.city ? 'has-error' : ''}
              />
              {errors.city && <span className="field-err">{errors.city}</span>}
            </div>

            {/* District */}
            <div className="address-form__group">
              <label htmlFor="addr-district">
                District <span className="req">*</span>
              </label>
              <input
                id="addr-district"
                name="district"
                type="text"
                value={formData.district}
                onChange={handleChange}
                placeholder="e.g. T.V. Malai District"
                className={errors.district ? 'has-error' : ''}
              />
              {errors.district && <span className="field-err">{errors.district}</span>}
            </div>

            {/* State */}
            <div className="address-form__group">
              <label htmlFor="addr-state">
                State <span className="req">*</span>
              </label>
              <select
                id="addr-state"
                name="state"
                value={formData.state}
                onChange={handleChange}
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              {errors.state && <span className="field-err">{errors.state}</span>}
            </div>

            {/* PIN Code */}
            <div className="address-form__group">
              <label htmlFor="addr-pinCode">
                PIN Code <span className="req">*</span>
              </label>
              <input
                id="addr-pinCode"
                name="pinCode"
                type="text"
                maxLength={6}
                value={formData.pinCode}
                onChange={handleChange}
                placeholder="6-digit PIN (e.g. 632301)"
                className={errors.pinCode ? 'has-error' : ''}
              />
              {errors.pinCode && <span className="field-err">{errors.pinCode}</span>}
            </div>

            {/* Address Type Label */}
            <div className="address-form__group">
              <label>Address Type</label>
              <div className="address-form__radios">
                {['Home', 'Work', 'Other'].map((lbl) => (
                  <label key={lbl} className="address-form__radio-chip">
                    <input
                      type="radio"
                      name="label"
                      value={lbl}
                      checked={formData.label === lbl}
                      onChange={handleChange}
                    />
                    <span>{lbl}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Default Checkbox */}
            <div className="address-form__group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={formData.isDefault}
                  onChange={handleChange}
                />
                <span>Set as default delivery address</span>
              </label>
            </div>

            {/* Delivery Instructions */}
            <div className="address-form__group full-width">
              <label htmlFor="addr-instructions">Delivery Instructions (Optional)</label>
              <textarea
                id="addr-instructions"
                name="instructions"
                rows={2}
                value={formData.instructions}
                onChange={handleChange}
                placeholder="e.g. Please call upon arrival. Ring bell on first floor."
                maxLength={250}
              />
              {errors.instructions && <span className="field-err">{errors.instructions}</span>}
            </div>
          </div>

          <div className="address-form__actions">
            <button
              type="button"
              className="address-form__btn-cancel"
              onClick={handleCancel}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="address-form__btn-save"
              disabled={submitting}
            >
              {submitting ? 'Saving Address...' : editingId ? 'Update Address' : 'Save Delivery Address'}
            </button>
          </div>
        </form>
      )}

      {/* Address Cards List */}
      <div className="address-list">
        {addresses.length === 0 && !isEditing ? (
          <div className="address-list__empty">
            <MapPin size={32} className="address-list__empty-icon" />
            <p className="address-list__empty-title">No Delivery Addresses Saved Yet</p>
            <p className="address-list__empty-desc">
              Add your home or work address for faster checkout and accurate delivery quotes from BIKER CAFE Arni.
            </p>
            <button
              type="button"
              className="address-manager__add-btn"
              onClick={openAddForm}
            >
              <Plus size={16} />
              <span>Add Your First Address</span>
            </button>
          </div>
        ) : (
          addresses.map((addr) => {
            const isSelected = isSelectable && selectedId === addr.id;
            return (
              <div
                key={addr.id}
                className={`address-card ${addr.isDefault ? 'is-default' : ''} ${
                  isSelected ? 'is-selected' : ''
                } ${isSelectable ? 'is-clickable' : ''}`}
                onClick={isSelectable && onSelect ? () => onSelect(addr.id) : undefined}
                role={isSelectable ? 'button' : undefined}
                tabIndex={isSelectable ? 0 : undefined}
              >
                <div className="address-card__top">
                  <div className="address-card__tag-row">
                    <span className="address-card__badge-label">
                      {getLabelIcon(addr.label)}
                      {addr.label || 'Home'}
                    </span>
                    {addr.isDefault && (
                      <span className="address-card__badge-default">Default</span>
                    )}
                  </div>

                  <div className="address-card__actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="address-card__action-btn"
                      onClick={() => openEditForm(addr)}
                      title="Edit address"
                      aria-label="Edit address"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      type="button"
                      className="address-card__action-btn delete"
                      onClick={(e) => handleDelete(addr.id, e)}
                      title="Delete address"
                      aria-label="Delete address"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="address-card__body">
                  <h4 className="address-card__name">{addr.fullName}</h4>
                  <p className="address-card__line">
                    {addr.houseNo}, {addr.street}, {addr.area}
                  </p>
                  {addr.landmark && (
                    <p className="address-card__line landmark">
                      <span>Landmark:</span> Near {addr.landmark}
                    </p>
                  )}
                  <p className="address-card__line">
                    {addr.city}, {addr.district}, {addr.state} -{' '}
                    <strong className="pincode">{addr.pinCode}</strong>
                  </p>
                  <p className="address-card__contact">
                    <span>Phone:</span> +91 {addr.phone}
                    {addr.altPhone && ` · Alt: +91 ${addr.altPhone}`}
                  </p>
                  {addr.instructions && (
                    <p className="address-card__instructions">
                      <span>Note:</span> {addr.instructions}
                    </p>
                  )}
                </div>

                <div className="address-card__footer" onClick={(e) => e.stopPropagation()}>
                  {!addr.isDefault && (
                    <button
                      type="button"
                      className="address-card__set-default"
                      onClick={(e) => handleSetDefault(addr.id, e)}
                    >
                      Set as Default
                    </button>
                  )}
                  {isSelectable && (
                    <span className="address-card__select-indicator">
                      {isSelected ? '✓ Selected for Delivery' : 'Click to Select'}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
