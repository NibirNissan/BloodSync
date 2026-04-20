import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

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
const SEGMENTS_PER_TURN = 28;
const TOTAL_SEGMENTS = STRAND_TURNS * SEGMENTS_PER_TURN;
const HELIX_RADIUS = 1.25;
const HELIX_HEIGHT = 12;
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
  return new THREE.TubeGeometry(curve, TOTAL_SEGMENTS * 2, 0.07, 14, false);
}

/** Build a curved rung between two strand points. The rung bows
 *  outward in Y so the connector reads as an organic, drooping bond
 *  rather than a stiff pin — matches real DNA reference photos. */
function buildRungGeometry(a: THREE.Vector3, b: THREE.Vector3) {
  const mid = a.clone().add(b).multiplyScalar(0.5);
  // Push the midpoint slightly outward (radially) and downward to bow.
  const radial = new THREE.Vector3(mid.x, 0, mid.z).normalize();
  const ctrl = mid.clone().add(radial.multiplyScalar(0.18)).add(new THREE.Vector3(0, -0.05, 0));
  const curve = new THREE.QuadraticBezierCurve3(a, ctrl, b);
  return new THREE.TubeGeometry(curve, 18, 0.035, 8, false);
}

function nodePositions(strand: 0 | 1): Vec3[] {
  const out: Vec3[] = [];
  for (let i = 0; i <= TOTAL_SEGMENTS; i += RUNG_EVERY) {
    const p = helixPoint(i, strand);
    out.push([p.x, p.y, p.z]);
  }
  return out;
}

