import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import type { Anomaly, Priority } from '../types';
import { ANOMALY_TYPE_META, PRIORITY_META } from '../types';
import { formatLat, formatLng, formatDepth } from '../data/demo';

// ─── Coordinate mapping ──────────────────────────────────────────────
interface Bounds {
  latMin: number; latMax: number; lngMin: number; lngMax: number;
  depthMin: number; depthMax: number;
}

function coordsToPosition(lat: number, lng: number, depth: number, bounds: Bounds): [number, number, number] {
  const x = ((lng - bounds.lngMin) / (bounds.lngMax - bounds.lngMin) - 0.5) * 44;
  const z = ((lat - bounds.latMin) / (bounds.latMax - bounds.latMin) - 0.5) * 44;
  const depthRange = Math.max(1, bounds.depthMax - bounds.depthMin);
  const y = -((depth - bounds.depthMin) / depthRange) * 6 - 0.5;
  return [x, y, z];
}

// ─── Procedural bathymetry ────────────────────────────────────────────
function useBathymetryGeometry() {
  return useMemo(() => {
    const geo = new THREE.PlaneGeometry(52, 52, 120, 120);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const dist = Math.sqrt(x * x + y * y);
      const noise =
        Math.sin(x * 0.25) * Math.cos(y * 0.25) * 2.0 +
        Math.sin(x * 0.7 + y * 0.4) * 0.8 +
        Math.cos(dist * 0.12) * 1.2 +
        Math.sin(x * 1.5) * Math.cos(y * 1.3) * 0.3;
      pos.setZ(i, noise);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);
}

function BathymetryTerrain() {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometry = useBathymetryGeometry();

  useFrame((state) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.12 + Math.sin(state.clock.elapsedTime * 0.4) * 0.03;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} geometry={geometry} receiveShadow>
      <meshStandardMaterial
        color="#0a1a33"
        emissive="#0e7490"
        emissiveIntensity={0.12}
        roughness={0.9}
        metalness={0.15}
        flatShading
      />
    </mesh>
  );
}

function BathymetryWireframe() {
  const geometry = useBathymetryGeometry();
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={geometry} position={[0, 0.01, 0]}>
      <meshBasicMaterial color="#1f4775" wireframe transparent opacity={0.12} />
    </mesh>
  );
}

// ─── Sonar grid ───────────────────────────────────────────────────────
function SonarGrid() {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = -22; i <= 22; i += 4) {
      pts.push(new THREE.Vector3(i, -0.3, -22), new THREE.Vector3(i, -0.3, 22));
      pts.push(new THREE.Vector3(-22, -0.3, i), new THREE.Vector3(22, -0.3, i));
    }
    return pts;
  }, []);

  return <Line points={points} color="#16365a" lineWidth={1} transparent opacity={0.25} />;
}

