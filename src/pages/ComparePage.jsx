import { Link } from 'react-router-dom';
import { ArrowRight, Check, Scale, ShieldAlert, Trash2, X } from 'lucide-react';
import { useCustomerData } from '../context/CustomerDataContext';
import { buildWhatsAppUrl, PRICE_DISCLAIMER } from '../data/showroomPlaceholders';
import WhatsAppIcon from '../components/ui/WhatsAppIcon';
import PageSeo from '../components/seo/PageSeo';
import './ComparePage.css';

export default function ComparePage() {
  const { compareList, removeFromCompare, clearCompare } = useCustomerData();

  const handleWhatsAppInquiry = (helmet) => {
    const text = `Hello BIKER CAFE, I am comparing helmets and would like information regarding the ${helmet.title}.`;
    return buildWhatsAppUrl(text);
  };

  return (
    <div className="compare-page">
      <PageSeo
        title="Compare Helmets | BIKER CAFE"
        description="Side-by-side technical comparison of AXOR helmet models at BIKER CAFE Arni."
        robots="noindex, nofollow"
      />

      <section className="compare-hero section-pad">
        <div className="container">
          <div className="compare-hero__header">
            <div>
              <span className="eyebrow">Technical Analysis // Specification Matrix</span>
              <h1 className="compare-hero__title">
                HELMET <span className="metallic-text">COMPARISON</span>
              </h1>
              <p className="compare-hero__copy">
                Side-by-side comparison of verified safety ratings, shell construction, and certified
                aerodynamic features. Select up to 3 helmets from the showroom.
              </p>
            </div>

            {compareList.length > 0 && (
              <button
                type="button"
                className="compare-clear-btn"
                onClick={clearCompare}
                title="Clear all helmets from comparison"
              >
                <Trash2 size={15} aria-hidden="true" />
                <span>Clear All ({compareList.length}/3)</span>
              </button>
            )}
          </div>

          <div className="compare-notice" role="note">
            <ShieldAlert size={16} aria-hidden="true" />
            <span>
              <strong>Price Disclaimer:</strong> {PRICE_DISCLAIMER} Specifications reflect official
              manufacturer documentation.
            </span>
          </div>

          {compareList.length === 0 ? (
            <div className="compare-empty">
              <Scale size={36} className="compare-empty__icon" aria-hidden="true" />
              <h2>No Helmets Selected for Comparison</h2>
              <p>
                Browse the showroom and click &ldquo;Compare&rdquo; on any helmet model to inspect
                its specs side-by-side with other models.
              </p>
              <Link to="/showroom" className="compare-browse-btn">
                <span>Go to Showroom</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="compare-table-wrap">
              <table className="compare-table">
                <thead>
                  <tr>
                    <th scope="col" className="compare-col--label">
                      Helmet Model
                    </th>
                    {compareList.map((helmet) => (
                      <th key={helmet.id} scope="col" className="compare-col--product">
                        <div className="compare-card">
                          <button
                            type="button"
                            className="compare-card__remove"
                            onClick={() => removeFromCompare(helmet.id)}
                            aria-label={`Remove ${helmet.title} from comparison`}
                          >
                            <X size={16} />
                          </button>
                          <img
                            src={helmet.image}
                            alt={helmet.title}
                            className="compare-card__img"
                            width={140}
                            height={140}
                            loading="lazy"
                          />
                          <h3 className="compare-card__title">{helmet.title}</h3>
                          <span className="compare-card__cat">{helmet.category}</span>
                          <span className="compare-card__price">{helmet.priceLabel || '—'}</span>
                          <span className="compare-card__mrp-note">
                            {helmet.referenceNote || 'Reference MRP'}
                          </span>
                          <a
                            href={handleWhatsAppInquiry(helmet)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="compare-card__wa"
                          >
                            <WhatsAppIcon size={14} />
                            <span>Enquire on WA</span>
                          </a>
                        </div>
                      </th>
                    ))}
                    {/* Placeholder columns if < 3 */}
                    {Array.from({ length: 3 - compareList.length }).map((_, idx) => (
                      <th key={`slot-${idx}`} scope="col" className="compare-col--empty">
                        <div className="compare-empty-slot">
                          <Scale size={24} aria-hidden="true" />
                          <span>Add another helmet from showroom to compare</span>
                          <Link to="/showroom" className="compare-empty-slot__link">
                            + Add Model
                          </Link>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Brand</th>
                    {compareList.map((h) => (
                      <td key={h.id}>{h.brand || 'AXOR Helmets'}</td>
                    ))}
                    {Array.from({ length: 3 - compareList.length }).map((_, i) => (
                      <td key={i} className="compare-cell--empty">—</td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">Safety Certification</th>
                    {compareList.map((h) => (
                      <td key={h.id} className="compare-highlight">
                        {h.certification || 'Verified Standards'}
                      </td>
                    ))}
                    {Array.from({ length: 3 - compareList.length }).map((_, i) => (
                      <td key={i} className="compare-cell--empty">—</td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">Shell Construction</th>
                    {compareList.map((h) => (
                      <td key={h.id}>{h.shellSpec || '—'}</td>
                    ))}
                    {Array.from({ length: 3 - compareList.length }).map((_, i) => (
                      <td key={i} className="compare-cell--empty">—</td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">Weight Class</th>
                    {compareList.map((h) => (
                      <td key={h.id}>{h.weightSpec || '—'}</td>
                    ))}
                    {Array.from({ length: 3 - compareList.length }).map((_, i) => (
                      <td key={i} className="compare-cell--empty">—</td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">Visor Optics</th>
                    {compareList.map((h) => (
                      <td key={h.id}>{h.visorSpec || '—'}</td>
                    ))}
                    {Array.from({ length: 3 - compareList.length }).map((_, i) => (
                      <td key={i} className="compare-cell--empty">—</td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">Ventilation Architecture</th>
                    {compareList.map((h) => (
                      <td key={h.id}>{h.ventilationSpec || '—'}</td>
                    ))}
                    {Array.from({ length: 3 - compareList.length }).map((_, i) => (
                      <td key={i} className="compare-cell--empty">—</td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">Retention System</th>
                    {compareList.map((h) => (
                      <td key={h.id}>{h.retentionSpec || '—'}</td>
                    ))}
                    {Array.from({ length: 3 - compareList.length }).map((_, i) => (
                      <td key={i} className="compare-cell--empty">—</td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">Fit Profile</th>
                    {compareList.map((h) => (
                      <td key={h.id}>{h.fitNote || 'Standard'}</td>
                    ))}
                    {Array.from({ length: 3 - compareList.length }).map((_, i) => (
                      <td key={i} className="compare-cell--empty">—</td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row">Key Highlights</th>
                    {compareList.map((h) => (
                      <td key={h.id}>
                        {Array.isArray(h.highlights) && h.highlights.length > 0 ? (
                          <ul className="compare-highlights">
                            {h.highlights.map((point, idx) => (
                              <li key={idx}>
                                <Check size={12} aria-hidden="true" />
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          '—'
                        )}
                      </td>
                    ))}
                    {Array.from({ length: 3 - compareList.length }).map((_, i) => (
                      <td key={i} className="compare-cell--empty">—</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
