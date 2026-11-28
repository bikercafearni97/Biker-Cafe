import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  ChevronDown,
  Filter,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import './ShowroomFilters.css';

/**
 * Parses numeric price from labels like "₹5,498" or "5498"
 */
export function parsePrice(priceLabel) {
  if (!priceLabel) return 0;
  const digits = String(priceLabel).replace(/[^\d]/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

export const SORT_OPTIONS = [
  { id: 'featured', label: 'Featured / Curated' },
  { id: 'price-asc', label: 'Price: Low to High' },
  { id: 'price-desc', label: 'Price: High to Low' },
  { id: 'newest', label: 'Newest Arrivals' },
];

/**
 * Filter Content subcomponent shared between Desktop Sidebar and Mobile Drawer
 */
export function FilterContent({
  filters,
  onFilterChange,
  onResetFilters,
  availableBrands,
  availableCategories,
  availableSizes,
  priceBounds,
  isMobile = false,
  onCloseMobile = null,
  activeFilterCount = 0,
}) {
  const [collapsed, setCollapsed] = useState({
    categories: false,
    price: false,
    sizes: false,
    stock: false,
    brands: false,
  });

  const toggleSection = (section) => {
    setCollapsed((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCategoryToggle = (category) => {
    const current = filters.categories || [];
    const next = current.includes(category)
      ? current.filter((c) => c !== category)
      : [...current, category];
    onFilterChange('categories', next);
  };

  const handleSizeToggle = (size) => {
    const current = filters.sizes || [];
    const next = current.includes(size)
      ? current.filter((s) => s !== size)
      : [...current, size];
    onFilterChange('sizes', next);
  };

  const handleBrandToggle = (brand) => {
    const current = filters.brands || [];
    const next = current.includes(brand)
      ? current.filter((b) => b !== brand)
      : [...current, brand];
    onFilterChange('brands', next);
  };

  return (
    <div className={`filter-content ${isMobile ? 'filter-content--mobile' : ''}`}>
      {/* Header with active count & Reset */}
      <div className="filter-content__head">
        <div className="filter-content__title-group">
          <SlidersHorizontal size={16} className="filter-content__icon" />
          <span className="filter-content__title">Filters</span>
          {activeFilterCount > 0 && (
            <span className="filter-content__badge">{activeFilterCount} active</span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            type="button"
            className="filter-content__reset-btn"
            onClick={onResetFilters}
            title="Reset all filters"
          >
            <RotateCcw size={13} />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {/* Categories Filter */}
      {availableCategories.length > 0 && (
        <div className="filter-group">
          <button
            type="button"
            className="filter-group__header"
            onClick={() => toggleSection('categories')}
            aria-expanded={!collapsed.categories}
          >
            <span>Category / Series</span>
            <ChevronDown
              size={15}
              className={`filter-group__chevron ${collapsed.categories ? 'is-collapsed' : ''}`}
            />
          </button>
          {!collapsed.categories && (
            <div className="filter-group__options">
              {availableCategories.map((cat) => {
                const isSelected = (filters.categories || []).includes(cat);
                return (
                  <label key={cat} className="filter-checkbox">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleCategoryToggle(cat)}
                      className="sr-only"
                    />
                    <span className={`filter-checkbox__box ${isSelected ? 'is-checked' : ''}`}>
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </span>
                    <span className="filter-checkbox__label">{cat}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Price Range Filter */}
      {priceBounds.max > 0 && (
        <div className="filter-group">
          <button
            type="button"
            className="filter-group__header"
            onClick={() => toggleSection('price')}
            aria-expanded={!collapsed.price}
          >
            <span>Price Range</span>
            <ChevronDown
              size={15}
              className={`filter-group__chevron ${collapsed.price ? 'is-collapsed' : ''}`}
            />
          </button>
          {!collapsed.price && (
            <div className="filter-group__options filter-group__price">
              <div className="filter-price-slider">
                <input
                  type="range"
                  min={priceBounds.min}
                  max={priceBounds.max}
                  step={200}
                  value={filters.maxPrice ?? priceBounds.max}
                  onChange={(e) => onFilterChange('maxPrice', Number(e.target.value))}
                  className="filter-range"
                />
              </div>
              <div className="filter-price-labels">
                <span>₹{priceBounds.min.toLocaleString('en-IN')}</span>
                <span className="filter-price-labels__active">
                  Up to ₹{(filters.maxPrice ?? priceBounds.max).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Helmet Sizes Filter */}
      {availableSizes.length > 0 && (
        <div className="filter-group">
          <button
            type="button"
            className="filter-group__header"
            onClick={() => toggleSection('sizes')}
            aria-expanded={!collapsed.sizes}
          >
            <span>Helmet Size</span>
            <ChevronDown
              size={15}
              className={`filter-group__chevron ${collapsed.sizes ? 'is-collapsed' : ''}`}
            />
          </button>
          {!collapsed.sizes && (
            <div className="filter-size-grid">
              {availableSizes.map((size) => {
                const isSelected = (filters.sizes || []).includes(size);
                return (
                  <button
                    key={size}
                    type="button"
                    className={`filter-size-btn ${isSelected ? 'is-active' : ''}`}
                    onClick={() => handleSizeToggle(size)}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Stock Availability Filter */}
      <div className="filter-group">
        <button
          type="button"
          className="filter-group__header"
          onClick={() => toggleSection('stock')}
          aria-expanded={!collapsed.stock}
        >
          <span>Availability</span>
          <ChevronDown
            size={15}
            className={`filter-group__chevron ${collapsed.stock ? 'is-collapsed' : ''}`}
          />
        </button>
        {!collapsed.stock && (
          <div className="filter-group__options">
            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={Boolean(filters.inStockOnly)}
                onChange={(e) => onFilterChange('inStockOnly', e.target.checked)}
                className="sr-only"
              />
              <span
                className={`filter-checkbox__box ${filters.inStockOnly ? 'is-checked' : ''}`}
              >
                {filters.inStockOnly && <Check size={12} strokeWidth={3} />}
              </span>
              <span className="filter-checkbox__label">Show In-Stock Only</span>
            </label>
          </div>
        )}
      </div>

      {/* Brand Filter */}
      {availableBrands.length > 1 && (
        <div className="filter-group">
          <button
            type="button"
            className="filter-group__header"
            onClick={() => toggleSection('brands')}
            aria-expanded={!collapsed.brands}
          >
            <span>Brand</span>
            <ChevronDown
              size={15}
              className={`filter-group__chevron ${collapsed.brands ? 'is-collapsed' : ''}`}
            />
          </button>
          {!collapsed.brands && (
            <div className="filter-group__options">
              {availableBrands.map((brand) => {
                const isSelected = (filters.brands || []).includes(brand);
                return (
                  <label key={brand} className="filter-checkbox">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleBrandToggle(brand)}
                      className="sr-only"
                    />
                    <span
                      className={`filter-checkbox__box ${isSelected ? 'is-checked' : ''}`}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </span>
                    <span className="filter-checkbox__label">{brand}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Mobile Drawer Done Button */}
      {isMobile && (
        <div className="filter-content__mobile-footer">
          <button
            type="button"
            className="filter-content__apply-btn"
            onClick={onCloseMobile}
          >
            Apply Filters
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Desktop Sidebar Container
 */
export function ShowroomFiltersSidebar(props) {
  return (
    <aside className="showroom-filters-sidebar" aria-label="Product filters">
      <FilterContent {...props} />
    </aside>
  );
}

/**
 * Mobile Drawer Modal
 */
export function ShowroomFilterDrawer({ isOpen, onClose, ...filterProps }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="filter-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            className="filter-drawer-panel"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            role="dialog"
            aria-modal="true"
            aria-label="Filter products"
          >
            <div className="filter-drawer-header">
              <span className="filter-drawer-header__title">Filters</span>
              <button
                type="button"
                className="filter-drawer-close"
                onClick={onClose}
                aria-label="Close filters"
              >
                <X size={20} />
              </button>
            </div>
            <div className="filter-drawer-body">
              <FilterContent
                {...filterProps}
                isMobile
                onCloseMobile={onClose}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Search & Sorting Control Bar (Top of Product Grid)
 */
export function ShowroomControlsBar({
  searchQuery,
  onSearchChange,
  sortOption,
  onSortChange,
  onOpenMobileFilters,
  activeFilterCount,
}) {
  return (
    <div className="showroom-controls-bar">
      {/* Mobile Trigger Button */}
      <button
        type="button"
        className="showroom-controls-bar__mobile-trigger"
        onClick={onOpenMobileFilters}
        aria-label="Open filter options"
      >
        <Filter size={16} />
        <span>Filters</span>
        {activeFilterCount > 0 && (
          <span className="showroom-controls-bar__mobile-badge">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Search Input */}
      <div className="showroom-search-box">
        <Search size={16} className="showroom-search-box__icon" />
        <input
          type="text"
          placeholder="Search by model, series, or feature..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="showroom-search-box__input"
        />
        {searchQuery && (
          <button
            type="button"
            className="showroom-search-box__clear"
            onClick={() => onSearchChange('')}
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Sorting Dropdown */}
      <div className="showroom-sort-wrap">
        <label htmlFor="showroom-sort-select" className="showroom-sort-label">
          Sort by:
        </label>
        <div className="showroom-sort-select-wrapper">
          <select
            id="showroom-sort-select"
            value={sortOption}
            onChange={(e) => onSortChange(e.target.value)}
            className="showroom-sort-select"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="showroom-sort-select-chevron" />
        </div>
      </div>
    </div>
  );
}