// ─── Sonar scan sweep ─────────────────────────────────────────────────
function SonarSweep() {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state) => {
    const t = (state.clock.elapsedTime % 8) / 8;
    const x = -24 + t * 48;
    if (meshRef.current) {
      meshRef.current.position.x = x;
    }
    if (matRef.current) {
      const fade = Math.sin(t * Math.PI);
      matRef.current.opacity = 0.08 + fade * 0.12;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
      <planeGeometry args={[3, 48]} />
      <meshBasicMaterial
        ref={matRef}
        color="#22d3ee"
        transparent
        opacity={0.15}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// ─── Depth contour rings ──────────────────────────────────────────────
function DepthContours() {
  const rings = useMemo(() => {
    const items: { radius: number; opacity: number }[] = [];
    for (let r = 6; r <= 22; r += 4) {
      items.push({ radius: r, opacity: 0.15 - (r - 6) * 0.005 });
    }
    return items;
  }, []);

  return (
    <>
      {rings.map((r, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.25, 0]}>
          <ringGeometry args={[r.radius - 0.05, r.radius, 64]} />
          <meshBasicMaterial color="#0e7490" transparent opacity={r.opacity} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </>
  );
}

// ─── Anomaly 3D marker ────────────────────────────────────────────────
function AnomalyMarker({
  anomaly,
  position,
  isSelected,
  isHovered,
  onClick,
  onHover,
}: {
  anomaly: Anomaly;
  position: [number, number, number];
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onHover: (id: string | null) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const meta = ANOMALY_TYPE_META[anomaly.type];
  const priMeta = PRIORITY_META[anomaly.priority];
  const color = new THREE.Color(meta.color);
  const priColor = new THREE.Color(priMeta.color);
  const isHighPriority = anomaly.priority === 'critical' || anomaly.priority === 'high';

  // Size based on anomaly dimensions
  const markerSize = Math.max(0.4, Math.min(1.2, anomaly.dimensions.length / 10));

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(t * 1.5 + position[0]) * 0.08;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.3;
      const s = isSelected ? 1.4 : isHovered ? 1.2 : 1.0;
      ringRef.current.scale.setScalar(THREE.MathUtils.lerp(ringRef.current.scale.x, s, 0.1));
    }
    if (pulseRef.current && isHighPriority) {
      const pulse = 1 + Math.sin(t * 3) * 0.3;
      pulseRef.current.scale.setScalar(pulse);
      const mat = pulseRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.3 + Math.sin(t * 3) * 0.2;
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={(e) => { e.stopPropagation(); onHover(anomaly.id); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { onHover(null); document.body.style.cursor = 'default'; }}
    >
      {/* Core glowing object */}
      <mesh>
        <sphereGeometry args={[markerSize * 0.35, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 2.0 : isHighPriority ? 1.2 : 0.7}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* AI detection boundary box */}
      <mesh>
        <boxGeometry args={[markerSize, markerSize * 0.6, markerSize]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={isSelected ? 0.8 : 0.4} />
      </mesh>

      {/* Detection ring on seafloor */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]}>
        <ringGeometry args={[markerSize * 0.7, markerSize * 0.85, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>

      {/* Pulsing ring for high priority */}
      {isHighPriority && (
        <mesh ref={pulseRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.28, 0]}>
          <ringGeometry args={[markerSize * 0.9, markerSize * 1.0, 32]} />
          <meshBasicMaterial color={priColor} transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Vertical beam */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 3, 8]} />
        <meshBasicMaterial color={color} transparent opacity={isSelected ? 0.5 : 0.2} />
      </mesh>

      {/* Hover tooltip */}
      {isHovered && !isSelected && (
        <Html position={[0, 2.5, 0]} center distanceFactor={12} zIndexRange={[100, 0]}>
          <div className="px-2 py-1 rounded bg-navy-950/90 backdrop-blur-sm border text-[10px] font-mono whitespace-nowrap pointer-events-none" style={{ borderColor: `${meta.color}60` }}>
            <span style={{ color: meta.color }} className="font-bold">{meta.label}</span>
            <span className="text-navy-300 ml-2">{Math.round(anomaly.confidence * 100)}%</span>
          </div>
        </Html>
      )}

      {/* Selected floating info card */}
      {isSelected && (
        <Html position={[0, 3.5, 0]} center distanceFactor={10} zIndexRange={[200, 0]}>
          <div className="w-52 rounded-lg bg-navy-950/95 backdrop-blur-md border p-3 shadow-2xl" style={{ borderColor: `${meta.color}80`, boxShadow: `0 0 20px ${meta.color}30` }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-2 pb-2 border-b" style={{ borderColor: `${meta.color}40` }}>
              <span className="text-[10px] font-mono font-bold tracking-wider" style={{ color: meta.color }}>
                ANOMALY {anomaly.id.replace('MG-', '#')}
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ color: priMeta.color, backgroundColor: priMeta.bg }}>
                {priMeta.label.toUpperCase()}
              </span>
            </div>
            {/* Classification */}
            <div className="text-xs font-semibold text-navy-50 mb-2">{anomaly.classification}</div>
            {/* Data rows */}
            <div className="space-y-1">
              <DataRow label="Confidence" value={`${Math.round(anomaly.confidence * 100)}%`} color={meta.color} />
              <DataRow label="Latitude" value={formatLat(anomaly.coordinates.lat)} />
              <DataRow label="Longitude" value={formatLng(anomaly.coordinates.lng)} />
              <DataRow label="Depth" value={formatDepth(anomaly.coordinates.depth)} />
              <DataRow label="Est. Size" value={`${anomaly.dimensions.length} m`} />
            </div>
            {/* Demo label */}
            <div className="mt-2 pt-2 border-t border-navy-700/40 text-[8px] font-mono text-amber-400/60 text-center tracking-wider">
              DEMO / SIMULATED COORDINATES
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function DataRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[9px] uppercase tracking-wider text-navy-400">{label}</span>
      <span className="text-[10px] font-mono" style={{ color: color || '#cffafe' }}>{value}</span>
    </div>
  );
}

// ─── Camera controller ────────────────────────────────────────────────
function CameraController({
  focusTarget,
  resetTrigger,
}: {
  focusTarget: [number, number, number] | null;
  resetTrigger: number;
}) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const targetPos = useRef(new THREE.Vector3(25, 18, 25));
  const targetLook = useRef(new THREE.Vector3(0, 0, 0));
  const animating = useRef(false);

  useEffect(() => {
    if (focusTarget) {
      const [x, y, z] = focusTarget;
      targetPos.current.set(x + 6, y + 8, z + 6);
      targetLook.current.set(x, y, z);
      animating.current = true;
    }
  }, [focusTarget]);

  useEffect(() => {
    if (resetTrigger > 0) {
      targetPos.current.set(25, 18, 25);
      targetLook.current.set(0, 0, 0);
      animating.current = true;
    }
  }, [resetTrigger]);

  useFrame(() => {
    if (animating.current) {
      camera.position.lerp(targetPos.current, 0.08);
      if (controlsRef.current) {
        controlsRef.current.target.lerp(targetLook.current, 0.08);
        controlsRef.current.update();
      }
      if (camera.position.distanceTo(targetPos.current) < 0.3) {
        animating.current = false;
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan
      enableZoom
      enableRotate
      minDistance={6}
      maxDistance={55}
      maxPolarAngle={Math.PI / 2.05}
      makeDefault
    />
  );
}

// ─── Scene ───────────────────────────────────────────────────────────
interface SceneProps {
  anomalies: Anomaly[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  resetTrigger: number;
  focusTrigger: number;
}

function Scene({ anomalies, selectedId, onSelect, resetTrigger, focusTrigger }: SceneProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [focusTarget, setFocusTarget] = useState<[number, number, number] | null>(null);

  const bounds = useMemo<Bounds>(() => {
    if (anomalies.length === 0) {
      return { latMin: 13.3, latMax: 13.9, lngMin: 79.1, lngMax: 79.7, depthMin: 400, depthMax: 1200 };
    }
    const lats = anomalies.map((a) => a.coordinates.lat);
    const lngs = anomalies.map((a) => a.coordinates.lng);
    const depths = anomalies.map((a) => a.coordinates.depth);
    return {
      latMin: Math.min(...lats) - 0.05,
      latMax: Math.max(...lats) + 0.05,
      lngMin: Math.min(...lngs) - 0.05,
      lngMax: Math.max(...lngs) + 0.05,
      depthMin: Math.min(...depths) - 30,
      depthMax: Math.max(...depths) + 30,
    };
  }, [anomalies]);

  // Focus camera when selection changes via focusTrigger
  useEffect(() => {
    if (selectedId && focusTrigger > 0) {
      const a = anomalies.find((x) => x.id === selectedId);
      if (a) {
        const pos = coordsToPosition(a.coordinates.lat, a.coordinates.lng, a.coordinates.depth, bounds);
        setFocusTarget(pos);
      }
    }
  }, [focusTrigger, selectedId, anomalies, bounds]);

  // Reset focus when selection cleared
  useEffect(() => {
    if (!selectedId) setFocusTarget(null);
  }, [selectedId]);

  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[15, 25, 10]} intensity={0.4} color="#a5f3fc" />
      <pointLight position={[-15, 8, -15]} intensity={0.3} color="#22d3ee" />
      <pointLight position={[15, 5, 15]} intensity={0.2} color="#0891b2" />
      <hemisphereLight args={['#0a1a33', '#060f1f', 0.3]} />

      <BathymetryTerrain />
      <BathymetryWireframe />
      <SonarGrid />
      <DepthContours />
      <SonarSweep />

      {anomalies.map((a) => {
        const pos = coordsToPosition(a.coordinates.lat, a.coordinates.lng, a.coordinates.depth, bounds);
        return (
          <AnomalyMarker
            key={a.id}
            anomaly={a}
            position={pos}
            isSelected={selectedId === a.id}
            isHovered={hoveredId === a.id}
            onClick={() => onSelect(a.id)}
            onHover={setHoveredId}
          />
        );
      })}

      <CameraController focusTarget={focusTarget} resetTrigger={resetTrigger} />
    </>
  );
}

export interface Seafloor3DProps {
  anomalies: Anomaly[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  resetTrigger: number;
  focusTrigger: number;
}

export function Seafloor3D({ anomalies, selectedId, onSelect, resetTrigger, focusTrigger }: Seafloor3DProps) {
  return (
    <Canvas
      camera={{ position: [25, 18, 25], fov: 50 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      <Scene
        anomalies={anomalies}
        selectedId={selectedId}
        onSelect={onSelect}
        resetTrigger={resetTrigger}
        focusTrigger={focusTrigger}
      />
    </Canvas>
  );
}
