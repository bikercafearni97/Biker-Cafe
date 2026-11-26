import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei';
import { Eye, EyeOff, RotateCw, Sparkles } from 'lucide-react';
import * as THREE from 'three';
import { SHOWROOM_FINISHES } from '../../data/showroomPlaceholders';
import HelmetModel from './HelmetModel';
import './HelmetStage.css';

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

function useDocumentVisible() {
  const [visible, setVisible] = useState(() =>
    typeof document !== 'undefined' ? !document.hidden : true
  );

  useEffect(() => {
    const onVisibilityChange = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  return visible;
}

function useInViewport(targetRef, rootMargin = '80px 0px') {
  const [inViewport, setInViewport] = useState(true);

  useEffect(() => {
    const node = targetRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInViewport(entry.isIntersecting);
      },
      { rootMargin, threshold: 0.01 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [targetRef, rootMargin]);

  return inViewport;
}

function useDeviceProfile() {
  return useMemo(() => {
    if (typeof window === 'undefined') {
      return { isMobile: false, isLowCore: false, isConstrained: false };
    }
    const isMobile = window.innerWidth < 768;
    const isLowCore =
      typeof navigator !== 'undefined' &&
      typeof navigator.hardwareConcurrency === 'number' &&
      navigator.hardwareConcurrency <= 4;
    return {
      isMobile,
      isLowCore,
      isConstrained: isMobile || isLowCore,
    };
  }, []);
}

function useAdaptiveDpr(profile, maxDesktop = 1.5) {
  return useMemo(() => {
    if (profile.isMobile) return profile.isLowCore ? 0.85 : 0.9;
    if (profile.isLowCore) return 1;
    return [1, maxDesktop];
  }, [profile, maxDesktop]);
}

/**
 * Lightweight intro 3D atmosphere:
 * - Adaptive particles (14 on mobile/low-core, 36 on desktop) for zero CPU/GPU stall
 * - Circling red light trails around the helmet
 * - Focused spotlights to reveal carbon shell, spoiler, chin vents & visor sequentially
 * - Proper BufferGeometry disposal on unmount
 */
function IntroAtmosphereFX({ introRigRef, reducedMotion, isConstrained = false }) {
  const pointsRef = useRef();
  const keyLightRef = useRef();
  const redRimRef = useRef();
  const sideSpotRef = useRef();
  const chinSpotRef = useRef();
  const sweepLightRef = useRef();
  const trailGroupRef = useRef();
  const trailMatARef = useRef();
  const trailMatBRef = useRef();
  const ringMatARef = useRef();
  const { camera } = useThree();

  const particleGeo = useMemo(() => {
    const count = isConstrained ? 14 : 36;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = ((i * 137.5) % 360) * (Math.PI / 180);
      const radius = 1.55 + ((i * 29) % 100) / 48;
      const height = (((i * 53) % 100) / 100 - 0.5) * 2.4;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = height;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [isConstrained]);

  useEffect(() => {
    return () => {
      particleGeo.dispose();
    };
  }, [particleGeo]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const rig = introRigRef?.current;

    if (rig) {
      const cx = Math.sin(rig.camAngle) * rig.camRadius;
      const cz = Math.cos(rig.camAngle) * rig.camRadius;
      camera.position.set(cx, rig.camHeight, cz);
      camera.lookAt(0, rig.camTargetY ?? 0.06, 0);

      if (keyLightRef.current) keyLightRef.current.intensity = rig.keyLight;
      if (redRimRef.current) redRimRef.current.intensity = rig.redRim;
      if (sideSpotRef.current) sideSpotRef.current.intensity = rig.sideSpot;
      if (chinSpotRef.current) chinSpotRef.current.intensity = rig.chinSpot;

      if (sweepLightRef.current) {
        sweepLightRef.current.position.x = rig.sweepProgress * 3.6;
        sweepLightRef.current.intensity = rig.sweepIntensity;
      }

      if (trailGroupRef.current) {
        trailGroupRef.current.scale.setScalar(rig.trailScale);
        if (!reducedMotion) {
          trailGroupRef.current.rotation.y += dt * 1.45;
        }
      }

      if (trailMatARef.current) trailMatARef.current.opacity = rig.trailOpacity * 0.85;
      if (trailMatBRef.current) trailMatBRef.current.opacity = rig.trailOpacity * 0.55;
      if (ringMatARef.current) ringMatARef.current.opacity = rig.trailOpacity * 0.72;
    }

    if (!reducedMotion && pointsRef.current) {
      pointsRef.current.rotation.y += dt * 0.12;
    }
  });

  const trailSegments = isConstrained ? 36 : 64;

  return (
    <>
      <ambientLight intensity={0.02} />

      {/* Focused key & rim lights ramped sequentially by GSAP */}
      <spotLight
        ref={keyLightRef}
        position={[2.4, 3.2, 3.8]}
        angle={0.42}
        penumbra={0.85}
        intensity={0}
        color="#f2f5fc"
      />
      <pointLight ref={redRimRef} position={[-2.2, 0.7, -2.5]} intensity={0} color="#ff1e2d" />
      <pointLight ref={sideSpotRef} position={[-3.2, 1.4, -0.8]} intensity={0} color="#dce3f0" />
      <pointLight ref={chinSpotRef} position={[0.4, -1.1, 2.8]} intensity={0} color="#ff3342" />
      <pointLight ref={sweepLightRef} position={[-3.6, 0.35, 2.5]} intensity={0} color="#ff2a38" />

      {/* Lightweight Glowing Particles */}
      <points ref={pointsRef} geometry={particleGeo}>
        <pointsMaterial
          color="#ff3846"
          size={0.04}
          transparent
          opacity={0.72}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Circling Red Light Trails around Helmet */}
      <group ref={trailGroupRef} scale={0.4}>
        <mesh rotation={[Math.PI * 0.44, 0.25, 0]}>
          <torusGeometry args={[1.62, 0.014, 8, trailSegments, Math.PI * 0.85]} />
          <meshBasicMaterial ref={trailMatARef} color="#ff2433" transparent opacity={0} />
        </mesh>
        <mesh rotation={[-Math.PI * 0.36, -0.32, Math.PI]}>
          <torusGeometry args={[1.82, 0.01, 8, trailSegments, Math.PI * 0.72]} />
          <meshBasicMaterial ref={trailMatBRef} color="#ff4a58" transparent opacity={0} />
        </mesh>
        <mesh rotation={[Math.PI * 0.5, 0, 0.4]}>
          <torusGeometry args={[1.45, 0.007, 8, trailSegments, Math.PI * 1.1]} />
          <meshBasicMaterial ref={ringMatARef} color="#d6dce6" transparent opacity={0} />
        </mesh>
      </group>
    </>
  );
}

export default function HelmetStage({
  mode = 'showroom',
  introRigRef,
  suspended = false,
  initialFinishId,
  onFinishChange,
}) {
  const [prevInitialId, setPrevInitialId] = useState(initialFinishId);
  const [activeFinish, setActiveFinish] = useState(
    () => SHOWROOM_FINISHES.find((f) => f.id === initialFinishId) || SHOWROOM_FINISHES[0]
  );

  if (initialFinishId !== prevInitialId) {
    setPrevInitialId(initialFinishId);
    setActiveFinish(
      SHOWROOM_FINISHES.find((f) => f.id === initialFinishId) || SHOWROOM_FINISHES[0]
    );
  }
  const [visorOpen, setVisorOpen] = useState(false);
  const [deferMount, setDeferMount] = useState(suspended);
  const stageRef = useRef(null);
  const rectCacheRef = useRef(null);
  const interactingRef = useRef(false);
  const pointerRef = useRef({ x: 0, y: 0 });
  const reducedMotion = usePrefersReducedMotion();
  const isTabVisible = useDocumentVisible();
  const isInViewport = useInViewport(stageRef);
  const deviceProfile = useDeviceProfile();
  const adaptiveDpr = useAdaptiveDpr(deviceProfile, 1.5);
  const envResolution = deviceProfile.isConstrained ? 32 : 64;
  const shouldRenderFrame = isTabVisible && isInViewport && !suspended;

  // Stagger Showroom Canvas mount slightly after Intro exits so WebGL teardown
  // and hero entrance animations never contend with new shader compilation.
  useEffect(() => {
    if (suspended || !deferMount) return undefined;
    const timer = setTimeout(() => {
      setDeferMount(false);
    }, 160);
    return () => clearTimeout(timer);
  }, [suspended, deferMount]);

  useEffect(() => {
    const node = stageRef.current;
    const invalidateRect = () => {
      rectCacheRef.current = null;
    };
    const endInteraction = () => {
      interactingRef.current = false;
    };

    window.addEventListener('scroll', invalidateRect, { passive: true });
    window.addEventListener('resize', invalidateRect, { passive: true });
    window.addEventListener('pointerup', endInteraction, { passive: true });
    window.addEventListener('pointercancel', endInteraction, { passive: true });

    let resizeObserver;
    if (node && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(invalidateRect);
      resizeObserver.observe(node);
    }

    return () => {
      window.removeEventListener('scroll', invalidateRect);
      window.removeEventListener('resize', invalidateRect);
      window.removeEventListener('pointerup', endInteraction);
      window.removeEventListener('pointercancel', endInteraction);
      resizeObserver?.disconnect();
    };
  }, []);

  const handlePointerMove = (e) => {
    if (mode === 'intro' || e.pointerType === 'touch') return;
    let rect = rectCacheRef.current;
    if (!rect) {
      rect = e.currentTarget.getBoundingClientRect();
      rectCacheRef.current = rect;
    }
    if (!rect.width || !rect.height) return;
    pointerRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointerRef.current.y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
  };

  const handlePointerLeave = () => {
    pointerRef.current.x = 0;
    pointerRef.current.y = 0;
  };

  if (mode === 'intro') {
    return (
      <div ref={stageRef} className="helmet-stage helmet-stage--intro">
        <Canvas
          shadows={false}
          dpr={adaptiveDpr}
          frameloop={shouldRenderFrame ? 'always' : 'never'}
          camera={{ position: [0, 0.1, 7.2], fov: 35 }}
          gl={{
            antialias: !deviceProfile.isConstrained,
            powerPreference: deviceProfile.isConstrained ? 'default' : 'high-performance',
            alpha: true,
          }}
        >
          <Environment resolution={envResolution}>
            <group rotation={[-Math.PI / 3, 0, 1]}>
              <Lightformer
                form="rect"
                intensity={2.2}
                position={[0, 5, -9]}
                scale={[10, 2, 1]}
                color="#ffffff"
              />
              <Lightformer
                form="ring"
                intensity={2.6}
                position={[-5, 2, -2]}
                scale={[4, 4, 1]}
                color="#ff2433"
              />
              <Lightformer
                form="rect"
                intensity={1.8}
                position={[6, 1, 2]}
                scale={[6, 3, 1]}
                color="#cfd6e3"
              />
            </group>
          </Environment>

          <Suspense fallback={null}>
            <IntroAtmosphereFX
              introRigRef={introRigRef}
              reducedMotion={reducedMotion}
              isConstrained={deviceProfile.isConstrained}
            />
            <HelmetModel
              finish={SHOWROOM_FINISHES[0]}
              reducedMotion={reducedMotion}
              mode="intro"
              introRigRef={introRigRef}
            />
          </Suspense>
        </Canvas>
      </div>
    );
  }

  return (
    <div
      ref={stageRef}
      className="helmet-stage"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <div className="helmet-stage__glow" aria-hidden="true" />
      <div className="helmet-stage__grid" aria-hidden="true" />

      <div className="helmet-stage__hud-top">
        <span className="helmet-stage__hud-tag">
          <Sparkles size={13} aria-hidden="true" />
          Interactive 3D Preview &mdash; {activeFinish.label}
        </span>
        <span className="helmet-stage__hud-hint">
          <RotateCw size={12} aria-hidden="true" />
          Drag to orbit
        </span>
      </div>

      <div className="helmet-stage__canvas-wrap">
        {!suspended && !deferMount && (
          <Canvas
            shadows={false}
            dpr={adaptiveDpr}
            frameloop={shouldRenderFrame ? 'always' : 'never'}
            camera={{ position: [0.42, 0.44, 3.45], fov: 36 }}
            gl={{
              antialias: !deviceProfile.isConstrained,
              powerPreference: deviceProfile.isConstrained ? 'default' : 'high-performance',
              alpha: true,
            }}
            onPointerDown={() => {
              interactingRef.current = true;
            }}
            onPointerUp={() => {
              interactingRef.current = false;
            }}
            onPointerCancel={() => {
              interactingRef.current = false;
            }}
          >
            <ambientLight intensity={0.28} />
            <spotLight
              position={[3.5, 4.5, 4]}
              angle={0.42}
              penumbra={0.8}
              intensity={2.5}
              color="#f5f7fb"
            />
            <pointLight position={[-3.2, 1.2, -1.8]} intensity={3.2} color="#e11d2a" />
            <pointLight position={[2.8, -0.6, -2.5]} intensity={1.8} color="#9aa6ba" />

            <Environment resolution={envResolution}>
              <group rotation={[-Math.PI / 3, 0, 1]}>
                <Lightformer
                  form="rect"
                  intensity={2.6}
                  position={[0, 5, -9]}
                  scale={[10, 2, 1]}
                  color="#ffffff"
                />
                <Lightformer
                  form="ring"
                  intensity={2.0}
                  position={[-5, 2, -2]}
                  scale={[4, 4, 1]}
                  color="#ff2e3b"
                />
                <Lightformer
                  form="rect"
                  intensity={2.1}
                  position={[6, 1, 2]}
                  scale={[6, 3, 1]}
                  color="#cfd6e3"
                />
              </group>
            </Environment>

            <Suspense fallback={null}>
              <HelmetModel
                finish={activeFinish}
                reducedMotion={reducedMotion}
                interactingRef={interactingRef}
                pointerRef={pointerRef}
                visorOpen={visorOpen ? 1 : 0}
                mode="showroom"
              />
              {/* Single-frame baked ContactShadows so GPU doesn't re-render shadow pass every frame */}
              <ContactShadows
                frames={1}
                resolution={deviceProfile.isConstrained ? 128 : 256}
                position={[0, -0.78, 0]}
                opacity={0.62}
                scale={4.3}
                blur={2.2}
                far={2.2}
                color="#000000"
              />
            </Suspense>

            <OrbitControls
              enableZoom={false}
              enablePan={false}
              minPolarAngle={Math.PI * 0.28}
              maxPolarAngle={Math.PI * 0.54}
              dampingFactor={0.07}
              enableDamping
            />
          </Canvas>
        )}
      </div>

      <div className="helmet-stage__controls" role="group" aria-label="Helmet finish and visor controls">
        <div className="helmet-stage__swatches">
          {SHOWROOM_FINISHES.map((finish) => {
            const active = finish.id === activeFinish.id;
            return (
              <button
                key={finish.id}
                type="button"
                className={`helmet-stage__swatch ${active ? 'is-active' : ''}`}
                onClick={() => {
                  setActiveFinish(finish);
                  onFinishChange?.(finish);
                }}
                aria-pressed={active}
              >
                <span
                  className="helmet-stage__swatch-chip"
                  style={{
                    background: `linear-gradient(135deg, ${finish.shellColor} 55%, ${finish.stripeColor} 55%)`,
                  }}
                  aria-hidden="true"
                />
                <span>{finish.label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className={`helmet-stage__visor-btn ${visorOpen ? 'is-open' : ''}`}
          onClick={() => setVisorOpen((prev) => !prev)}
          aria-pressed={visorOpen}
        >
          {visorOpen ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
          <span>{visorOpen ? 'Close Visor' : 'Open Visor'}</span>
        </button>
      </div>
    </div>
  );
}
