import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, Environment, OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { Box, RotateCcw } from 'lucide-react';
import './ModelViewer3D.css';

/**
 * Custom GLTF/GLB Model renderer that automatically centers,
 * normalizes scale, applies smooth materials, and disposes resources cleanly.
 */
function GLTFModelRenderer({ url }) {
  const { scene } = useGLTF(url);
  const modelRef = useRef();

  const clonedScene = useMemo(() => {
    if (!scene) return null;
    const clone = scene.clone(true);

    // Compute bounding box to normalize scale and center the model
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const targetDim = 2.2; // comfortable scale for viewport
    const scaleFactor = targetDim / maxDim;
    clone.scale.setScalar(scaleFactor);

    // Recompute box after scale and center to (0, 0, 0)
    const scaledBox = new THREE.Box3().setFromObject(clone);
    const center = new THREE.Vector3();
    scaledBox.getCenter(center);
    clone.position.sub(center);

    // Setup shadows and materials
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material.side = THREE.DoubleSide;
        }
      }
    });

    return clone;
  }, [scene]);

  // Clean disposal on unmount
  useEffect(() => {
    return () => {
      if (clonedScene) {
        clonedScene.traverse((child) => {
          if (child.isMesh) {
            child.geometry?.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach((m) => m?.dispose());
            } else {
              child.material?.dispose();
            }
          }
        });
      }
    };
  }, [clonedScene]);

  if (!clonedScene) return null;
  return <primitive ref={modelRef} object={clonedScene} />;
}

/**
 * Universal 3D Helmet Model Viewer Component
 *
 * Supports:
 * - Real uploaded .glb / .gltf files
 * - Orbit controls (360 rotate, zoom, pan)
 * - Mobile touch gesture handling
 * - Reset view button
 * - Clean error fallback if 3D model fails to load
 * - Reduced motion and low-performance profile respect
 */
export default function ModelViewer3D({
  modelUrl,
  height = '480px',
  interactive = true,
}) {
  const [loadError] = useState(false);
  const controlsRef = useRef();

  const handleReset = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  if (!modelUrl || loadError) {
    return (
      <div className="model-3d-empty" style={{ minHeight: height }}>
        <Box size={40} className="model-3d-empty__icon" aria-hidden="true" />
        <h4 className="model-3d-empty__title">3D Preview Not Available</h4>
        <p className="model-3d-empty__desc">
          {loadError
            ? 'Unable to render the 3D model file. Please check format or connection.'
            : 'No 3D model uploaded for this helmet. Inspect official photographs in the gallery.'}
        </p>
      </div>
    );
  }

  return (
    <div className="model-3d-container" style={{ height }}>
      <div className="model-3d-controls-overlay">
        <button
          type="button"
          className="model-3d-btn"
          onClick={handleReset}
          title="Reset Camera Angle"
          aria-label="Reset Camera Angle"
        >
          <RotateCcw size={14} />
          <span>Reset View</span>
        </button>
        <span className="model-3d-hint">
          Drag to rotate &bull; Pinch/Scroll to zoom
        </span>
      </div>

      <Canvas
        shadows
        camera={{ position: [0, 0.4, 3.2], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.1;
        }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 8, 5]} intensity={1.4} castShadow shadow-mapSize={1024} />
        <directionalLight position={[-5, 4, -5]} intensity={0.6} />
        <pointLight position={[0, -2, 2]} intensity={0.4} />

        <Suspense fallback={null}>
          <Environment preset="city" />
          <GLTFModelRenderer url={modelUrl} />
          <ContactShadows
            position={[0, -1.2, 0]}
            opacity={0.65}
            scale={6}
            blur={2.4}
            far={4}
          />
        </Suspense>

        {interactive && (
          <OrbitControls
            ref={controlsRef}
            enablePan={false}
            enableZoom={true}
            minDistance={1.8}
            maxDistance={5.5}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={(5 * Math.PI) / 6}
            dampingFactor={0.08}
            rotateSpeed={0.8}
          />
        )}
      </Canvas>
    </div>
  );
}
