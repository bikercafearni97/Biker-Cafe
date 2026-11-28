import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Compass, Layers, Loader2, RotateCcw, ShieldAlert, Sparkles, X } from 'lucide-react';
import {
  PRICE_DISCLAIMER,
  REFERENCE_MRP_LABEL,
  SHOWROOM_CATEGORIES,
  SHOWROOM_FINISHES,
} from '../data/showroomPlaceholders';
import { useShowroomProducts } from '../hooks/useShowroomProducts';
import ProductCard from '../components/showroom/ProductCard';
import PlaceholderBadge from '../components/ui/PlaceholderBadge';
import ClosingShowcase from '../components/showroom/ClosingShowcase';
import PageSeo from '../components/seo/PageSeo';
import {
  ShowroomFiltersSidebar,
  ShowroomFilterDrawer,
  ShowroomControlsBar,
  parsePrice,
} from '../components/showroom/ShowroomFilters';
import { computeStockStatus, STOCK_STATUS } from '../services/inventoryService';
import './ShowroomPage.css';

const DEFAULT_FILTERS = {
  categories: [],
  brands: [],
  sizes: [],
  maxPrice: null,
  inStockOnly: false,
};

export default function ShowroomPage() {
  const { products, loading } = useShowroomProducts();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('featured');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Derive dynamic filter bounds from real products data
  const { availableBrands, availableCategories, availableSizes, priceBounds } = useMemo(() => {
    const brandsSet = new Set();
    const categoriesSet = new Set();
    const sizesSet = new Set();
    let minP = Infinity;
    let maxP = 0;

    products.forEach((p) => {
      if (p.brand) brandsSet.add(p.brand);
      if (p.category) categoriesSet.add(p.category);

      // Sizes from inventory variants or default standards
      if (p.inventory?.variants && Array.isArray(p.inventory.variants)) {
        p.inventory.variants.forEach((v) => {
          if (v.size) sizesSet.add(v.size);
        });
      }

      const val = parsePrice(p.priceLabel);
      if (val > 0) {
        if (val < minP) minP = val;
        if (val > maxP) maxP = val;
      }
    });

    // Default sizes fallback if inventory not configured yet
    if (sizesSet.size === 0) {
      ['XS', 'S', 'M', 'L', 'XL', 'XXL'].forEach((s) => sizesSet.add(s));
    }

    return {
      availableBrands: Array.from(brandsSet),
      availableCategories: categoriesSet.size > 0 ? Array.from(categoriesSet) : SHOWROOM_CATEGORIES.filter((c) => c !== 'All'),
      availableSizes: Array.from(sizesSet),
      priceBounds: {
        min: minP === Infinity ? 0 : minP,
        max: maxP === 0 ? 10000 : maxP,
      },
    };
  }, [products]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchQuery('');
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.categories?.length > 0) count += filters.categories.length;
    if (filters.brands?.length > 0) count += filters.brands.length;
    if (filters.sizes?.length > 0) count += filters.sizes.length;
    if (filters.maxPrice !== null && filters.maxPrice < priceBounds.max) count += 1;
    if (filters.inStockOnly) count += 1;
    if (searchQuery.trim()) count += 1;
    return count;
  }, [filters, searchQuery, priceBounds.max]);

  // Combined Multi-Criteria Filtering and Sorting Pipeline
  const filteredSlots = useMemo(() => {
    let result = [...products];

    // 1. Search filter (title, subtitle, summary, slotCode)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.subtitle?.toLowerCase().includes(q) ||
          p.summary?.toLowerCase().includes(q) ||
          p.slotCode?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q)
      );
    }

    // 2. Category filter
    if (filters.categories && filters.categories.length > 0) {
      result = result.filter((p) => filters.categories.includes(p.category));
    }

    // 3. Brand filter
    if (filters.brands && filters.brands.length > 0) {
      result = result.filter((p) => filters.brands.includes(p.brand));
    }

    // 4. Price range filter
    if (filters.maxPrice !== null) {
      result = result.filter((p) => {
        const val = parsePrice(p.priceLabel);
        return val === 0 || val <= filters.maxPrice;
      });
    }

    // 5. Size variant filter
    if (filters.sizes && filters.sizes.length > 0) {
      result = result.filter((p) => {
        // If product has inventory variants, match size
        if (p.inventory?.variants && p.inventory.variants.length > 0) {
          return p.inventory.variants.some(
            (v) => filters.sizes.includes(v.size) && (Number(v.quantity) > 0 || !filters.inStockOnly)
          );
        }
        // If product doesn't specify variant breakdown, default to match
        return true;
      });
    }

    // 6. Stock availability filter
    if (filters.inStockOnly) {
      result = result.filter((p) => {
        const status = computeStockStatus(p.inventory);
        return status === STOCK_STATUS.IN_STOCK || status === STOCK_STATUS.LOW_STOCK || status === STOCK_STATUS.UNKNOWN;
      });
    }

    // 7. Sorting
    switch (sortOption) {
      case 'price-asc':
        result.sort((a, b) => parsePrice(a.priceLabel) - parsePrice(b.priceLabel));
        break;
      case 'price-desc':
        result.sort((a, b) => parsePrice(b.priceLabel) - parsePrice(a.priceLabel));
        break;
      case 'newest':
        result.sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });
        break;
      case 'featured':
      default:
        // Preserves original catalogue ordering
        break;
    }

    return result;
  }, [products, searchQuery, filters, sortOption]);

  const removeActiveFilter = (type, value = null) => {
    if (type === 'search') setSearchQuery('');
    else if (type === 'maxPrice') handleFilterChange('maxPrice', null);
    else if (type === 'inStockOnly') handleFilterChange('inStockOnly', false);
    else if (type === 'category') {
      handleFilterChange(
        'categories',
        (filters.categories || []).filter((c) => c !== value)
      );
    } else if (type === 'size') {
      handleFilterChange(
        'sizes',
        (filters.sizes || []).filter((s) => s !== value)
      );
    } else if (type === 'brand') {
      handleFilterChange(
        'brands',
        (filters.brands || []).filter((b) => b !== value)
      );
    }
  };

  return (
    <div className="showroom-page">
      <PageSeo
        title="AXOR Helmet Showroom | BIKER CAFE — ARNI"
        description="Browse six ECE, DOT, and ISI certified AXOR helmet models at BIKER CAFE Arni, including Apex Hunter, Apex Venomous, Apex Ascetic, Agera, Retro Jet, and Brutale Airwaves."
        robots="index, follow"
      />

      {/* Showroom Banner */}
      <section className="showroom-hero">
        <div className="container showroom-hero__grid">
          <motion.div
            className="showroom-hero__inner"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="showroom-hero__top">
              <span className="eyebrow">Biker Cafe // Curated Helmet Showroom</span>
              <PlaceholderBadge>{REFERENCE_MRP_LABEL}</PlaceholderBadge>
            </div>

            <h1 className="showroom-hero__title">
              AXOR <span className="metallic-text">HELMET SHOWROOM</span>
            </h1>

            <p className="showroom-hero__copy">
              Explore curated AXOR full-face sport-touring, performance aero, and classic open-face
              models. Select any helmet to inspect its official reference details and interactive 3D
              finish preview.
            </p>

            <div className="showroom-notice" role="note">
              <ShieldAlert size={16} aria-hidden="true" />
              <span>{PRICE_DISCLAIMER}</span>
            </div>
          </motion.div>

          <motion.aside
            className="showroom-telemetry carbon-grid-bg"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            aria-label="Showroom overview metrics"
          >
            <div className="showroom-telemetry__head">
              <Layers size={15} aria-hidden="true" />
              <span>SHOWROOM OVERVIEW</span>
            </div>
            <dl className="showroom-telemetry__stats">
              <div>
                <dt>AXOR Models</dt>
                <dd>{String(products.length).padStart(2, '0')}</dd>
              </div>
              <div>
                <dt>Series</dt>
                <dd>{String(SHOWROOM_CATEGORIES.length - 1).padStart(2, '0')}</dd>
              </div>
              <div>
                <dt>3D Finishes</dt>
                <dd>{String(SHOWROOM_FINISHES.length).padStart(2, '0')}</dd>
              </div>
            </dl>
            <p className="showroom-telemetry__note">
              All prices displayed are reference MRPs. Contact BIKER CAFE Arni via WhatsApp or
              phone to confirm in-store pricing and availability.
            </p>
          </motion.aside>
        </div>
      </section>

      {/* Featured Brand Banner & Smart Finder Trigger */}
      <section className="axor-brand-band">
        <div className="container showroom-promo-grid">
          <div className="axor-brand-card carbon-grid-bg">
            <div className="axor-brand-card__copy">
              <span className="axor-brand-card__kicker">Featured Helmet Brand</span>
              <h2 className="axor-brand-card__title">AXOR HELMETS</h2>
              <p className="axor-brand-card__text">
                Showcasing six AXOR models across the Apex sport-touring lineup, Agera and Brutale
                performance shells, and the classic Retro Jet open-face series.
              </p>
            </div>
            <div className="axor-brand-card__meta">
              <span className="axor-brand-card__chip">ECE / DOT / ISI Certified Lineup</span>
              <span className="axor-brand-card__sub">Available via BIKER CAFE Arni Enquiry</span>
            </div>
          </div>

          <div className="finder-banner-card carbon-grid-bg">
            <div className="finder-banner-card__badge">
              <Compass size={13} />
              <span>Interactive Recommendation</span>
            </div>
            <h3 className="finder-banner-card__title">Need Help Choosing?</h3>
            <p className="finder-banner-card__text">
              Try our 5-question Smart Helmet Finder to discover the exact model matching your riding
              style, budget, and certified fit.
            </p>
            <Link to="/helmet-finder" className="finder-banner-card__btn">
              <span>Launch Helmet Finder</span>
              <Sparkles size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* Main Filterable Showroom Gallery */}
      <section className="showroom-gallery section-pad">
        <div className="container showroom-layout">
          {/* Desktop Filter Sidebar */}
          <ShowroomFiltersSidebar
            filters={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            availableBrands={availableBrands}
            availableCategories={availableCategories}
            availableSizes={availableSizes}
            priceBounds={priceBounds}
            activeFilterCount={activeFilterCount}
          />

          {/* Product Gallery Main Column */}
          <main className="showroom-main">
            {/* Top Control Bar: Search + Sort + Mobile Filter Trigger */}
            <ShowroomControlsBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortOption={sortOption}
              onSortChange={setSortOption}
              totalCount={products.length}
              filteredCount={filteredSlots.length}
              onOpenMobileFilters={() => setMobileDrawerOpen(true)}
              activeFilterCount={activeFilterCount}
            />

            {/* Active Filter Pills Bar */}
            {activeFilterCount > 0 && (
              <div className="showroom-active-tags" aria-label="Active filters">
                <span className="showroom-active-tags__label">Active:</span>
                {searchQuery && (
                  <span className="filter-pill">
                    &ldquo;{searchQuery}&rdquo;
                    <button
                      type="button"
                      onClick={() => removeActiveFilter('search')}
                      aria-label="Remove search filter"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
                {filters.categories?.map((cat) => (
                  <span key={cat} className="filter-pill">
                    {cat}
                    <button
                      type="button"
                      onClick={() => removeActiveFilter('category', cat)}
                      aria-label={`Remove ${cat} category filter`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                {filters.sizes?.map((sz) => (
                  <span key={sz} className="filter-pill">
                    Size: {sz}
                    <button
                      type="button"
                      onClick={() => removeActiveFilter('size', sz)}
                      aria-label={`Remove size ${sz} filter`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                {filters.maxPrice !== null && filters.maxPrice < priceBounds.max && (
                  <span className="filter-pill">
                    ≤ ₹{filters.maxPrice.toLocaleString('en-IN')}
                    <button
                      type="button"
                      onClick={() => removeActiveFilter('maxPrice')}
                      aria-label="Remove price filter"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
                {filters.inStockOnly && (
                  <span className="filter-pill">
                    In Stock
                    <button
                      type="button"
                      onClick={() => removeActiveFilter('inStockOnly')}
                      aria-label="Remove in-stock filter"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  className="filter-pill-clear"
                  onClick={handleResetFilters}
                >
                  <RotateCcw size={11} /> Clear All
                </button>
              </div>
            )}

            {/* Loading Indicator */}
            {loading ? (
              <div className="showroom-loading" aria-label="Loading products">
                <Loader2 size={24} className="showroom-loading__spin" aria-hidden="true" />
                <span>Loading helmet catalogue...</span>
              </div>
            ) : (
              /* Product Card Grid */
              <motion.div className="showroom-grid" layout>
                <AnimatePresence mode="popLayout">
                  {filteredSlots.map((slot, index) => (
                    <ProductCard key={slot.id} item={slot} index={index} />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Helpful No-Results State */}
            {!loading && filteredSlots.length === 0 && (
              <div className="showroom-empty">
                <Sparkles size={28} className="showroom-empty__icon" aria-hidden="true" />
                <h3 className="showroom-empty__title">No helmets found</h3>
                <p className="showroom-empty__desc">
                  No AXOR models matched your current search and filter combination. Try clearing
                  some filters or searching with a different term.
                </p>
                <button
                  type="button"
                  className="showroom-empty__reset-btn"
                  onClick={handleResetFilters}
                >
                  <RotateCcw size={14} />
                  <span>Reset All Filters</span>
                </button>
              </div>
            )}
          </main>
        </div>
      </section>

      {/* Mobile Filter Drawer */}
      <ShowroomFilterDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        availableBrands={availableBrands}
        availableCategories={availableCategories}
        availableSizes={availableSizes}
        priceBounds={priceBounds}
        activeFilterCount={activeFilterCount}
      />

      <ClosingShowcase />
    </div>
  );
}
