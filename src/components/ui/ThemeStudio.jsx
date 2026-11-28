import { RotateCcw } from 'lucide-react';
import { THEME_ACCENTS, THEME_MODES, useTheme } from '../../context/ThemeContext';
import './ThemeStudio.css';

export default function ThemeStudio({ compact = false }) {
  const { theme, setMode, setAccent, resetTheme } = useTheme();

  return (
    <div className={`theme-studio ${compact ? 'theme-studio--compact' : ''}`}>
      <div className="theme-studio__section">
        <label className="theme-studio__label">Appearance Mode</label>
        <div className="theme-studio__modes" role="radiogroup" aria-label="Theme Mode Selection">
          {THEME_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              role="radio"
              aria-checked={theme.mode === mode.id}
              className={`theme-studio__mode-btn ${
                theme.mode === mode.id ? 'theme-studio__mode-btn--active' : ''
              }`}
              onClick={() => setMode(mode.id)}
            >
              <span>{mode.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="theme-studio__section">
        <label className="theme-studio__label">Racing Accent Hue</label>
        <div className="theme-studio__accents" role="radiogroup" aria-label="Accent Color Selection">
          {THEME_ACCENTS.map((accent) => (
            <button
              key={accent.id}
              type="button"
              role="radio"
              aria-checked={theme.accent === accent.id}
              className={`theme-studio__accent-btn ${
                theme.accent === accent.id ? 'theme-studio__accent-btn--active' : ''
              }`}
              style={{ '--accent-preview': accent.color }}
              onClick={() => setAccent(accent.id)}
              title={accent.label}
              aria-label={accent.label}
            >
              <span className="theme-studio__accent-dot" />
              <span className="theme-studio__accent-name">{accent.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="theme-studio__footer">
        <button
          type="button"
          className="theme-studio__reset-btn"
          onClick={resetTheme}
          title="Reset theme and accent to factory default"
        >
          <RotateCcw size={14} aria-hidden="true" />
          <span>Reset to Default</span>
        </button>
      </div>
    </div>
  );
}
