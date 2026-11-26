import { lazy, Suspense, useEffect, useRef } from 'react';
import gsap from 'gsap';
import BikerCafeLogo from '../brand/BikerCafeLogo';
import './CinematicIntro.css';

const HelmetStage = lazy(() => import('../three/HelmetStage'));

function IntroFallback() {
  return <div className="intro__fallback" aria-hidden="true" />;
}

export default function CinematicIntro({ onComplete }) {
  const rootRef = useRef(null);
  const completedRef = useRef(false);
  const timelineRef = useRef(null);
  const visorLabelRef = useRef(null);
  const calloutRef = useRef(null);

  // Mutable 3D rig updated by GSAP and consumed in Three.js useFrame without React re-renders
  const introRigRef = useRef({
    camAngle: 0,
    camRadius: 7.0,
    camHeight: 0.14,
    camTargetY: 0.05,
    helmetScale: 0.12,
    helmetYaw: 0,
    helmetPitch: 0.04,
    visorOpen: 0,
    keyLight: 0,
    redRim: 0,
    sideSpot: 0,
    chinSpot: 0,
    sweepProgress: -1.1,
    sweepIntensity: 0,
    trailScale: 0.35,
    trailOpacity: 0,
  });

  const finishIntro = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    timelineRef.current?.kill();
    onComplete?.();
  };

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      const timer = setTimeout(finishIntro, 450);
      return () => clearTimeout(timer);
    }

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        finishIntro();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    const onVisibilityChange = () => {
      const tl = timelineRef.current;
      if (!tl) return;
      if (document.hidden) {
        tl.pause();
      } else {
        tl.resume();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const setVisorText = (txt) => {
      if (visorLabelRef.current) visorLabelRef.current.textContent = txt;
    };
    const setCalloutText = (txt) => {
      if (calloutRef.current) calloutRef.current.textContent = txt;
    };

    const rig = introRigRef.current;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: finishIntro,
      });
      timelineRef.current = tl;

      // 1 & 2. Black screen -> tiny red glowing point at exact center (0.0s - 0.85s)
      tl.fromTo(
        '.intro__core-point',
        { opacity: 0, scale: 0.15 },
        { opacity: 1, scale: 1, duration: 0.7, ease: 'power2.out' },
        0.15
      )
        // 3. Point expands into small sports helmet silhouette + dark 3D seed (0.85s - 1.95s)
        .to(
          '.intro__core-point',
          { scale: 3.4, opacity: 0, duration: 0.75, ease: 'power2.inOut' },
          0.85
        )
        .fromTo(
          '.intro__silhouette',
          { opacity: 0, scale: 0.24 },
          { opacity: 0.92, scale: 0.55, duration: 0.85, ease: 'power3.out' },
          0.95
        )
        .to(
          '.intro__canvas-layer',
          { opacity: 1, duration: 0.6, ease: 'power2.out' },
          1.35
        )
        .to(
          rig,
          { redRim: 2.4, duration: 0.7, ease: 'power2.out' },
          1.35
        )
        // 4. Slow small-to-big growth toward camera into Front View + deliberate pause (1.95s - 3.85s)
        .to(
          '.intro__silhouette',
          { opacity: 0, scale: 1.15, duration: 0.75, ease: 'power2.in' },
          1.95
        )
        .to(
          '.intro__smoke',
          { opacity: 0.75, duration: 1.2, ease: 'power2.out' },
          1.95
        )
        .to(
          rig,
          {
            helmetScale: 0.92,
            camRadius: 3.85,
            camHeight: 0.2,
            chinSpot: 2.1,
            keyLight: 1.15,
            duration: 1.55,
            ease: 'power3.inOut',
          },
          1.95
        )
        // HUD appears cleanly once front silhouette is readable
        .fromTo(
          '.intro__hud',
          { opacity: 0 },
          { opacity: 1, duration: 0.5, ease: 'power2.out' },
          3.1
        )
        // 5. Dramatic 3D rotation: Front -> Side (Carbon + Spoiler) -> 3/4 Front (Chin Vents + Visor)
        // Side view reveal (3.85s - 4.9s)
        .to(
          rig,
          {
            camAngle: -1.48,
            camHeight: 0.28,
            helmetScale: 0.98,
            sideSpot: 3.4,
            redRim: 4.4,
            trailOpacity: 0.9,
            trailScale: 1,
            duration: 1.05,
            ease: 'power2.inOut',
            onStart: () => setCalloutText('CARBON SHELL // BI-PLANE SPOILER'),
          },
          3.85
        )
        // Three-quarter front view reveal (5.05s - 6.05s)
        .to(
          rig,
          {
            camAngle: 0.54,
            camHeight: 0.32,
            helmetScale: 1.0,
            keyLight: 2.6,
            chinSpot: 3.4,
            sideSpot: 1.4,
            duration: 1.0,
            ease: 'power2.inOut',
            onStart: () => setCalloutText('V-APEX CHIN VENTS // IRIDIUM VISOR'),
          },
          5.05
        )
        // 6. Slowly open visor -> deliberate pause -> close visor (6.15s - 7.65s)
        .to(
          rig,
          {
            visorOpen: 0.92,
            duration: 0.65,
            ease: 'power2.out',
            onStart: () => setVisorText('OPENING'),
            onComplete: () => setVisorText('OPEN'),
          },
          6.15
        )
        .to(
          rig,
          {
            visorOpen: 0,
            duration: 0.45,
            ease: 'power3.inOut',
            onStart: () => setVisorText('LOCKING'),
            onComplete: () => setVisorText('SEALED'),
          },
          7.2
        )
        // 7. Dramatic camera close-up + red light sweep across visor & shell (7.75s - 8.75s)
        .to(
          rig,
          {
            camRadius: 2.62,
            camAngle: 0.26,
            camHeight: 0.18,
            sweepIntensity: 5.5,
            duration: 0.85,
            ease: 'power2.inOut',
            onStart: () => setCalloutText('AERODYNAMIC CLOSE-UP // VISOR LOCKED'),
          },
          7.75
        )
        .to(
          rig,
          {
            sweepProgress: 1.15,
            duration: 0.85,
            ease: 'power2.inOut',
          },
          7.85
        )
        .fromTo(
          '.intro__light-sweep',
          { xPercent: -120, opacity: 0 },
          { xPercent: 140, opacity: 0.85, duration: 0.85, ease: 'power2.inOut' },
          7.85
        )
        .to(
          rig,
          { sweepIntensity: 0, duration: 0.25 },
          8.65
        )
        // 8. Helmet moves slightly backwards while BIKER CAFE logo assembles (8.85s - 9.95s)
        .to(
          rig,
          {
            camRadius: 4.35,
            helmetScale: 0.82,
            keyLight: 1.1,
            trailOpacity: 0.25,
            duration: 0.9,
            ease: 'power2.inOut',
          },
          8.85
        )
        .to(
          '.intro__canvas-layer',
          { opacity: 0.26, duration: 0.65, ease: 'power2.inOut' },
          8.9
        )
        .to(
          '.intro__hud',
          { opacity: 0, duration: 0.35, ease: 'power2.in' },
          8.85
        )
        .fromTo(
          '.intro__logo-lockup',
          { opacity: 0, y: 24, scale: 0.92 },
          { opacity: 1, y: 0, scale: 1, duration: 0.68, ease: 'expo.out' },
          9.05
        )
        .fromTo(
          '.intro__logo-sheen',
          { xPercent: -130, opacity: 0 },
          { xPercent: 160, opacity: 1, duration: 0.72, ease: 'power2.inOut' },
          9.25
        )
        .fromTo(
          '.intro__tagline',
          { opacity: 0, letterSpacing: '0.45em' },
          { opacity: 1, letterSpacing: '0.28em', duration: 0.5, ease: 'power3.out' },
          9.3
        )
        .to('.intro__progress-fill', { scaleX: 1, duration: 0.55, ease: 'power2.inOut' }, 9.25)
        // 9. Smooth racing-style diagonal split wipe into homepage (9.95s - 10.75s)
        .to(
          '.intro__logo-lockup, .intro__skip, .intro__smoke, .intro__canvas-layer',
          { opacity: 0, duration: 0.24, ease: 'power2.in' },
          9.9
        )
        .to(
          '.intro__wipe--top',
          { xPercent: -108, yPercent: -12, duration: 0.72, ease: 'expo.inOut' },
          10.05
        )
        .to(
          '.intro__wipe--bottom',
          { xPercent: 108, yPercent: 12, duration: 0.72, ease: 'expo.inOut' },
          10.05
        );
    }, rootRef);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={rootRef}
      className="intro"
      role="dialog"
      aria-modal="true"
      aria-label="Biker Cafe Superbike Helmet Opening Sequence"
    >
      {/* Skip Intro button — placed first in DOM order so keyboard users can Tab to it immediately */}
      <button type="button" className="intro__skip" onClick={finishIntro}>
        Skip Intro
      </button>

      {/* Racing-style split wipe shutters */}
      <div className="intro__wipe intro__wipe--top" aria-hidden="true" />
      <div className="intro__wipe intro__wipe--bottom" aria-hidden="true" />

      {/* Pre-feathered atmospheric glow (zero heavy CSS blur filter) */}
      <div className="intro__smoke" aria-hidden="true" />

      {/* Phase 2: Tiny centered crimson ignition point */}
      <div className="intro__core-point" aria-hidden="true" />

      {/* Phase 3: Small expanding sports helmet silhouette */}
      <div className="intro__silhouette-wrap" aria-hidden="true">
        <div className="intro__silhouette">
          <svg viewBox="0 0 220 180" fill="none">
            <path
              d="M36 124C32 70 66 26 118 26C155 26 182 46 189 80L168 88L180 120C172 144 148 158 112 158H62C46 158 38 144 36 124Z"
              stroke="#ff2a38"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <path
              d="M100 68L186 64C190 78 188 94 179 106L104 103C91 102 84 93 85 83C86 74 92 68 100 68Z"
              fill="rgba(255, 42, 56, 0.14)"
              stroke="#ff2a38"
              strokeWidth="1.8"
            />
          </svg>
        </div>
      </div>

      {/* 3D Superbike Helmet Canvas */}
      <div className="intro__canvas-layer">
        <Suspense fallback={<IntroFallback />}>
          <HelmetStage mode="intro" introRigRef={introRigRef} />
        </Suspense>
      </div>

      {/* Optical red light sweep */}
      <div className="intro__light-sweep" aria-hidden="true" />

      {/* Lightweight HUD Telemetry Corners (updated via DOM refs, zero React re-renders) */}
      <div className="intro__hud" aria-hidden="true">
        <div className="intro__hud-corner intro__hud-corner--tl">
          <span className="intro__hud-label" ref={calloutRef}>
            FRONT PROFILE // AERO STANCE
          </span>
          <span className="intro__hud-sub">BIKER CAFE TELEMETRY</span>
        </div>

        <div className="intro__hud-corner intro__hud-corner--tr">
          <span className="intro__hud-label">
            VISOR // <span ref={visorLabelRef}>SEALED</span>
          </span>
          <span className="intro__hud-sub">DARK IRIDIUM SHIELD</span>
        </div>
      </div>

      {/* Metallic BIKER CAFE Logo Assembly */}
      <div className="intro__logo-lockup">
        <div className="intro__logo-box">
          <BikerCafeLogo size="lg" showSubtitle={false} />
          <div className="intro__logo-sheen" aria-hidden="true" />
        </div>
        <p className="intro__tagline">SUPERBIKE HELMET SHOWROOM</p>
        <div className="intro__progress" aria-hidden="true">
          <div className="intro__progress-fill" />
        </div>
      </div>

    </div>
  );
}
