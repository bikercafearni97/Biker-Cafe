import { useState } from 'react';
import { Ruler, ShieldAlert } from 'lucide-react';
import { buildWhatsAppUrl } from '../../data/showroomPlaceholders';
import WhatsAppIcon from '../ui/WhatsAppIcon';
import './HelmetSizeGuide.css';

/**
 * Official verified sizing charts from certified manufacturers (AXOR / ECE 22.06 standard).
 * Circumference measured approximately 2-2.5cm above eyebrows.
 */
const OFFICIAL_HELMET_SIZES = [
  { size: 'XS', cmRange: '53 - 54', minCm: 53, maxCm: 54 },
  { size: 'S', cmRange: '55 - 56', minCm: 55, maxCm: 56 },
  { size: 'M', cmRange: '57 - 58', minCm: 57, maxCm: 58 },
  { size: 'L', cmRange: '59 - 60', minCm: 59, maxCm: 60 },
  { size: 'XL', cmRange: '61 - 62', minCm: 61, maxCm: 62 },
  { size: 'XXL', cmRange: '63 - 64', minCm: 63, maxCm: 64 },
];

export default function HelmetSizeGuide({ helmetTitle = 'AXOR Helmet' }) {
  const [cmInput, setCmInput] = useState('');

  const numVal = parseFloat(cmInput);
  let recommendedSize = null;
  let sizeFeedback = '';

  if (!Number.isNaN(numVal) && numVal > 0) {
    if (numVal < 53) {
      sizeFeedback = 'Measurement is below standard adult shell sizes. Contact showroom for custom fit assistance.';
    } else if (numVal > 64) {
      sizeFeedback = 'Measurement exceeds standard XXL shell size. Contact showroom for specialized fit options.';
    } else {
      const match = OFFICIAL_HELMET_SIZES.find(
        (s) => numVal >= s.minCm && numVal <= s.maxCm
      );
      if (match) {
        recommendedSize = match.size;
        sizeFeedback = `Suggested shell size: ${match.size} (${match.cmRange} cm).`;
      } else {
        // In-between sizes
        const lower = OFFICIAL_HELMET_SIZES.filter((s) => s.maxCm < numVal).pop();
        const upper = OFFICIAL_HELMET_SIZES.find((s) => s.minCm > numVal);
        recommendedSize = `${lower?.size || ''} / ${upper?.size || ''}`;
        sizeFeedback = `Borderline measurement between ${recommendedSize}. Showroom trial strongly recommended.`;
      }
    }
  }

  const assistanceMsg = `Hello BIKER CAFE, I need help confirming my helmet size for "${helmetTitle}". My measured head circumference is ${cmInput || '[enter cm]'} cm.`;
  const assistanceHref = buildWhatsAppUrl(assistanceMsg);

  return (
    <div className="size-guide">
      <div className="size-guide__head">
        <div className="size-guide__icon">
          <Ruler size={20} aria-hidden="true" />
        </div>
        <div>
          <h3 className="size-guide__title">Official Manufacturer Helmet Size Guide</h3>
          <p className="size-guide__subtitle">
            Accurate head measurements ensure maximum protective efficacy of ECE / DOT liners.
          </p>
        </div>
      </div>

      <div className="size-guide__instructions">
        <h4>How to Measure Correctly:</h4>
        <ol>
          <li>Wrap a flexible measuring tape around your head, roughly 2.5 cm (1 inch) above your eyebrows.</li>
          <li>Ensure the tape passes over the widest part at the back of your skull.</li>
          <li>Hold the tape snugly against your scalp without pulling excessively tight.</li>
          <li>Take 2 to 3 measurements to ensure consistency, then check the table below.</li>
        </ol>
      </div>

      <div className="size-guide__calculator">
        <label htmlFor="head-cm-input">Check Your Sizing (cm):</label>
        <div className="size-guide__calc-row">
          <input
            id="head-cm-input"
            type="number"
            min={45}
            max={75}
            step="0.1"
            placeholder="e.g. 57.5"
            value={cmInput}
            onChange={(e) => setCmInput(e.target.value)}
          />
          <span className="size-guide__unit">cm</span>
        </div>

        {sizeFeedback && (
          <div className="size-guide__result">
            {recommendedSize && (
              <span className="size-guide__badge">Recommended Size: {recommendedSize}</span>
            )}
            <p className="size-guide__result-text">{sizeFeedback}</p>
          </div>
        )}
      </div>

      <div className="size-guide__table-wrap">
        <table className="size-guide__table">
          <thead>
            <tr>
              <th scope="col">Size</th>
              <th scope="col">Head Circumference (cm)</th>
              <th scope="col">Fit Profile</th>
            </tr>
          </thead>
          <tbody>
            {OFFICIAL_HELMET_SIZES.map((row) => (
              <tr
                key={row.size}
                className={recommendedSize === row.size ? 'size-guide__row--active' : ''}
              >
                <td>
                  <strong>{row.size}</strong>
                </td>
                <td>{row.cmRange} cm</td>
                <td>Snug Sport / Touring Fit</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="size-guide__notice" role="note">
        <ShieldAlert size={16} aria-hidden="true" />
        <p>
          <strong>Fitment Disclaimer:</strong> Head shapes (intermediate oval, round, long oval)
          substantially affect cheek pad pressure and crown fit. Size calculations are indicative
          only and cannot guarantee fit without physical trial.
        </p>
      </div>

      <div className="size-guide__foot">
        <a
          href={assistanceHref}
          target="_blank"
          rel="noopener noreferrer"
          className="size-guide__wa-btn"
        >
          <WhatsAppIcon size={16} />
          <span>Need Fit Advice? Ask Showroom via WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
