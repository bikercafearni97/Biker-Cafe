import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

let cachedCarbonTextures = null;

/**
 * Generates and caches a lightweight 64x64 2x2 twill carbon-fiber weave
 * (diffuse + roughness map) once per app session to avoid shader/canvas overhead.
 */
function getCarbonFiberTextures() {
  if (cachedCarbonTextures) return cachedCarbonTextures;

  const size = 64;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const cCtx = colorCanvas.getContext('2d');

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d');

  cCtx.fillStyle = '#0c0e13';
  cCtx.fillRect(0, 0, size, size);
  rCtx.fillStyle = '#3a3a3a';
  rCtx.fillRect(0, 0, size, size);

  const cell = 8;
  for (let y = 0; y < size; y += cell) {
    for (let x = 0; x < size; x += cell) {
      const diag = ((x + y) / cell) % 2 === 0;
      cCtx.fillStyle = diag ? '#1b1f29' : '#0b0d12';
      cCtx.fillRect(x, y, cell - 0.5, cell - 0.5);

      cCtx.fillStyle = diag ? 'rgba(220, 228, 242, 0.08)' : 'rgba(255, 255, 255, 0.02)';
      cCtx.fillRect(x + 1, y + 1, cell - 2, cell / 2);

      rCtx.fillStyle = diag ? '#2b2b2b' : '#585858';
      rCtx.fillRect(x, y, cell, cell);
    }
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(12, 12);
  map.colorSpace = THREE.SRGBColorSpace;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(12, 12);

  cachedCarbonTextures = { map, roughnessMap };
  return cachedCarbonTextures;
}

/**
 * Aggressive MotoGP-inspired full-face superbike racing helmet.
 * Optimized geometry counts, fast PBR shaders, zero per-frame allocations,
 * and explicit geometry disposal on unmount.
 */
export default function HelmetModel({
  finish,
  reducedMotion = false,
  interactingRef,
  pointerRef,
  visorOpen = 0,
  mode = 'showroom',
  introRigRef,
}) {
  const rootScaleRef = useRef();
  const groupRef = useRef();
  const visorPivotRef = useRef();
  const ringOuterRef = useRef();
  const ringInnerRef = useRef();
  const visorLerpRef = useRef(0);

  const carbonTextures = useMemo(() => getCarbonFiberTextures(), []);

  const geos = useMemo(() => {
    // 1. Sharp aerodynamic racing shell (balanced 44x32 segments for smooth silhouette + fast shading)
    const shell = new THREE.SphereGeometry(0.96, 44, 32, 0, Math.PI * 2, 0, Math.PI * 0.72);
    const pos = shell.attributes.position;
    const v = new THREE.Vector3();

    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      v.x *= 0.88;
      v.z *= 1.18;

      if (v.z > 0.25) {
        const fwd = (v.z - 0.25) / 0.9;
        v.y -= fwd * 0.08;
        v.x *= 1 - fwd * 0.14;
      }

      if (v.z < -0.2) {
        const rear = Math.abs(v.z + 0.2) / 0.95;
        v.z -= rear * 0.24;
        v.y += rear * 0.12 * (v.y > 0 ? 1 : 0.35);
        v.x *= 1 - rear * 0.22;
      }

      if (Math.abs(v.x) > 0.42 && v.y > -0.15 && v.y < 0.55) {
        const ridge = Math.sin(((v.y + 0.15) / 0.7) * Math.PI);
        v.x += Math.sign(v.x) * ridge * 0.055;
      }

      if (v.y < -0.22) {
        v.x *= 0.96;
      }

      pos.setXYZ(i, v.x, v.y, v.z);
    }
    shell.computeVertexNormals();

    // 2. Angular V-apex superbike chin guard
    const chinShape = new THREE.Shape();
    chinShape.moveTo(-0.74, 0.18);
    chinShape.lineTo(-0.56, 0.78);
    chinShape.lineTo(-0.18, 1.14);
    chinShape.lineTo(0.0, 1.24);
    chinShape.lineTo(0.18, 1.14);
    chinShape.lineTo(0.56, 0.78);
    chinShape.lineTo(0.74, 0.18);
    chinShape.lineTo(0.58, 0.14);
    chinShape.lineTo(0.38, 0.64);
    chinShape.lineTo(0.0, 0.94);
    chinShape.lineTo(-0.38, 0.64);
    chinShape.lineTo(-0.58, 0.14);
    chinShape.closePath();

    const chinWing = new THREE.ExtrudeGeometry(chinShape, {
      depth: 0.28,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.032,
      bevelSegments: 2,
    });
    chinWing.rotateX(Math.PI * 0.5);
    chinWing.translate(0, -0.2, 0.06);
    chinWing.computeVertexNormals();

    // Lower chin splitter lip
    const lipShape = new THREE.Shape();
    lipShape.moveTo(-0.48, 0.58);
    lipShape.lineTo(0.0, 1.26);
    lipShape.lineTo(0.48, 0.58);
    lipShape.lineTo(0.32, 0.52);
    lipShape.lineTo(0.0, 1.04);
    lipShape.lineTo(-0.32, 0.52);
    lipShape.closePath();

    const chinLower = new THREE.ExtrudeGeometry(lipShape, {
      depth: 0.04,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.01,
      bevelSegments: 1,
    });
    chinLower.rotateX(Math.PI * 0.52);
    chinLower.translate(0, -0.49, 0.05);
    chinLower.computeVertexNormals();

    // 3. Lower neck-roll gasket
    const collarCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.68, -0.53, 0.34),
      new THREE.Vector3(-0.77, -0.56, -0.22),
      new THREE.Vector3(-0.46, -0.55, -0.88),
      new THREE.Vector3(0.0, -0.54, -1.08),
      new THREE.Vector3(0.46, -0.55, -0.88),
      new THREE.Vector3(0.77, -0.56, -0.22),
      new THREE.Vector3(0.68, -0.53, 0.34),
    ]);
    const collar = new THREE.TubeGeometry(collarCurve, 32, 0.068, 10, false);

    // 4. Aggressive wrap-around racing visor
    const visor = new THREE.CylinderGeometry(
      0.93,
      0.98,
      0.52,
      38,
      4,
      true,
      -Math.PI * 0.4,
      Math.PI * 0.8
    );
    const vPos = visor.attributes.position;
    for (let i = 0; i < vPos.count; i++) {
      const vx = vPos.getX(i);
      const vy = vPos.getY(i);
      const vz = vPos.getZ(i);
      const centerFactor = Math.max(0, 1 - Math.abs(vx) / 0.88);
      const yShift = vy < 0 ? -centerFactor * 0.075 : centerFactor * 0.03;
      vPos.setXYZ(i, vx * 0.91, vy + yShift - 0.09, vz * 1.15 - 0.04);
    }
    visor.computeVertexNormals();

    // 5. Recessed eye-port backing
    const innerEye = new THREE.CylinderGeometry(
      0.84,
      0.86,
      0.5,
      26,
      1,
      true,
      -Math.PI * 0.38,
      Math.PI * 0.76
    );
    innerEye.scale(0.9, 1.0, 1.1);

    // 6. Internal breath-deflector
    const breathShape = new THREE.Shape();
    breathShape.moveTo(-0.34, 0);
    breathShape.lineTo(-0.14, 0.14);
    breathShape.lineTo(0.0, 0.18);
    breathShape.lineTo(0.14, 0.14);
    breathShape.lineTo(0.34, 0);
    breathShape.lineTo(0.24, -0.04);
    breathShape.lineTo(0.0, 0.07);
    breathShape.lineTo(-0.24, -0.04);
    breathShape.closePath();
    const breathGuard = new THREE.ExtrudeGeometry(breathShape, {
      depth: 0.18,
      bevelEnabled: false,
    });
    breathGuard.rotateX(-0.32);

    // 7. Crown aero ridge / racing crest stripe
    const crestCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.35, 1.02),
      new THREE.Vector3(0, 0.74, 0.76),
      new THREE.Vector3(0, 0.985, 0.2),
      new THREE.Vector3(0, 0.95, -0.45),
      new THREE.Vector3(0, 0.74, -1.04),
    ]);
    const crest = new THREE.TubeGeometry(crestCurve, 30, 0.048, 8, false);
    crest.scale(1.85, 0.42, 1.0);

    // 8. Side aerodynamic graphic slash
    const slashCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.79, -0.14, 0.44),
      new THREE.Vector3(0.87, 0.08, 0.04),
      new THREE.Vector3(0.79, 0.28, -0.58),
      new THREE.Vector3(0.56, 0.44, -1.16),
    ]);
    const sideSlash = new THREE.TubeGeometry(slashCurve, 24, 0.024, 6, false);

    // 9. Prominent MotoGP rear bi-plane aero spoiler
    const spoilerShape = new THREE.Shape();
    spoilerShape.moveTo(-0.46, 0);
    spoilerShape.lineTo(-0.56, -0.52);
    spoilerShape.lineTo(-0.22, -0.66);
    spoilerShape.lineTo(0.0, -0.56);
    spoilerShape.lineTo(0.22, -0.66);
    spoilerShape.lineTo(0.56, -0.52);
    spoilerShape.lineTo(0.46, 0);
    spoilerShape.lineTo(0.18, -0.14);
    spoilerShape.lineTo(0.0, -0.06);
    spoilerShape.lineTo(-0.18, -0.14);
    spoilerShape.closePath();

    const spoilerMain = new THREE.ExtrudeGeometry(spoilerShape, {
      depth: 0.038,
      bevelEnabled: true,
      bevelThickness: 0.008,
      bevelSize: 0.008,
      bevelSegments: 1,
    });
    spoilerMain.rotateX(Math.PI * 0.5);
    spoilerMain.computeVertexNormals();

    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.lineTo(-0.58, 0.14);
    wingShape.lineTo(-0.66, 0.34);
    wingShape.lineTo(-0.12, 0.2);
    wingShape.closePath();
    const spoilerWing = new THREE.ExtrudeGeometry(wingShape, {
      depth: 0.028,
      bevelEnabled: true,
      bevelThickness: 0.006,
      bevelSize: 0.006,
      bevelSegments: 1,
    });
    spoilerWing.rotateY(Math.PI * 0.5);
    spoilerWing.computeVertexNormals();

    return {
      shellGeo: shell,
      chinWingGeo: chinWing,
      chinLowerGeo: chinLower,
      collarGeo: collar,
      visorGeo: visor,
      innerEyeGeo: innerEye,
      breathGuardGeo: breathGuard,
      crestGeo: crest,
      sideSlashGeo: sideSlash,
      spoilerMainGeo: spoilerMain,
      spoilerWingGeo: spoilerWing,
    };
  }, []);

  // Explicitly dispose procedural BufferGeometries on unmount to prevent GPU leaks
  useEffect(() => {
    return () => {
      Object.values(geos).forEach((g) => g?.dispose());
    };
  }, [geos]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);

    const rig = mode === 'intro' ? introRigRef?.current : null;
    const targetVisor = rig ? rig.visorOpen : visorOpen;
    visorLerpRef.current = THREE.MathUtils.lerp(visorLerpRef.current, targetVisor, dt * 7.5);
    if (visorPivotRef.current) {
      visorPivotRef.current.rotation.x = -visorLerpRef.current * 0.54;
    }

    if (rootScaleRef.current) {
      const targetScale = rig ? rig.helmetScale : 1;
      rootScaleRef.current.scale.setScalar(targetScale);
    }

    if (!groupRef.current) return;

    if (rig) {
      groupRef.current.rotation.y = rig.helmetYaw;
      groupRef.current.rotation.x = rig.helmetPitch;
      groupRef.current.position.y = reducedMotion
        ? 0
        : Math.sin(state.clock.elapsedTime * 1.2) * 0.025;
    } else if (!reducedMotion && !interactingRef?.current) {
      groupRef.current.rotation.y += dt * 0.32;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.15) * 0.04;

      if (pointerRef?.current) {
        const targetX = pointerRef.current.y * 0.14;
        const targetZ = -pointerRef.current.x * 0.08;
        groupRef.current.rotation.x = THREE.MathUtils.lerp(
          groupRef.current.rotation.x,
          0.08 + targetX,
          dt * 4.5
        );
        groupRef.current.rotation.z = THREE.MathUtils.lerp(
          groupRef.current.rotation.z,
          targetZ,
          dt * 4.5
        );
      }
    }

    const pauseIdleRing = reducedMotion || (!rig && Boolean(interactingRef?.current));
    if (ringOuterRef.current && !pauseIdleRing) {
      ringOuterRef.current.rotation.z -= dt * 0.32;
    }
    if (ringInnerRef.current && !pauseIdleRing) {
      ringInnerRef.current.rotation.z += dt * 0.45;
    }
  });

  const isDarkCarbon = !finish || finish.id === 'obsidian-carbon';
  const shellColor = isDarkCarbon ? '#1d2029' : finish.shellColor;
  const stripeColor = finish?.stripeColor ?? '#e11d2a';
  const visorColor = finish?.visorColor ?? '#0d121c';
  const metalColor = finish?.metalColor ?? '#c8d0dc';
  const shellRoughness = finish?.roughness ?? 0.22;

  return (
    <group ref={rootScaleRef} position={[0, 0.05, 0]}>
      <group ref={groupRef} rotation={[0.08, -0.58, 0]}>
        {/* Main sculpted racing shell (lightweight clearcoat physical shader) */}
        <mesh geometry={geos.shellGeo}>
          <meshPhysicalMaterial
            color={shellColor}
            map={carbonTextures.map}
            roughnessMap={carbonTextures.roughnessMap}
            metalness={0.55}
            roughness={shellRoughness}
            clearcoat={0.92}
            clearcoatRoughness={0.08}
          />
        </mesh>

        {/* Angular V-Apex Chin Guard */}
        <mesh geometry={geos.chinWingGeo}>
          <meshPhysicalMaterial
            color={shellColor}
            map={carbonTextures.map}
            roughnessMap={carbonTextures.roughnessMap}
            metalness={0.56}
            roughness={shellRoughness}
            clearcoat={0.9}
            clearcoatRoughness={0.09}
          />
        </mesh>

        {/* Racing Red / Metallic Lower Chin Aero Splitter */}
        <mesh geometry={geos.chinLowerGeo}>
          <meshStandardMaterial color={stripeColor} metalness={0.62} roughness={0.22} />
        </mesh>

        {/* Multi-port Angular Front Chin Vent + Metallic Mesh */}
        <group position={[0, -0.34, 1.24]} rotation={[0.22, 0, 0]}>
          <mesh>
            <boxGeometry args={[0.32, 0.14, 0.11]} />
            <meshStandardMaterial color="#090a0e" metalness={0.8} roughness={0.32} />
          </mesh>
          {[-0.08, 0, 0.08].map((vx, i) => (
            <mesh key={i} position={[vx, 0, 0.055]}>
              <boxGeometry args={[0.032, 0.09, 0.02]} />
              <meshStandardMaterial color={metalColor} metalness={0.9} roughness={0.2} />
            </mesh>
          ))}
          <mesh position={[0, 0.075, 0.02]}>
            <boxGeometry args={[0.3, 0.022, 0.07]} />
            <meshStandardMaterial color={stripeColor} metalness={0.55} roughness={0.25} />
          </mesh>
        </group>

        {/* Lower matte neck-roll collar */}
        <mesh geometry={geos.collarGeo}>
          <meshStandardMaterial color="#090a0d" metalness={0.1} roughness={0.85} />
        </mesh>

        {/* Recessed eye-port cavity & racing breath deflector (revealed when visor opens) */}
        <mesh geometry={geos.innerEyeGeo} position={[0, 0.0, 0.04]}>
          <meshStandardMaterial
            color="#040507"
            roughness={0.92}
            metalness={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh geometry={geos.breathGuardGeo} position={[0, -0.17, 0.88]}>
          <meshStandardMaterial color="#151922" roughness={0.72} metalness={0.25} />
        </mesh>

        {/* Articulated Dark Iridium Racing Visor (fast clearcoat mirror material without heavy iridescence pass) */}
        <group ref={visorPivotRef} position={[0, 0.08, 0.14]}>
          <mesh geometry={geos.visorGeo}>
            <meshPhysicalMaterial
              color={visorColor}
              metalness={0.88}
              roughness={0.05}
              clearcoat={1}
              clearcoatRoughness={0.03}
              envMapIntensity={1.55}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Upper visor racing-red brow seal */}
          <mesh position={[0, 0.17, -0.04]}>
            <cylinderGeometry
              args={[0.88, 0.88, 0.028, 32, 1, true, -Math.PI * 0.39, Math.PI * 0.78]}
            />
            <meshStandardMaterial
              color={stripeColor}
              emissive={stripeColor}
              emissiveIntensity={0.45}
              metalness={0.6}
              roughness={0.22}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Center racing visor lock latch tab */}
          <mesh position={[0, -0.34, 1.09]} rotation={[0.18, 0, 0]}>
            <boxGeometry args={[0.09, 0.075, 0.045]} />
            <meshStandardMaterial color={metalColor} metalness={0.92} roughness={0.18} />
          </mesh>
          <mesh position={[0, -0.34, 1.116]} rotation={[0.18, 0, 0]}>
            <boxGeometry args={[0.045, 0.03, 0.015]} />
            <meshStandardMaterial color={stripeColor} emissive={stripeColor} emissiveIntensity={0.55} />
          </mesh>

          {/* Tear-off mounting posts */}
          {[-0.68, 0.68].map((px, i) => (
            <mesh
              key={i}
              position={[px, -0.04, 0.66]}
              rotation={[0, px > 0 ? 0.8 : -0.8, Math.PI / 2]}
            >
              <cylinderGeometry args={[0.018, 0.018, 0.03, 10]} />
              <meshStandardMaterial color={metalColor} metalness={0.94} roughness={0.16} />
            </mesh>
          ))}
        </group>

        {/* CNC Side Visor Ratchet Mechanisms */}
        {[-1, 1].map((side) => (
          <group
            key={side}
            position={[side * 0.84, 0.04, 0.14]}
            rotation={[0, side * 1.44, 0]}
          >
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.165, 0.175, 0.045, 8]} />
              <meshStandardMaterial color="#161922" metalness={0.82} roughness={0.24} />
            </mesh>
            <mesh position={[0, 0, 0.024]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.105, 0.105, 0.016, 14]} />
              <meshStandardMaterial color={metalColor} metalness={0.92} roughness={0.18} />
            </mesh>
            <mesh position={[0, 0, 0.033]} rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.052, 0.072, 20]} />
              <meshStandardMaterial
                color={stripeColor}
                emissive={stripeColor}
                emissiveIntensity={0.4}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        ))}

        {/* Crown Aero Ridge */}
        <mesh geometry={geos.crestGeo}>
          <meshStandardMaterial color={stripeColor} metalness={0.52} roughness={0.2} />
        </mesh>

        {/* Forehead center intake scoop */}
        <group position={[0, 0.44, 0.99]} rotation={[0.42, 0, 0]}>
          <mesh>
            <boxGeometry args={[0.18, 0.06, 0.16]} />
            <meshStandardMaterial color="#12141b" metalness={0.78} roughness={0.26} />
          </mesh>
          <mesh position={[0, 0.01, 0.08]}>
            <boxGeometry args={[0.13, 0.025, 0.02]} />
            <meshStandardMaterial color={metalColor} metalness={0.9} roughness={0.2} />
          </mesh>
        </group>

        {/* Twin sculpted crown aero intake scoops */}
        {[-0.24, 0.24].map((xPos, idx) => (
          <group key={idx} position={[xPos, 0.78, 0.54]} rotation={[0.48, xPos * 0.4, 0]}>
            <mesh>
              <boxGeometry args={[0.13, 0.068, 0.46]} />
              <meshStandardMaterial
                color="#171a24"
                map={carbonTextures.map}
                metalness={0.65}
                roughness={0.26}
              />
            </mesh>
            <mesh position={[0, 0.026, 0.18]}>
              <boxGeometry args={[0.085, 0.02, 0.08]} />
              <meshStandardMaterial color={metalColor} metalness={0.92} roughness={0.18} />
            </mesh>
            <mesh position={[0, 0.036, -0.02]}>
              <boxGeometry args={[0.03, 0.012, 0.36]} />
              <meshStandardMaterial color={stripeColor} metalness={0.5} roughness={0.22} />
            </mesh>
          </group>
        ))}

        {/* Dynamic Side Aero Slash Stripes */}
        <mesh geometry={geos.sideSlashGeo}>
          <meshStandardMaterial color={metalColor} metalness={0.92} roughness={0.18} />
        </mesh>
        <mesh geometry={geos.sideSlashGeo} scale={[-1, 1, 1]}>
          <meshStandardMaterial color={metalColor} metalness={0.92} roughness={0.18} />
        </mesh>

        {/* Prominent MotoGP Rear Aerodynamic Bi-Plane Spoiler */}
        <group position={[0, 0.56, -0.84]} rotation={[0.24, 0, 0]}>
          <mesh geometry={geos.spoilerMainGeo}>
            <meshStandardMaterial
              color="#191d28"
              map={carbonTextures.map}
              metalness={0.72}
              roughness={0.2}
            />
          </mesh>

          {[-0.47, 0.47].map((wx, idx) => (
            <group key={idx} position={[wx, -0.06, -0.02]}>
              <mesh geometry={geos.spoilerWingGeo}>
                <meshStandardMaterial color="#161923" metalness={0.74} roughness={0.22} />
              </mesh>
              <mesh position={[idx === 0 ? -0.015 : 0.042, 0.24, -0.38]} rotation={[0.28, 0, 0]}>
                <boxGeometry args={[0.016, 0.03, 0.56]} />
                <meshStandardMaterial
                  color={stripeColor}
                  emissive={stripeColor}
                  emissiveIntensity={0.5}
                />
              </mesh>
            </group>
          ))}

          <mesh position={[0, -0.14, -0.28]} rotation={[-0.3, 0, 0]}>
            <boxGeometry args={[0.42, 0.06, 0.14]} />
            <meshStandardMaterial color="#090a0d" metalness={0.85} roughness={0.3} />
          </mesh>
        </group>
      </group>

      {/* Showroom / Intro Plinth & Rotating Red Energy Rings */}
      <group position={[0, -0.84, 0]}>
        {mode === 'showroom' && (
          <mesh>
            <cylinderGeometry args={[1.3, 1.42, 0.08, 48]} />
            <meshStandardMaterial color="#0b0d12" metalness={0.82} roughness={0.28} />
          </mesh>
        )}
        <mesh ref={ringOuterRef} position={[0, 0.046, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.22, 1.27, 48]} />
          <meshBasicMaterial
            color="#ff2433"
            transparent
            opacity={mode === 'intro' ? 0.88 : 0.78}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh ref={ringInnerRef} position={[0, 0.044, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.02, 1.045, 48, 1, 0, Math.PI * 1.45]} />
          <meshBasicMaterial color="#d4dae5" transparent opacity={0.38} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}
