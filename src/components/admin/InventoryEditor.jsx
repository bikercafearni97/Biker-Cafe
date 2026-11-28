import { useState } from 'react';
import {
  Package,
  Plus,
  Trash2,
  Info,
} from 'lucide-react';
import { SHOWROOM_SIZES } from '../../data/showroomPlaceholders';
import { computeStockStatus, STOCK_STATUS } from '../../services/inventoryService';
import './InventoryEditor.css';

/**
 * InventoryEditor component for Add/Edit Product Form.
 *
 * Supports:
 * - Tracking enabled/disabled (unknown stock vs physical tracked stock)
 * - Low-stock threshold
 * - Variant-based sizing (XS, S, M, L, XL, XXL) with independent quantities
 * - Variant-less physical quantity
 * - Real-time stock status preview
 */
export default function InventoryEditor({ inventory, onChange }) {
  const inv = inventory || {
    trackingEnabled: false,
    lowStockThreshold: 2,
    quantity: '',
    variants: [],
  };

  const hasVariants = Array.isArray(inv.variants) && inv.variants.length > 0;
  const [useVariants, setUseVariants] = useState(hasVariants);

  const setTracking = (enabled) => {
    onChange({
      ...inv,
      trackingEnabled: enabled,
      stockStatus: enabled ? computeStockStatus(inv) : STOCK_STATUS.UNKNOWN,
    });
  };

  const setThreshold = (val) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    const updated = { ...inv, lowStockThreshold: num };
    updated.stockStatus = computeStockStatus(updated);
    onChange(updated);
  };

  const setUnitQuantity = (val) => {
    const num = val === '' ? '' : Math.max(0, parseInt(val, 10) || 0);
    const updated = {
      ...inv,
      quantity: num,
      variants: [],
    };
    updated.stockStatus = computeStockStatus(updated);
    onChange(updated);
  };

  const handleToggleVariants = (enabled) => {
    setUseVariants(enabled);
    if (enabled) {
      // Initialize with standard helmet sizes with 0 initial quantity
      const initialVariants = SHOWROOM_SIZES.map((size) => ({
        size,
        colour: '',
        quantity: 0,
      }));
      const updated = {
        ...inv,
        variants: initialVariants,
        quantity: 0,
      };
      updated.stockStatus = computeStockStatus(updated);
      onChange(updated);
    } else {
      const updated = {
        ...inv,
        variants: [],
        quantity: 0,
      };
      updated.stockStatus = computeStockStatus(updated);
      onChange(updated);
    }
  };

  const updateVariantQty = (idx, qtyVal) => {
    const num = Math.max(0, parseInt(qtyVal, 10) || 0);
    const updatedVariants = [...(inv.variants || [])];
    updatedVariants[idx] = {
      ...updatedVariants[idx],
      quantity: num,
    };
    const total = updatedVariants.reduce((s, v) => s + (Number(v.quantity) || 0), 0);
    const updated = {
      ...inv,
      variants: updatedVariants,
      quantity: total,
    };
    updated.stockStatus = computeStockStatus(updated);
    onChange(updated);
  };

  const addCustomVariant = () => {
    const updatedVariants = [
      ...(inv.variants || []),
      { size: 'M', colour: '', quantity: 1 },
    ];
    const total = updatedVariants.reduce((s, v) => s + (Number(v.quantity) || 0), 0);
    const updated = {
      ...inv,
      variants: updatedVariants,
      quantity: total,
    };
    updated.stockStatus = computeStockStatus(updated);
    onChange(updated);
  };

  const removeVariant = (idx) => {
    const updatedVariants = (inv.variants || []).filter((_, i) => i !== idx);
    const total = updatedVariants.reduce((s, v) => s + (Number(v.quantity) || 0), 0);
    const updated = {
      ...inv,
      variants: updatedVariants,
      quantity: total,
    };
    updated.stockStatus = computeStockStatus(updated);
    onChange(updated);
  };

  const currentStatus = inv.trackingEnabled
    ? computeStockStatus(inv)
    : STOCK_STATUS.UNKNOWN;

  return (
    <div className="admin-inventory-editor">
      <div className="admin-inventory-editor__head">
        <div>
          <label className="admin-inventory-editor__title">
            <Package size={16} aria-hidden="true" />
            <span>Physical Stock & Inventory Configuration</span>
          </label>
          <p className="admin-inventory-editor__sub">
            Track actual showroom units. Unchecked items remain marked as &ldquo;Contact shop for availability&rdquo;.
          </p>
        </div>

        <label className="admin-inv-track-toggle">
          <input
            type="checkbox"
            checked={Boolean(inv.trackingEnabled)}
            onChange={(e) => setTracking(e.target.checked)}
          />
          <span>Enable Inventory Tracking</span>
        </label>
      </div>

      {!inv.trackingEnabled ? (
        <div className="admin-inv-notice">
          <Info size={15} />
          <span>
            Tracking is disabled. This product will display &ldquo;Stock on Request&rdquo; to customers without assuming zero stock.
          </span>
        </div>
      ) : (
        <div className="admin-inv-body">
          {/* Top Threshold & Status Banner */}
          <div className="admin-inv-controls-row">
            <div className="admin-inv-field">
              <label htmlFor="inv-threshold">Low-Stock Alert Threshold</label>
              <input
                id="inv-threshold"
                type="number"
                min="1"
                max="50"
                value={inv.lowStockThreshold ?? 2}
                onChange={(e) => setThreshold(e.target.value)}
                className="admin-inv-input"
              />
              <span className="admin-inv-field-hint">Units or below triggers warning</span>
            </div>

            <div className="admin-inv-field">
              <label>Current Status Preview</label>
              <div className={`admin-inv-status-pill admin-inv-status-pill--${currentStatus}`}>
                {currentStatus === STOCK_STATUS.IN_STOCK && 'In Stock'}
                {currentStatus === STOCK_STATUS.LOW_STOCK && 'Low Stock Warning'}
                {currentStatus === STOCK_STATUS.OUT_OF_STOCK && 'Out of Stock'}
                {currentStatus === STOCK_STATUS.UNKNOWN && 'Unknown / Unset'}
              </div>
            </div>

            <div className="admin-inv-field">
              <label className="admin-inv-variant-toggle">
                <input
                  type="checkbox"
                  checked={useVariants}
                  onChange={(e) => handleToggleVariants(e.target.checked)}
                />
                <span>Manage by Helmet Sizes (XS-XXL)</span>
              </label>
            </div>
          </div>

          {/* Sizing Matrix or Single Unit Qty */}
          {useVariants ? (
            <div className="admin-inv-matrix">
              <div className="admin-inv-matrix__head">
                <span>Size</span>
                <span>Colour (Optional)</span>
                <span>Quantity In Stock</span>
                <span>Action</span>
              </div>

              {(inv.variants || []).map((variant, idx) => (
                <div key={idx} className="admin-inv-matrix__row">
                  <input
                    type="text"
                    value={variant.size}
                    onChange={(e) => {
                      const updated = [...inv.variants];
                      updated[idx].size = e.target.value;
                      onChange({ ...inv, variants: updated });
                    }}
                    className="admin-inv-input admin-inv-input--size"
                    placeholder="Size (e.g. M)"
                  />

                  <input
                    type="text"
                    value={variant.colour || ''}
                    onChange={(e) => {
                      const updated = [...inv.variants];
                      updated[idx].colour = e.target.value;
                      onChange({ ...inv, variants: updated });
                    }}
                    className="admin-inv-input"
                    placeholder="e.g. Matte Black"
                  />

                  <input
                    type="number"
                    min="0"
                    value={variant.quantity ?? 0}
                    onChange={(e) => updateVariantQty(idx, e.target.value)}
                    className="admin-inv-input admin-inv-input--qty"
                  />

                  <button
                    type="button"
                    className="admin-inv-matrix__del"
                    onClick={() => removeVariant(idx)}
                    title="Remove variant"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="admin-inv-add-variant-btn"
                onClick={addCustomVariant}
              >
                <Plus size={13} />
                <span>Add Sizing Variant</span>
              </button>
            </div>
          ) : (
            <div className="admin-inv-single">
              <label htmlFor="inv-single-qty">Total Physical Stock Available</label>
              <input
                id="inv-single-qty"
                type="number"
                min="0"
                value={inv.quantity ?? ''}
                onChange={(e) => setUnitQuantity(e.target.value)}
                placeholder="Enter available count"
                className="admin-inv-input admin-inv-input--large"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
