import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** Cheap WebGL availability check — some sandboxed/proxied iframes (and very
 *  old browsers) don't expose a WebGL context. We bail out silently so the
 *  page still renders its glassmorphism layout without a crashing overlay. */
function hasWebGL(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}

const STRAND_TURNS = 4;
const SEGMENTS_PER_TURN = 24;
const TOTAL_SEGMENTS = STRAND_TURNS * SEGMENTS_PER_TURN;
const HELIX_RADIUS = 1.15;
const HELIX_HEIGHT = 11;
const RUNG_EVERY = 2;

type Vec3 = [number, number, number];

function helixPoint(i: number, strand: 0 | 1): THREE.Vector3 {
  const t = i / TOTAL_SEGMENTS;
  const angle = t * STRAND_TURNS * Math.PI * 2 + (strand === 0 ? 0 : Math.PI);
  const y = (t - 0.5) * HELIX_HEIGHT;
  return new THREE.Vector3(
    Math.cos(angle) * HELIX_RADIUS,
    y,
    Math.sin(angle) * HELIX_RADIUS,
  );
}

function buildBackbone(strand: 0 | 1) {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= TOTAL_SEGMENTS; i++) points.push(helixPoint(i, strand));
  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.TubeGeometry(curve, TOTAL_SEGMENTS * 2, 0.05, 10, false);
}

function buildRungs(): { from: Vec3; to: Vec3; mid: Vec3; len: number; rotY: number }[] {
  const rungs: { from: Vec3; to: Vec3; mid: Vec3; len: number; rotY: number }[] = [];
  for (let i = 0; i <= TOTAL_SEGMENTS; i += RUNG_EVERY) {
    const a = helixPoint(i, 0);
    const b = helixPoint(i, 1);
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const dir = b.clone().sub(a);
    rungs.push({
      from: [a.x, a.y, a.z],
      to: [b.x, b.y, b.z],
      mid: [mid.x, mid.y, mid.z],
      len: dir.length(),
      rotY: Math.atan2(dir.z, dir.x),
    });
  }
  return rungs;
}

function nodePositions(strand: 0 | 1): Vec3[] {
  const out: Vec3[] = [];
  for (let i = 0; i <= TOTAL_SEGMENTS; i += RUNG_EVERY) {
    const p = helixPoint(i, strand);
    out.push([p.x, p.y, p.z]);
  }
  return out;
}

/**
 * Reads window.scrollY each frame and applies a smooth parallax —
 * Y rotation, vertical drift, and lateral sway — to the helix group.
 * Refs avoid React re-renders entirely; the scene runs at 60fps.
 */
function HelixGroup() {
  const group = useRef<THREE.Group>(null);
  const scrollRef = useRef(0);
  const targetScroll = useRef(0);

  const backbone0 = useMemo(() => buildBackbone(0), []);
  const backbone1 = useMemo(() => buildBackbone(1), []);
  const rungs = useMemo(() => buildRungs(), []);
  const nodes0 = useMemo(() => nodePositions(0), []);
  const nodes1 = useMemo(() => nodePositions(1), []);

  // Shared geometries for nodes & rungs (avoids creating dozens per render).
  const nodeGeometry = useMemo(() => new THREE.SphereGeometry(0.11, 16, 16), []);
  const rungGeometry = useMemo(() => new THREE.CylinderGeometry(0.025, 0.025, 1, 8), []);

  // Dispose all GPU resources on unmount.
  useEffect(() => {
    return () => {
      backbone0.dispose();
      backbone1.dispose();
      nodeGeometry.dispose();
      rungGeometry.dispose();
    };
  }, [backbone0, backbone1, nodeGeometry, rungGeometry]);

  useFrame((_, delta) => {
    if (!group.current) return;

    // Smoothly chase window.scrollY (no React state — refs only).
    targetScroll.current = typeof window !== "undefined" ? window.scrollY : 0;
    scrollRef.current += (targetScroll.current - scrollRef.current) * Math.min(delta * 6, 1);

    const scrollNorm = scrollRef.current / Math.max(window.innerHeight, 1);

    // Constant gentle spin + scroll-driven rotation.
    group.current.rotation.y = scrollNorm * 0.85 + performance.now() * 0.00012;

    // Parallax: drift up and slide sideways as the user scrolls.
    group.current.position.y = scrollNorm * 1.6;
    group.current.position.x = Math.sin(scrollNorm * 0.6) * 1.2;
    group.current.rotation.x = scrollNorm * 0.12;
  });

  return (
    <group ref={group}>
      {/* Two backbones — emissive translucent red. */}
      <mesh geometry={backbone0}>
        <meshStandardMaterial
          color="#ef0033"
          emissive="#ff1f4a"
          emissiveIntensity={1.6}
          roughness={0.25}
          metalness={0.15}
          transparent
          opacity={0.85}
        />
      </mesh>
      <mesh geometry={backbone1}>
        <meshStandardMaterial
          color="#ef0033"
          emissive="#ff1f4a"
          emissiveIntensity={1.6}
          roughness={0.25}
          metalness={0.15}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Rungs (base pairs) — slim translucent connectors.
          Cylinder geom is unit-length; we scale Y to the rung length. */}
      {rungs.map((r, i) => (
        <mesh
          key={`rung-${i}`}
          geometry={rungGeometry}
          position={r.mid}
          rotation={[0, r.rotY, Math.PI / 2]}
          scale={[1, r.len, 1]}
        >
          <meshStandardMaterial
            color="#ff5577"
            emissive="#ff2c5b"
            emissiveIntensity={1.1}
            transparent
            opacity={0.55}
          />
        </mesh>
      ))}

      {/* Nodes — glowing spheres at every base-pair anchor. */}
      {nodes0.map((p, i) => (
        <mesh key={`n0-${i}`} geometry={nodeGeometry} position={p}>
          <meshStandardMaterial
            color="#ff3355"
            emissive="#ff3355"
            emissiveIntensity={2.4}
            transparent
            opacity={0.95}
          />
        </mesh>
      ))}
      {nodes1.map((p, i) => (
        <mesh key={`n1-${i}`} geometry={nodeGeometry} position={p}>
          <meshStandardMaterial
            color="#ff3355"
            emissive="#ff3355"
            emissiveIntensity={2.4}
            transparent
            opacity={0.95}
          />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Full-viewport fixed Canvas behind everything. pointer-events:none lets
 * all clicks pass through to the HTML buttons in front. z-index sits
 * above the .app-bg gradient layer but below page content (which lives
 * inside a relative wrapper at z-10+).
 */
export function DnaHelixBackground() {
  const [webglOk, setWebglOk] = useState(false);

  // Defer the check to the client so SSR/static prerender doesn't fail.
  useEffect(() => {
    setWebglOk(hasWebGL());
  }, []);

  if (!webglOk) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 6.2], fov: 45 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ background: "transparent", pointerEvents: "none" }}
        onCreated={({ gl }) => {
          // Make sure the canvas itself is transparent over the dark BG.
          gl.setClearColor(0x000000, 0);
        }}
      >
        {/* Subtle global lighting so the emissive surface still reads volume. */}
        <ambientLight intensity={0.35} />
        <pointLight position={[5, 5, 6]} intensity={1.2} color="#ff4d6d" />
        <pointLight position={[-6, -3, 4]} intensity={0.7} color="#7a1424" />

        <Suspense fallback={null}>
          <HelixGroup />
        </Suspense>
      </Canvas>
    </div>
  );
}
