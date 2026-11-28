import { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

export const THEME_MODES = [
  { id: 'dark', label: 'Dark Mode' },
  { id: 'light', label: 'Light Mode' },
  { id: 'system', label: 'System Default' },
];

export const THEME_ACCENTS = [
  {
    id: 'racing-red',
    label: 'Racing Red',
    color: '#e11d2a',
    bright: '#ff2e3b',
    deep: '#8f0f19',
    glow: 'rgba(225, 29, 42, 0.28)',
    subtle: 'rgba(225, 29, 42, 0.12)',
    border: 'rgba(225, 29, 42, 0.45)',
  },
  {
    id: 'electric-blue',
    label: 'Electric Blue',
    color: '#0088ff',
    bright: '#38b6ff',
    deep: '#0055aa',
    glow: 'rgba(0, 136, 255, 0.28)',
    subtle: 'rgba(0, 136, 255, 0.12)',
    border: 'rgba(0, 136, 255, 0.45)',
  },
  {
    id: 'neon-green',
    label: 'Neon Green',
    color: '#10b981',
    bright: '#34d399',
    deep: '#065f46',
    glow: 'rgba(16, 185, 129, 0.28)',
    subtle: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.45)',
  },
  {
    id: 'orange-apex',
    label: 'Orange Apex',
    color: '#f97316',
    bright: '#fb923c',
    deep: '#c2410c',
    glow: 'rgba(249, 115, 22, 0.28)',
    subtle: 'rgba(249, 115, 22, 0.12)',
    border: 'rgba(249, 115, 22, 0.45)',
  },
  {
    id: 'metallic-silver',
    label: 'Metallic Silver',
    color: '#9aa2b0',
    bright: '#cfd5df',
    deep: '#4b5563',
    glow: 'rgba(207, 213, 223, 0.28)',
    subtle: 'rgba(207, 213, 223, 0.12)',
    border: 'rgba(207, 213, 223, 0.45)',
  },
];

const DEFAULT_THEME = {
  mode: 'dark',
  accent: 'racing-red',
};

const STORAGE_KEY = 'biker_cafe_theme_preferences';

const ThemeContext = createContext({
  theme: DEFAULT_THEME,
  setMode: () => {},
  setAccent: () => {},
  resetTheme: () => {},
  resolvedMode: 'dark',
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          mode: parsed.mode || 'dark',
          accent: parsed.accent || 'racing-red',
        };
      }
    } catch {
      // fallback
    }
    return DEFAULT_THEME;
  });

  const [systemIsDark, setSystemIsDark] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Track system preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setSystemIsDark(e.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  const resolvedMode = theme.mode === 'system' ? (systemIsDark ? 'dark' : 'light') : theme.mode;

  // Apply to DOM dataset
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', resolvedMode);
    root.setAttribute('data-accent', theme.accent);

    const accentObj = THEME_ACCENTS.find((a) => a.id === theme.accent) || THEME_ACCENTS[0];
    root.style.setProperty('--red-core', accentObj.color);
    root.style.setProperty('--red-bright', accentObj.bright);
    root.style.setProperty('--red-deep', accentObj.deep);
    root.style.setProperty('--red-glow', accentObj.glow);
    root.style.setProperty('--red-subtle', accentObj.subtle);
    root.style.setProperty('--border-red', accentObj.border);
  }, [resolvedMode, theme.accent]);

  // Sync to Firestore for authenticated users
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists() && snap.data().theme) {
            const remoteTheme = snap.data().theme;
            setTheme((prev) => ({
              mode: remoteTheme.mode || prev.mode,
              accent: remoteTheme.accent || prev.accent,
            }));
          } else {
            // Write current theme to user profile
            await setDoc(userDocRef, { theme }, { merge: true });
          }
        } catch {
          // Ignore offline/permission errors
        }
      }
    });

    return () => unsubscribe();
  }, [theme]);

  const updateTheme = (updater) => {
    setTheme((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // storage disabled
      }
      if (auth.currentUser) {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        setDoc(userDocRef, { theme: next }, { merge: true }).catch(() => {});
      }
      return next;
    });
  };

  const setMode = (mode) => updateTheme({ mode });
  const setAccent = (accent) => updateTheme({ accent });
  const resetTheme = () => updateTheme(DEFAULT_THEME);

  return (
    <ThemeContext.Provider value={{ theme, setMode, setAccent, resetTheme, resolvedMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