function HelixGroup() {
  const group = useRef<THREE.Group>(null);
  const nodesRef0 = useRef<THREE.InstancedMesh>(null);
  const nodesRef1 = useRef<THREE.InstancedMesh>(null);

  const scrollRef = useRef(0);
  const targetScroll = useRef(0);

  const backbone0 = useMemo(() => buildBackbone(0), []);
  const backbone1 = useMemo(() => buildBackbone(1), []);

  const rungGeoms = useMemo(() => {
    const arr: THREE.BufferGeometry[] = [];
    for (let i = 0; i <= TOTAL_SEGMENTS; i += RUNG_EVERY) {
      arr.push(buildRungGeometry(helixPoint(i, 0), helixPoint(i, 1)));
    }
    return arr;
  }, []);

  const nodes0 = useMemo(() => nodePositions(0), []);
  const nodes1 = useMemo(() => nodePositions(1), []);

  // Larger spherical nodes — the glossy “beads” of the strand.
  const nodeGeometry = useMemo(() => new THREE.SphereGeometry(0.16, 24, 24), []);

  // Shared materials. Building them once and reusing across all matching
  // meshes lets the pulse animation drive every node/rung in lock-step
  // (otherwise only the first instancedMesh would pulse and the helix
  // would look lopsided).
  const backboneMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#1a0208",
        emissive: "#ff1530",
        emissiveIntensity: 1.4,
        roughness: 0.18,
        metalness: 0.1,
        transmission: 0.55,
        thickness: 0.6,
        clearcoat: 1,
        clearcoatRoughness: 0.15,
        ior: 1.45,
        transparent: true,
        opacity: 0.92,
      }),
    [],
  );
  const rungMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#220308",
        emissive: "#ff2a52",
        emissiveIntensity: 0.9,
        roughness: 0.22,
        metalness: 0.08,
        transmission: 0.45,
        thickness: 0.3,
        clearcoat: 0.85,
        transparent: true,
        opacity: 0.78,
      }),
    [],
  );
  const nodeMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#1a0208",
        emissive: "#ff2244",
        emissiveIntensity: 1.8,
        roughness: 0.12,
        metalness: 0.15,
        transmission: 0.7,
        thickness: 0.5,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
        ior: 1.5,
        transparent: true,
        opacity: 0.95,
      }),
    [],
  );

  // Position instanced node meshes once after mount.
  useEffect(() => {
    const dummy = new THREE.Object3D();
    [nodes0, nodes1].forEach((arr, idx) => {
      const inst = idx === 0 ? nodesRef0.current : nodesRef1.current;
      if (!inst) return;
      arr.forEach((p, i) => {
        dummy.position.set(p[0], p[1], p[2]);
        dummy.updateMatrix();
        inst.setMatrixAt(i, dummy.matrix);
      });
      inst.instanceMatrix.needsUpdate = true;
    });
  }, [nodes0, nodes1]);

  useEffect(() => {
    return () => {
      backbone0.dispose();
      backbone1.dispose();
      rungGeoms.forEach((g) => g.dispose());
      nodeGeometry.dispose();
      backboneMat.dispose();
      rungMat.dispose();
      nodeMat.dispose();
    };
  }, [backbone0, backbone1, rungGeoms, nodeGeometry, backboneMat, rungMat, nodeMat]);

  useFrame((_, delta) => {
    if (!group.current) return;

    // Smooth lerp toward the live scroll position. Capping the alpha at
    // 1 keeps the motion stable when delta spikes after a tab refocus.
    targetScroll.current = typeof window !== "undefined" ? window.scrollY : 0;
    const alpha = Math.min(delta * 5, 1);
    scrollRef.current += (targetScroll.current - scrollRef.current) * alpha;

    const scrollNorm = scrollRef.current / Math.max(window.innerHeight, 1);
    const t = performance.now() * 0.001;

    // Y rotation — scroll-driven + slow ambient spin.
    group.current.rotation.y = scrollNorm * 1.05 + t * 0.18;

    // Subtle upward drift + lateral sway.
    group.current.position.y = scrollNorm * 1.4;
    group.current.position.x = Math.sin(scrollNorm * 0.7) * 1.0;

    // Perspective shift: gently push helix away & tilt as user scrolls
    // for a dramatic depth change.
    group.current.position.z = -Math.min(scrollNorm, 2) * 1.4;
    group.current.rotation.x = scrollNorm * 0.18;
    group.current.rotation.z = Math.sin(scrollNorm * 0.4) * 0.05;

    // Pulsating emissive — soft heartbeat ~1.1Hz. Drives the shared
    // material instances so every node and rung pulses together.
    const pulse = 1.6 + Math.sin(t * 2.2) * 0.7;
    nodeMat.emissiveIntensity = pulse;
    rungMat.emissiveIntensity = pulse * 0.55;
    backboneMat.emissiveIntensity = 1.0 + Math.sin(t * 2.2) * 0.4;
  });

  return (
    <group ref={group}>
      {/* Backbones — translucent blood-red glass with edge glow.
          Dark base color + strong emissive = dark core, glowing edges. */}
      <mesh geometry={backbone0} material={backboneMat} />
      <mesh geometry={backbone1} material={backboneMat} />

      {/* Curved organic rungs (base pairs). */}
      {rungGeoms.map((geom, i) => (
        <mesh key={`rung-${i}`} geometry={geom} material={rungMat} />
      ))}

      {/* Nodes — glossy translucent spheres with pulsating emissive core. */}
      <instancedMesh ref={nodesRef0} args={[nodeGeometry, nodeMat, nodes0.length]} />
      <instancedMesh ref={nodesRef1} args={[nodeGeometry, nodeMat, nodes1.length]} />
    </group>
  );
}

export function DnaHelixBackground() {
  const [webglOk, setWebglOk] = useState(false);

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
        camera={{ position: [0, 0, 6.4], fov: 42 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ background: "transparent", pointerEvents: "none" }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
        }}
      >
        {/* Dim ambient — keeps the helix’s core dark so only edges glow. */}
        <ambientLight intensity={0.18} />
        {/* Warm rim lights to catch the glassy edges. */}
        <pointLight position={[5, 4, 6]} intensity={1.6} color="#ff334d" distance={20} decay={1.4} />
        <pointLight position={[-6, -3, 4]} intensity={1.0} color="#7a0a1c" distance={20} decay={1.4} />
        <pointLight position={[0, -6, 3]} intensity={0.8} color="#ff5566" distance={18} decay={1.6} />

        <Suspense fallback={null}>
          <HelixGroup />
        </Suspense>
      </Canvas>
    </div>
  );
}
