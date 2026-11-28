import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  Heart,
  MessageSquare,
  RotateCcw,
  Scale,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useShowroomProducts } from '../hooks/useShowroomProducts';
import { useCustomerData } from '../context/CustomerDataContext';
import { useSmartEnquiry } from '../context/SmartEnquiryContext';
import { buildWhatsAppUrl } from '../data/showroomPlaceholders';
import { getCustomerStockBadge } from '../services/inventoryService';
import { parsePrice } from './showroom/ShowroomFilters';
import PageSeo from './seo/PageSeo';
import WhatsAppIcon from './ui/WhatsAppIcon';
import './HelmetFinder.css';

// 5 Step Questionnaire strictly aligned with real catalogue attributes
export const FINDER_QUESTIONS = [
  {
    id: 'ridingStyle',
    step: 1,
    title: 'What type of riding do you primarily do?',
    subtitle: 'Helps us match aerodynamics, ventilation, and shell characteristics.',
    options: [
      {
        id: 'sport-touring',
        label: 'Sport Touring & Highway Cruising',
        desc: 'Long distances, high stability, drop-down sun visor for varying sunlight.',
        categoryMatch: ['Apex Series'],
        tag: 'High Speed Stability',
      },
      {
        id: 'track-aero',
        label: 'Performance & Track Aerodynamics',
        desc: 'Aggressive chin vents, dual rear spoilers, extreme aerodynamic posture.',
        categoryMatch: ['Performance Full-Face'],
        tag: 'Aero Dual Spoilers',
      },
      {
        id: 'city-cruiser',
        label: 'City Commute & Cafe Cruiser',
        desc: 'Open-face visibility, lightweight shell, vintage cafe racer styling.',
        categoryMatch: ['Open-Face Retro'],
        tag: 'Wide View & Retro Look',
      },
      {
        id: 'all-round',
        label: 'All-Rounder / Everyday Ride',
        desc: 'Daily city + weekend highway versatility.',
        categoryMatch: ['Apex Series', 'Performance Full-Face'],
        tag: 'Versatile Dual Purpose',
      },
    ],
  },
  {
    id: 'budget',
    step: 2,
    title: 'What is your intended reference budget?',
    subtitle: 'Reference MRP range at BIKER CAFE Arni.',
    options: [
      {
        id: 'budget-entry',
        label: 'Under ₹4,000',
        desc: 'Entry-level certified open-face and classic models.',
        maxPrice: 4000,
        tag: 'Accessible Value',
      },
      {
        id: 'budget-mid',
        label: '₹4,000 – ₹7,000',
        desc: 'Apex Series full-face sport-touring with Pinlock-ready optics.',
        minPrice: 4000,
        maxPrice: 7000,
        tag: 'Apex Sweet Spot',
      },
      {
        id: 'budget-premium',
        label: 'Above ₹7,000',
        desc: 'Flagship performance shells, dual spoilers, and carbon-finish series.',
        minPrice: 7000,
        tag: 'Flagship Performance',
      },
      {
        id: 'budget-any',
        label: 'Any Budget (Show Best Fit)',
        desc: 'Focus on safety certifications and fitment first.',
        tag: 'No Budget Limit',
      },
    ],
  },
  {
    id: 'helmetSize',
    step: 3,
    title: 'What helmet size do you wear?',
    subtitle: 'Head circumference fitment (Can confirm at showroom with our size guide).',
    options: [
      { id: 'S', label: 'Small (55 – 56 cm)', size: 'S' },
      { id: 'M', label: 'Medium (57 – 58 cm)', size: 'M' },
      { id: 'L', label: 'Large (59 – 60 cm)', size: 'L' },
      { id: 'XL', label: 'Extra Large (61 – 62 cm)', size: 'XL' },
      { id: 'ANY', label: 'Not sure / Confirm at Showroom', size: null },
    ],
  },
  {
    id: 'finishColor',
    step: 4,
    title: 'Which graphic or finish style speaks to you?',
    subtitle: 'Visual aesthetic to match your motorcycle and gear.',
    options: [
      {
        id: 'dark-carbon',
        label: 'Obsidian Carbon & Stealth Black',
        desc: 'Understated matte or gloss dark aesthetics.',
        accentMatch: ['#e11d2a', '#12141a', '#cfd5df'],
        finishMatch: ['obsidian-carbon'],
      },
      {
        id: 'racing-red',
        label: 'Apex Red & Track Graphics',
        desc: 'High-contrast energetic race livery for maximum visibility.',
        accentMatch: ['#ff2e3b', '#e11d2a'],
        finishMatch: ['crimson-apex'],
      },
      {
        id: 'liquid-silver',
        label: 'Liquid Silver & Metallic Sheen',
        desc: 'Reflective metallic contours with aggressive accents.',
        accentMatch: ['#9aa2b0', '#cfd5df'],
        finishMatch: ['liquid-silver'],
      },
      {
        id: 'any-color',
        label: 'Any Finish / Open to All',
        desc: 'Prioritize protection and fitment over graphic colors.',
      },
    ],
  },
  {
    id: 'categoryType',
    step: 5,
    title: 'Which shell coverage do you prefer?',
    subtitle: 'Safety certifications & visor configuration.',
    options: [
      {
        id: 'full-face',
        label: 'Full-Face Maximum Protection',
        desc: 'Full chin bar coverage, ECE / DOT / ISI safety standard.',
        categories: ['Apex Series', 'Performance Full-Face'],
      },
      {
        id: 'open-face',
        label: 'Open-Face Cafe Retro',
        desc: 'Classic 3/4 shell with drop-down visor and retro silhouette.',
        categories: ['Open-Face Retro'],
      },
      {
        id: 'any-shell',
        label: 'Recommend Based on My Answers',
        desc: 'Let the finder choose the optimal shell for my riding.',
      },
    ],
  },
];

