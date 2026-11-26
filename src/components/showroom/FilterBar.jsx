import { motion } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';
import './FilterBar.css';

export default function FilterBar({
  categories,
  activeCategory,
  onSelectCategory,
  totalCount,
  filteredCount,
}) {
  return (
    <div className="filter-bar">
      <div className="filter-bar__tabs" role="tablist" aria-label="Filter helmet series">
        {categories.map((category) => {
          const isActive = category === activeCategory;
          return (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`filter-bar__tab ${isActive ? 'is-active' : ''}`}
              onClick={() => onSelectCategory(category)}
            >
              {isActive && (
                <motion.span
                  layoutId="showroom-filter-pill"
                  className="filter-bar__pill"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}
              <span className="filter-bar__label">{category}</span>
            </button>
          );
        })}
      </div>

      <div className="filter-bar__meta">
        <SlidersHorizontal size={14} aria-hidden="true" />
        <span>
          Showing <strong>{filteredCount}</strong> of {totalCount} AXOR Models
        </span>
      </div>
    </div>
  );
}
