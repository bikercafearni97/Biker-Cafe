import { useId } from 'react';
import './BikerCafeLogo.css';

export default function BikerCafeLogo({
  size = 'md',
  showSubtitle = true,
  compact = false,
  className = '',
}) {
  const uid = useId().replace(/:/g, '');
  const metalGradId = `bc-metal-${uid}`;
  const darkShellId = `bc-shell-${uid}`;
  const redGradId = `bc-red-${uid}`;
  const visorGradId = `bc-visor-${uid}`;

  return (
    <span className={`bc-logo bc-logo--${size} ${compact ? 'bc-logo--compact' : ''} ${className}`}>
      <svg
        className="bc-logo__mark"
        viewBox="0 0 72 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={metalGradId} x1="6" y1="8" x2="66" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F5F7FB" />
            <stop offset="42%" stopColor="#B8C0CE" />
            <stop offset="72%" stopColor="#6F7786" />
            <stop offset="100%" stopColor="#E4E8F0" />
          </linearGradient>
          <linearGradient id={darkShellId} x1="14" y1="10" x2="58" y2="54" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#232734" />
            <stop offset="55%" stopColor="#12141B" />
            <stop offset="100%" stopColor="#090A0D" />
          </linearGradient>
          <linearGradient id={redGradId} x1="16" y1="12" x2="64" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FF3644" />
            <stop offset="60%" stopColor="#E11D2A" />
            <stop offset="100%" stopColor="#940E18" />
          </linearGradient>
          <linearGradient id={visorGradId} x1="30" y1="22" x2="63" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#171C28" />
            <stop offset="50%" stopColor="#0A0C10" />
            <stop offset="100%" stopColor="#291217" />
          </linearGradient>
        </defs>

        {/* Outer aerodynamic framing ring */}
        <path
          d="M10 43C8.5 35.5 9.5 27.5 14 20.5C20 11 31.5 7 43.5 8.8"
          stroke={`url(#${metalGradId})`}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.45"
        />

        {/* Helmet outer shell silhouette */}
        <path
          d="M13 41.5C11.8 25 22.2 12 38.8 12C49.5 12 58.2 17.8 60.5 27.8L54.2 30.2L57.8 40.2C55.2 47.4 48.2 52 37.5 52H21.2C16.2 52 13.5 47.8 13 41.5Z"
          fill={`url(#${darkShellId})`}
          stroke={`url(#${metalGradId})`}
          strokeWidth="2.1"
          strokeLinejoin="round"
        />

        {/* Aero rear spoiler wing */}
        <path
          d="M11 32.5L17.5 26.5L16.2 35.5L10.5 37.5L11 32.5Z"
          fill={`url(#${metalGradId})`}
          opacity="0.9"
        />

        {/* Racing red apex speed stripe */}
        <path
          d="M19.5 20.2C25.5 14.8 34.5 12.8 44.5 14.5C47.5 15 50.2 16 52.5 17.5L47.5 20.4C38.8 18.2 29.8 19.2 22.8 23.2L19.5 20.2Z"
          fill={`url(#${redGradId})`}
        />

        {/* Sculpted iridium visor */}
        <path
          d="M33.5 24.4L59.4 23.2C60.8 27.4 60.2 32.2 57.6 36.2L34.4 35.4C30.4 35.2 28 32.4 28.4 29.1C28.8 26.2 30.8 24.5 33.5 24.4Z"
          fill={`url(#${visorGradId})`}
          stroke={`url(#${redGradId})`}
          strokeWidth="1.9"
          strokeLinejoin="round"
        />

        {/* Visor specular highlight */}
        <path
          d="M33.5 27.4L55.2 26.7"
          stroke="#F4F6FA"
          strokeWidth="1.3"
          strokeLinecap="round"
          opacity="0.65"
        />

        {/* Chin intake vent detail */}
        <path
          d="M42.5 43.2H52.5M44.5 46.4H51"
          stroke={`url(#${metalGradId})`}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>

      {!compact && (
        <span className="bc-logo__text">
          <span className="bc-logo__title">
            BIKER <span className="bc-logo__title-accent">CAFE</span>
          </span>
          {showSubtitle && <span className="bc-logo__subtitle">HELMET SHOWROOM</span>}
        </span>
      )}
    </span>
  );
}