export default function HelmetFinder({ isEmbedded = false }) {
  const { products } = useShowroomProducts();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({
    ridingStyle: null,
    budget: null,
    helmetSize: null,
    finishColor: null,
    categoryType: null,
  });

  const { isWishlisted, toggleWishlist, isInCompare, addToCompare, removeFromCompare } =
    useCustomerData();
  const { addHelmetToEnquiry, isHelmetInEnquiry } = useSmartEnquiry();

  const totalSteps = FINDER_QUESTIONS.length;
  const currentQ = FINDER_QUESTIONS[currentStep];

  const handleSelectOption = (option) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: option,
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleRestart = () => {
    setAnswers({
      ridingStyle: null,
      budget: null,
      helmetSize: null,
      finishColor: null,
      categoryType: null,
    });
    setCurrentStep(0);
  };

  // Compute matched products with score & transparent rationale
  const matchingResults = useMemo(() => {
    if (currentStep < totalSteps) return [];

    return products
      .map((product) => {
        let score = 0;
        const reasons = [];

        // 1. Riding style match
        if (answers.ridingStyle?.categoryMatch?.includes(product.category)) {
          score += 35;
          reasons.push(`Matches your ${answers.ridingStyle.label.toLowerCase()} riding style.`);
        }

        // 2. Budget match
        const price = parsePrice(product.priceLabel);
        if (answers.budget?.maxPrice && price <= answers.budget.maxPrice) {
          score += 25;
          reasons.push(`Fits your target budget under ₹${answers.budget.maxPrice.toLocaleString('en-IN')}.`);
        } else if (answers.budget?.minPrice && price >= answers.budget.minPrice) {
          score += 25;
          reasons.push(`Meets high-spec performance tier (₹${price.toLocaleString('en-IN')}).`);
        } else if (answers.budget?.id === 'budget-any') {
          score += 15;
        }

        // 3. Category match
        if (answers.categoryType?.categories?.includes(product.category)) {
          score += 20;
          reasons.push(`Delivers requested ${answers.categoryType.label.toLowerCase()} shell architecture.`);
        }

        // 4. Color / Finish match
        if (answers.finishColor?.finishMatch?.includes(product.previewFinish)) {
          score += 15;
          reasons.push(`Available in your selected ${answers.finishColor.label} aesthetic.`);
        }

        // 5. Size variant stock check
        if (answers.helmetSize?.size && product.inventory?.variants) {
          const varMatch = product.inventory.variants.find((v) => v.size === answers.helmetSize.size);
          if (varMatch && Number(varMatch.quantity) > 0) {
            score += 15;
            reasons.push(`Physical stock verified for size ${answers.helmetSize.size}.`);
          }
        }

        return {
          product,
          score,
          matchPercentage: Math.min(Math.round((score / 95) * 100), 99),
          reasons: reasons.slice(0, 3),
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [products, answers, currentStep, totalSteps]);

  const isFinalStep = currentStep === totalSteps;

  return (
    <div className={`helmet-finder ${isEmbedded ? 'helmet-finder--embedded' : 'helmet-finder--standalone'}`}>
      {!isEmbedded && (
        <PageSeo
          title="Smart Helmet Finder | BIKER CAFE — ARNI"
          description="Find your perfect AXOR motorcycle helmet. Interactive recommendation based on riding style, budget, head size, and certified safety specifications."
          robots="index, follow"
        />
      )}

      {/* Header Banner */}
      <div className="helmet-finder__header">
        <div className="helmet-finder__badge">
          <Compass size={14} className="helmet-finder__badge-icon" />
          <span>Interactive Showroom Guide</span>
        </div>
        <h1 className="helmet-finder__title">
          SMART HELMET <span className="metallic-text">FINDER</span>
        </h1>
        <p className="helmet-finder__subtitle">
          Answer 5 quick questions to match your riding posture, budget, and sizing with verified
          AXOR models available at BIKER CAFE Arni.
        </p>

        {/* Progress Tracker */}
        {!isFinalStep && (
          <div className="helmet-finder__progress">
            <div className="helmet-finder__progress-bar">
              <motion.div
                className="helmet-finder__progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="helmet-finder__progress-text">
              <span>Step {currentStep + 1} of {totalSteps}</span>
              <span>{Math.round(((currentStep + 1) / totalSteps) * 100)}% Complete</span>
            </div>
          </div>
        )}
      </div>

      {/* Questionnaire Body */}
      {!isFinalStep ? (
        <motion.div
          key={currentQ.id}
          className="helmet-finder__card carbon-grid-bg"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.35 }}
        >
          <div className="helmet-finder__q-head">
            <span className="helmet-finder__q-step">Question 0{currentQ.step}</span>
            <h2 className="helmet-finder__q-title">{currentQ.title}</h2>
            <p className="helmet-finder__q-sub">{currentQ.subtitle}</p>
          </div>

          <div className={`helmet-finder__options ${currentQ.id === 'helmetSize' ? 'helmet-finder__options--sizes' : ''}`}>
            {currentQ.options.map((opt) => {
              const isSelected = answers[currentQ.id]?.id === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  className={`finder-option-btn ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => handleSelectOption(opt)}
                >
                  <div className="finder-option-btn__radio">
                    <span className="finder-option-btn__radio-dot" />
                  </div>
                  <div className="finder-option-btn__content">
                    <div className="finder-option-btn__label-row">
                      <span className="finder-option-btn__label">{opt.label}</span>
                      {opt.tag && <span className="finder-option-btn__tag">{opt.tag}</span>}
                    </div>
                    {opt.desc && <p className="finder-option-btn__desc">{opt.desc}</p>}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="helmet-finder__controls">
            <button
              type="button"
              className="finder-nav-btn finder-nav-btn--back"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            <button
              type="button"
              className="finder-nav-btn finder-nav-btn--next"
              onClick={handleNext}
              disabled={!answers[currentQ.id]}
            >
              <span>{currentStep === totalSteps - 1 ? 'View Recommendations' : 'Continue'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </motion.div>
      ) : (
        /* Final Results Display */
        <motion.div
          className="helmet-finder__results"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="finder-results-head">
            <div className="finder-results-head__title-group">
              <Sparkles size={20} className="finder-results-head__icon" />
              <div>
                <h2 className="finder-results-head__title">RECOMMENDED FOR YOUR RIDE</h2>
                <p className="finder-results-head__sub">
                  Based on your {answers.ridingStyle?.label || 'selected'} preferences. Ranked by
                  safety certification and feature alignment.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="finder-restart-btn"
              onClick={handleRestart}
            >
              <RotateCcw size={14} />
              <span>Restart Finder</span>
            </button>
          </div>

          {/* Top 3 Product Recommendations */}
          <div className="finder-results-grid">
            {matchingResults.slice(0, 3).map(({ product, matchPercentage, reasons }, idx) => {
              const stockBadge = getCustomerStockBadge(product);
              const wishlisted = isWishlisted(product.id);
              const compared = isInCompare(product.id);
              const inEnquiry = isHelmetInEnquiry(product.id);
              const whatsappHref = buildWhatsAppUrl(
                `Hello BIKER CAFE, the Smart Helmet Finder recommended the ${product.title} for me. Is it available at your Arni showroom?`
              );

              return (
                <div key={product.id} className="finder-result-card carbon-grid-bg">
                  {/* Match Rank & Percentage */}
                  <div className="finder-result-card__banner">
                    <span className="finder-result-card__rank">#{idx + 1} Best Match</span>
                    <span className="finder-result-card__match-pct">
                      <Zap size={12} /> {matchPercentage}% Fit
                    </span>
                  </div>

                  {/* Product Visual */}
                  <Link to={`/showroom/${product.id}`} className="finder-result-card__media">
                    <img
                      src={product.image}
                      alt={product.title}
                      loading="lazy"
                      className="finder-result-card__img"
                    />
                  </Link>

                  {/* Details */}
                  <div className="finder-result-card__body">
                    <span className="finder-result-card__brand">{product.brand}</span>
                    <h3 className="finder-result-card__title">
                      <Link to={`/showroom/${product.id}`}>{product.title}</Link>
                    </h3>
                    <p className="finder-result-card__subtitle">{product.subtitle}</p>

                    <div className="finder-result-card__meta">
                      <span className="finder-result-card__price">{product.priceLabel}</span>
                      <span className={`finder-stock-badge finder-stock-badge--${stockBadge.tone}`}>
                        {stockBadge.label}
                      </span>
                    </div>

                    {/* Why This Matches You */}
                    <div className="finder-result-card__reasons">
                      <span className="finder-result-card__reasons-label">Why It Matches:</span>
                      <ul>
                        {reasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Action Buttons */}
                    <div className="finder-result-card__actions">
                      <Link
                        to={`/showroom/${product.id}`}
                        className="finder-card-btn finder-card-btn--primary"
                      >
                        Inspect Details
                      </Link>

                      <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="finder-card-btn finder-card-btn--whatsapp"
                        title="Enquire on WhatsApp"
                      >
                        <WhatsAppIcon size={14} />
                        <span>Enquire</span>
                      </a>
                    </div>

                    {/* Tool Buttons */}
                    <div className="finder-result-card__tools">
                      <button
                        type="button"
                        className={`finder-tool-btn ${wishlisted ? 'is-active' : ''}`}
                        onClick={() => toggleWishlist(product.id)}
                        aria-label="Wishlist"
                        title="Add to Wishlist"
                      >
                        <Heart size={14} fill={wishlisted ? 'currentColor' : 'none'} />
                        <span>{wishlisted ? 'Wishlisted' : 'Wishlist'}</span>
                      </button>

                      <button
                        type="button"
                        className={`finder-tool-btn ${compared ? 'is-active' : ''}`}
                        onClick={() => (compared ? removeFromCompare(product.id) : addToCompare(product))}
                        aria-label="Compare"
                        title="Compare with other models"
                      >
                        <Scale size={14} />
                        <span>{compared ? 'In Compare' : 'Compare'}</span>
                      </button>

                      <button
                        type="button"
                        className={`finder-tool-btn ${inEnquiry ? 'is-active' : ''}`}
                        onClick={() => addHelmetToEnquiry(product)}
                        aria-label="Add to Smart Enquiry"
                        title="Add to compiled WhatsApp enquiry"
                      >
                        <MessageSquare size={14} />
                        <span>{inEnquiry ? 'In Enquiry' : '+ Enquiry'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
