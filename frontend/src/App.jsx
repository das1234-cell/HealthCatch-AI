import { auth, provider } from './firebase';
import {
  signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  sendEmailVerification, updateProfile, signOut
} from 'firebase/auth';
import React, { useState, useEffect, useRef, useMemo, Suspense, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import * as THREE from 'three';
import {
  LayoutDashboard, MessageSquare, HeartPulse, Settings, Send, User, Bot, Loader2,
  LogOut, Search, Sun, Moon, Bell, Paperclip, Mail, Lock,
  Calendar, Users, CheckCircle, BrainCircuit, ChevronDown, Sparkles
} from 'lucide-react';


/* ═══════════════════════════════════════════════════════════════
   §1  GLOBAL STYLESāā
   ═══════════════════════════════════════════════════════════════ */
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap');
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      background: #000000;
      color: #ffffff;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    ::-webkit-scrollbar { width: 0px; background: transparent; }
    .text-gradient-hero {
      background: linear-gradient(135deg, #60a5fa 0%, #34d399 50%, #818cf8 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }
    .text-gradient-warm {
      background: linear-gradient(135deg, #f472b6 0%, #fb923c 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }
    .text-gradient-cool {
      background: linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `}</style>
);


/* ═══════════════════════════════════════════════════════════════
   §2  3D SCENE — DNA DOUBLE HELIX + NEURAL PARTICLES
   ═══════════════════════════════════════════════════════════════ */

// ── DNA Double Helix ──────────────────────────────────────────
function DNAHelix({ scrollProgress }) {
  const groupRef = useRef();
  const STRAND_COUNT = 80;
  const HELIX_HEIGHT = 12;
  const HELIX_RADIUS = 1.2;
  const TURNS = 3;

  // Pre-compute helix positions
  const { strandA, strandB, rungs } = useMemo(() => {
    const a = [], b = [], r = [];
    for (let i = 0; i < STRAND_COUNT; i++) {
      const t = i / STRAND_COUNT;
      const angle = t * Math.PI * 2 * TURNS;
      const y = (t - 0.5) * HELIX_HEIGHT;

      a.push({
        pos: [Math.cos(angle) * HELIX_RADIUS, y, Math.sin(angle) * HELIX_RADIUS],
        phase: t,
      });
      b.push({
        pos: [Math.cos(angle + Math.PI) * HELIX_RADIUS, y, Math.sin(angle + Math.PI) * HELIX_RADIUS],
        phase: t,
      });

      // Rungs every 2nd sphere
      if (i % 2 === 0) {
        r.push({
          start: [Math.cos(angle) * HELIX_RADIUS, y, Math.sin(angle) * HELIX_RADIUS],
          end: [Math.cos(angle + Math.PI) * HELIX_RADIUS, y, Math.sin(angle + Math.PI) * HELIX_RADIUS],
          phase: t,
        });
      }
    }
    return { strandA: a, strandB: b, rungs: r };
  }, []);

  // Animate rotation + scroll reactivity
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const sp = scrollProgress.current;

    groupRef.current.rotation.y = t * 0.15 + sp * Math.PI * 2;
    groupRef.current.rotation.x = Math.sin(t * 0.08) * 0.1;
    const s = 1 + Math.sin(sp * Math.PI) * 0.15;
    groupRef.current.scale.setScalar(s);
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Strand A — Blue */}
      {strandA.map((node, i) => (
        <DNASphere key={`a-${i}`} position={node.pos} phase={node.phase} color="#3b82f6" emissive="#1d4ed8" />
      ))}

      {/* Strand B — Emerald */}
      {strandB.map((node, i) => (
        <DNASphere key={`b-${i}`} position={node.pos} phase={node.phase} color="#10b981" emissive="#047857" />
      ))}

      {/* Rungs — connecting bars */}
      {rungs.map((rung, i) => (
        <DNARung key={`r-${i}`} start={rung.start} end={rung.end} phase={rung.phase} />
      ))}
    </group>
  );
}

// Individual DNA sphere with pulsing glow
function DNASphere({ position, phase, color, emissive }) {
  const ref = useRef();

  useFrame((state) => {
    if (!ref.current) return;
    const pulse = 0.8 + Math.sin(state.clock.elapsedTime * 2 + phase * 20) * 0.3;
    ref.current.scale.setScalar(pulse);
    ref.current.material.emissiveIntensity = 0.4 + Math.sin(state.clock.elapsedTime * 3 + phase * 15) * 0.3;
  });

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.08, 16, 16]} />
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={0.5}
        roughness={0.2}
        metalness={0.8}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

// Rung connecting two strands
function DNARung({ start, end, phase }) {
  const ref = useRef();

  // Compute midpoint, direction, and length
  const { midpoint, quaternion, length } = useMemo(() => {
    const s = new THREE.Vector3(...start);
    const e = new THREE.Vector3(...end);
    const mid = s.clone().add(e).multiplyScalar(0.5);
    const dir = e.clone().sub(s);
    const len = dir.length();
    const quat = new THREE.Quaternion();
    quat.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    return { midpoint: [mid.x, mid.y, mid.z], quaternion: quat, length: len };
  }, [start, end]);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.material.opacity = 0.15 + Math.sin(state.clock.elapsedTime * 2 + phase * 12) * 0.1;
  });

  return (
    <mesh ref={ref} position={midpoint} quaternion={quaternion}>
      <cylinderGeometry args={[0.015, 0.015, length, 6]} />
      <meshStandardMaterial
        color="#60a5fa"
        emissive="#3b82f6"
        emissiveIntensity={0.3}
        transparent
        opacity={0.2}
        roughness={0.5}
      />
    </mesh>
  );
}


// ── Neural Particle Network ───────────────────────────────────
function NeuralParticles({ scrollProgress, count = 100 }) {
  const pointsRef = useRef();
  const linesRef = useRef();

  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        pos: [(Math.random() - 0.5) * 16, (Math.random() - 0.5) * 16, (Math.random() - 0.5) * 10],
        vel: [(Math.random() - 0.5) * 0.003, (Math.random() - 0.5) * 0.003, (Math.random() - 0.5) * 0.002],
        phase: Math.random() * Math.PI * 2,
      });
    }
    return arr;
  }, [count]);

  const positions = useMemo(() => new Float32Array(count * 3), [count]);
  const linePositions = useMemo(() => new Float32Array(count * count * 6), [count]); // worst case

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Update particle positions
    for (let i = 0; i < count; i++) {
      const p = particles[i];
      p.pos[0] += p.vel[0] + Math.sin(t * 0.3 + p.phase) * 0.002;
      p.pos[1] += p.vel[1] + Math.cos(t * 0.2 + p.phase) * 0.002;
      p.pos[2] += p.vel[2];

      // Wrap around
      for (let axis = 0; axis < 3; axis++) {
        const limit = axis < 2 ? 8 : 5;
        if (p.pos[axis] > limit) p.pos[axis] = -limit;
        if (p.pos[axis] < -limit) p.pos[axis] = limit;
      }

      positions[i * 3] = p.pos[0];
      positions[i * 3 + 1] = p.pos[1];
      positions[i * 3 + 2] = p.pos[2];
    }

    if (pointsRef.current) {
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // Draw connection lines for nearby particles
    let lineIdx = 0;
    const CONNECTION_DIST = 2.5;
    const MAX_LINES = 300;
    let lineCount = 0;

    for (let i = 0; i < count && lineCount < MAX_LINES; i++) {
      for (let j = i + 1; j < count && lineCount < MAX_LINES; j++) {
        const dx = particles[i].pos[0] - particles[j].pos[0];
        const dy = particles[i].pos[1] - particles[j].pos[1];
        const dz = particles[i].pos[2] - particles[j].pos[2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < CONNECTION_DIST) {
          linePositions[lineIdx++] = particles[i].pos[0];
          linePositions[lineIdx++] = particles[i].pos[1];
          linePositions[lineIdx++] = particles[i].pos[2];
          linePositions[lineIdx++] = particles[j].pos[0];
          linePositions[lineIdx++] = particles[j].pos[1];
          linePositions[lineIdx++] = particles[j].pos[2];
          lineCount++;
        }
      }
    }

    if (linesRef.current) {
      linesRef.current.geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(linePositions.slice(0, lineIdx), 3)
      );
      linesRef.current.geometry.attributes.position.needsUpdate = true;
      linesRef.current.geometry.setDrawRange(0, lineCount * 2);
    }

    // Scroll reactivity: rotate the whole system
    if (pointsRef.current) {
      pointsRef.current.rotation.y = scrollProgress.current * Math.PI * 0.5;
    }
  });

  return (
    <>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.05} color="#60a5fa" transparent opacity={0.5} sizeAttenuation depthWrite={false} />
      </points>
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={0} array={linePositions} itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial color="#60a5fa" transparent opacity={0.06} depthWrite={false} />
      </lineSegments>
    </>
  );
}


// ── Ambient Health Glow (subtle pulsing sphere behind the DNA) ─
function AmbientGlow() {
  const ref = useRef();

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.material.opacity = 0.04 + Math.sin(t * 0.5) * 0.02;
    ref.current.scale.setScalar(3 + Math.sin(t * 0.3) * 0.4);
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial color="#3b82f6" transparent opacity={0.04} depthWrite={false} side={THREE.BackSide} />
    </mesh>
  );
}


// ── Camera Controller — smooth lerp between auth & dashboard ──
function CameraRig({ isLoggedIn }) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 0, 14));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    if (isLoggedIn) {
      // Dashboard: pull camera to the right and slightly up
      targetPos.current.set(6, 2, 12);
      targetLookAt.current.set(-1, 0, 0);
    } else {
      // Auth: centered cinematic wide shot
      targetPos.current.set(0, 0, 14);
      targetLookAt.current.set(0, 0, 0);
    }
  }, [isLoggedIn]);

  useFrame(() => {
    camera.position.lerp(targetPos.current, 0.02);
    const currentLookAt = new THREE.Vector3();
    camera.getWorldDirection(currentLookAt);
    const targetDir = targetLookAt.current.clone().sub(camera.position).normalize();
    currentLookAt.lerp(targetDir, 0.02);
    camera.lookAt(
      camera.position.x + currentLookAt.x,
      camera.position.y + currentLookAt.y,
      camera.position.z + currentLookAt.z
    );
  });

  return null;
}


// ── Scene Lights ──────────────────────────────────────────────
function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.08} />
      <directionalLight position={[5, 8, 5]} intensity={0.6} color="#60a5fa" />
      <directionalLight position={[-5, -3, 3]} intensity={0.3} color="#34d399" />
      <pointLight position={[0, 4, 2]} intensity={0.8} color="#3b82f6" distance={15} decay={2} />
      <pointLight position={[-3, -4, 4]} intensity={0.4} color="#10b981" distance={12} decay={2} />
      <pointLight position={[4, 0, -3]} intensity={0.3} color="#8b5cf6" distance={10} decay={2} />
    </>
  );
}


// ── Global 3D Background — ALWAYS RENDERED ────────────────────
function Global3DBackground({ isLoggedIn, scrollProgress }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 0,
      background: 'radial-gradient(ellipse at 50% 40%, #06101f 0%, #000000 70%)',
    }}>
      <Canvas
        camera={{ position: [0, 0, 14], fov: 40 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        style={{ pointerEvents: 'none' }}
      >
        <Suspense fallback={null}>
          <SceneLights />
          <CameraRig isLoggedIn={isLoggedIn} />
          <DNAHelix scrollProgress={scrollProgress} />
          <NeuralParticles scrollProgress={scrollProgress} count={100} />
          <AmbientGlow />
          <fog attach="fog" args={['#000000', 10, 28]} />
        </Suspense>
      </Canvas>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════
   §3  REUSABLE UI COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

function InputField({ icon, style, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative', marginBottom: '14px', ...style }}>
      <div style={{
        position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
        color: focused ? 'rgba(96,165,250,0.9)' : 'rgba(148,163,184,0.5)',
        transition: 'color 0.25s', zIndex: 1, display: 'flex', pointerEvents: 'none',
      }}>
        {icon}
      </div>
      <input
        {...props}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        style={{
          width: '100%', height: '50px',
          background: 'rgba(0,0,0,0.5)',
          border: `1px solid ${focused ? 'rgba(96,165,250,0.45)' : 'rgba(255,255,255,0.06)'}`,
          borderRadius: '14px', color: '#fff',
          padding: '0 16px 0 48px', fontSize: '14px',
          outline: 'none', transition: 'border-color 0.25s, box-shadow 0.25s',
          fontFamily: "'Inter', sans-serif",
          boxShadow: focused ? '0 0 0 3px rgba(59,130,246,0.08)' : 'none',
        }}
      />
    </div>
  );
}

function SidebarBtn({ icon, label, tab, active, set, isDark }) {
  const isActive = active === tab;
  return (
    <button
      onClick={() => set(tab)}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '13px 20px', borderRadius: '14px', border: 'none', width: '100%',
        background: isActive ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : 'transparent',
        color: isActive ? '#fff' : 'rgba(148,163,184,0.65)',
        fontSize: '13.5px', fontWeight: 600, cursor: 'pointer',
        transition: 'all 0.25s', textAlign: 'left', fontFamily: "'Inter', sans-serif",
        boxShadow: isActive ? '0 4px 24px -6px rgba(59,130,246,0.35)' : 'none',
      }}
      onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#fff'; } }}
      onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(148,163,184,0.65)'; } }}
    >
      {icon} {label}
    </button>
  );
}

function StatCard({ title, value, subtitle, color, panelBg, panelBorder, textSecondary }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        flex: '1 1 220px', padding: '28px 24px', borderRadius: '22px',
        background: panelBg, backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        border: `1px solid ${panelBorder}`, transition: 'background 0.4s, border 0.4s',
      }}
    >
      <h3 style={{
        fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.15em', color: textSecondary, marginBottom: '14px',
      }}>{title}</h3>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
        <span style={{ fontSize: '38px', fontWeight: 900, color, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}>
          {value}
        </span>
        <span style={{ fontSize: '14px', fontWeight: 500, color: textSecondary }}>{subtitle}</span>
      </div>
    </motion.div>
  );
}


/* ═══════════════════════════════════════════════════════════════
   §4  CINEMATIC LANDING (Unauthenticated)
   ═══════════════════════════════════════════════════════════════ */
function CinematicLanding({ onLogin, scrollProgressRef }) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const { scrollYProgress } = useScroll();

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    scrollProgressRef.current = v;
  });

  // ── Scene Animations ──
  const s1Opacity = useTransform(scrollYProgress, [0, 0.12, 0.18], [1, 1, 0]);
  const s1Y = useTransform(scrollYProgress, [0, 0.18], [0, -100]);
  const s1Scale = useTransform(scrollYProgress, [0, 0.18], [1, 0.88]);
  const s1Blur = useTransform(scrollYProgress, [0.12, 0.18], [0, 16]);

  const s2Opacity = useTransform(scrollYProgress, [0.15, 0.26, 0.38, 0.44], [0, 1, 1, 0]);
  const s2Y = useTransform(scrollYProgress, [0.15, 0.26], [70, 0]);
  const s2Blur = useTransform(scrollYProgress, [0.38, 0.44], [0, 16]);

  const s3Opacity = useTransform(scrollYProgress, [0.40, 0.50, 0.62, 0.68], [0, 1, 1, 0]);
  const s3Y = useTransform(scrollYProgress, [0.40, 0.50], [70, 0]);
  const s3Blur = useTransform(scrollYProgress, [0.62, 0.68], [0, 16]);

  const s4Opacity = useTransform(scrollYProgress, [0.65, 0.80], [0, 1]);
  const s4Y = useTransform(scrollYProgress, [0.65, 0.80], [80, 0]);
  const s4Scale = useTransform(scrollYProgress, [0.65, 0.80], [0.92, 1]);

  // ── Auth Handlers ──
  const handleGoogleLogin = async () => {
    try { setAuthError(''); await signInWithPopup(auth, provider); onLogin(); }
    catch { setAuthError("Google Login Failed!"); }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError(''); setSuccessMsg(''); setIsAuthLoading(true);
    try {
      if (isLoginMode) {
        if (!email || !password) throw new Error("Please enter email and password.");
        const cred = await signInWithEmailAndPassword(auth, email, password);
        if (!cred.user.emailVerified) { await signOut(auth); throw new Error("Please verify your email first!"); }
        onLogin();
      } else {
        if (!fullName || !dob || !gender || !email || !password || !confirmPassword) throw new Error("Fill all fields.");
        if (password !== confirmPassword) throw new Error("Passwords do not match!");
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: fullName });
        await sendEmailVerification(cred.user);
        await signOut(auth);
        setSuccessMsg("Account created! Check your email to verify.");
        setIsLoginMode(true); setPassword(''); setConfirmPassword('');
      }
    } catch (error) { setAuthError(error.message.replace("Firebase: ", "")); }
    finally { setIsAuthLoading(false); }
  };

  const features = [
    { icon: '🧬', title: 'AI Diagnostics', desc: 'Advanced health pattern recognition powered by neural networks.' },
    { icon: '🧠', title: 'Mental Wellness', desc: '24/7 AI counselor trained on clinical psychology frameworks.' },
    { icon: '🔒', title: 'Encrypted & Private', desc: 'Your data is end-to-end encrypted. We never sell or share.' },
  ];

  return (
    <div style={{ position: 'relative', zIndex: 1, height: '600vh' }}>

      {/* ── SCENE 1: HERO ── */}
      <motion.div style={{
        opacity: s1Opacity, y: s1Y, scale: s1Scale,
        filter: useTransform(s1Blur, v => `blur(${v}px)`),
        position: 'fixed', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '0 24px', pointerEvents: 'none',
      }}>
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginBottom: '36px' }}>
            <div style={{
              width: 52, height: 52, borderRadius: '16px',
              background: 'linear-gradient(135deg, #3b82f6, #10b981)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 50px rgba(59,130,246,0.35), 0 0 100px rgba(16,185,129,0.15)',
            }}>
              <BrainCircuit size={26} color="#fff" />
            </div>
            <span style={{
              fontSize: '16px', fontWeight: 700, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)',
              fontFamily: "'Space Grotesk', sans-serif",
            }}>HealthCatch</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(38px, 7.5vw, 88px)', fontWeight: 900, lineHeight: 1.0,
            letterSpacing: '-0.045em', marginBottom: '28px',
            fontFamily: "'Space Grotesk', sans-serif",
            textShadow: '0 0 80px rgba(96,165,250,0.2)',
          }}>
            <span style={{ color: '#fff' }}>Your Health.</span><br />
            <span className="text-gradient-hero">Decoded by AI.</span>
          </h1>

          <p style={{
            fontSize: 'clamp(15px, 1.8vw, 20px)', color: 'rgba(255,255,255,0.35)',
            maxWidth: '500px', margin: '0 auto', lineHeight: 1.75, fontWeight: 300,
          }}>
            Meet the AI-powered wellness companion that listens, understands, and guides your mental & physical health journey.
          </p>
        </motion.div>

        <motion.div
          animate={{ y: [0, 12, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
          style={{ position: 'absolute', bottom: '56px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.2)' }}
        >
          <span style={{ fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', fontWeight: 600 }}>Scroll to explore</span>
          <ChevronDown size={18} />
        </motion.div>
      </motion.div>

      {/* ── SCENE 2: STORY ── */}
      <motion.div style={{
        opacity: s2Opacity, y: s2Y,
        filter: useTransform(s2Blur, v => `blur(${v}px)`),
        position: 'fixed', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '0 24px', pointerEvents: 'none',
      }}>
        <h2 style={{
          fontSize: 'clamp(26px, 4.5vw, 58px)', fontWeight: 800, lineHeight: 1.18,
          letterSpacing: '-0.03em', maxWidth: '750px',
          fontFamily: "'Space Grotesk', sans-serif",
          textShadow: '0 0 60px rgba(96,165,250,0.15)',
        }}>
          Every heartbeat tells a story.<br />
          We help you <span className="text-gradient-warm">understand it.</span>
        </h2>
        <p style={{
          fontSize: 'clamp(14px, 1.5vw, 18px)', color: 'rgba(255,255,255,0.3)',
          maxWidth: '460px', marginTop: '28px', lineHeight: 1.8, fontWeight: 300,
        }}>
          Clinical psychology frameworks, real-time mood analysis, and an AI that evolves with you.
        </p>
      </motion.div>

      {/* ── SCENE 3: FEATURES ── */}
      <motion.div style={{
        opacity: s3Opacity, y: s3Y,
        filter: useTransform(s3Blur, v => `blur(${v}px)`),
        position: 'fixed', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '0 24px', pointerEvents: 'none',
      }}>
        <h2 style={{
          fontSize: 'clamp(22px, 3.5vw, 44px)', fontWeight: 800, letterSpacing: '-0.03em',
          marginBottom: '48px', textAlign: 'center',
          fontFamily: "'Space Grotesk', sans-serif",
        }}>
          Powered by <span className="text-gradient-cool">intelligence.</span>
        </h2>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '860px' }}>
          {features.map((f, i) => (
            <div key={i} style={{
              flex: '1 1 230px', maxWidth: '260px', padding: '32px 24px', borderRadius: '22px',
              background: 'rgba(255,255,255,0.025)', backdropFilter: 'blur(30px)',
              border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center',
            }}>
              <div style={{ fontSize: '36px', marginBottom: '14px' }}>{f.icon}</div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', fontFamily: "'Space Grotesk', sans-serif" }}>{f.title}</h3>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── SCENE 4: GLASSMORPHISM LOGIN ── */}
      <motion.div style={{
        opacity: s4Opacity, y: s4Y, scale: s4Scale,
        position: 'fixed', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', pointerEvents: 'auto',
      }}>
        <div style={{
          width: '100%', maxWidth: '460px',
          background: 'rgba(8, 15, 30, 0.6)',
          backdropFilter: 'blur(60px) saturate(200%)',
          WebkitBackdropFilter: 'blur(60px) saturate(200%)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '30px', padding: '44px 36px',
          boxShadow: '0 0 100px -30px rgba(59,130,246,0.2), 0 40px 80px -30px rgba(0,0,0,0.7)',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: 40, height: 40, borderRadius: '12px',
                background: 'linear-gradient(135deg, #3b82f6, #10b981)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 30px rgba(59,130,246,0.3)',
              }}>
                <BrainCircuit size={20} color="#fff" />
              </div>
              <span style={{ fontSize: '20px', fontWeight: 800, color: '#fff', fontFamily: "'Space Grotesk', sans-serif" }}>HealthCatch</span>
            </div>
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: 800, textAlign: 'center', marginBottom: '4px', fontFamily: "'Space Grotesk', sans-serif" }}>
            {isLoginMode ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginBottom: '28px', fontSize: '13.5px', lineHeight: 1.6 }}>
            {isLoginMode ? 'Sign in to continue your wellness journey.' : 'Join the future of personal health.'}
          </p>

          {authError && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', padding: '11px 16px', borderRadius: '12px', marginBottom: '14px', fontSize: '13px', textAlign: 'center', fontWeight: 500 }}>{authError}</div>
          )}
          {successMsg && (
            <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#86efac', padding: '11px 16px', borderRadius: '12px', marginBottom: '14px', fontSize: '13px', textAlign: 'center', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <CheckCircle size={15} /> {successMsg}
            </div>
          )}

          <form onSubmit={handleAuthSubmit}>
            <AnimatePresence mode="wait">
              {!isLoginMode && (
                <motion.div key="signup" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                  <InputField icon={<User size={17} />} type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <InputField icon={<Calendar size={17} />} type="date" value={dob} onChange={(e) => setDob(e.target.value)} style={{ flex: 1 }} />
                    <div style={{ position: 'relative', flex: 1, marginBottom: '14px' }}>
                      <Users size={17} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(148,163,184,0.5)', zIndex: 1 }} />
                      <select value={gender} onChange={(e) => setGender(e.target.value)} style={{
                        width: '100%', height: '50px', background: 'rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px',
                        color: gender ? '#fff' : 'rgba(148,163,184,0.5)',
                        padding: '0 16px 0 48px', fontSize: '14px', outline: 'none',
                        appearance: 'none', cursor: 'pointer', transition: 'border-color 0.25s',
                        fontFamily: "'Inter', sans-serif",
                      }}
                      onFocus={(e) => e.target.style.borderColor = 'rgba(96,165,250,0.45)'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.06)'}
                      >
                        <option value="" disabled>Gender</option>
                        <option value="male" style={{ background: '#0f172a' }}>Male</option>
                        <option value="female" style={{ background: '#0f172a' }}>Female</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <InputField icon={<Mail size={17} />} type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} />
            <InputField icon={<Lock size={17} />} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />

            <AnimatePresence>
              {!isLoginMode && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                  <InputField icon={<Lock size={17} />} type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </motion.div>
              )}
            </AnimatePresence>

            <button type="submit" disabled={isAuthLoading} style={{
              width: '100%', height: '50px', borderRadius: '14px', border: 'none',
              background: 'linear-gradient(135deg, #3b82f6, #10b981)',
              color: '#fff', fontSize: '14.5px', fontWeight: 700, cursor: 'pointer',
              marginTop: '6px', transition: 'all 0.3s',
              boxShadow: '0 8px 30px -8px rgba(59,130,246,0.35)',
              opacity: isAuthLoading ? 0.6 : 1, fontFamily: "'Inter', sans-serif",
            }}
            onMouseEnter={(e) => { if (!isAuthLoading) { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 14px 40px -8px rgba(59,130,246,0.45)'; } }}
            onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 8px 30px -8px rgba(59,130,246,0.35)'; }}
            >
              {isAuthLoading ? 'Processing...' : (isLoginMode ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '22px 0', gap: '14px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', fontWeight: 500 }}>or</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* Google */}
          <button onClick={handleGoogleLogin} style={{
            width: '100%', height: '48px', borderRadius: '14px',
            background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.06)',
            color: '#fff', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            transition: 'all 0.2s', fontFamily: "'Inter', sans-serif",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.035)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="G" style={{ width: 18, height: 18 }} />
            Continue with Google
          </button>

          {/* Toggle */}
          <p style={{ textAlign: 'center', marginTop: '22px', fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>
            {isLoginMode ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => { setIsLoginMode(!isLoginMode); setAuthError(''); setSuccessMsg(''); }}
              style={{ background: 'none', border: 'none', color: '#60a5fa', fontWeight: 700, cursor: 'pointer', fontSize: '13px', transition: 'color 0.2s', fontFamily: "'Inter', sans-serif" }}
              onMouseEnter={(e) => e.target.style.color = '#93c5fd'}
              onMouseLeave={(e) => e.target.style.color = '#60a5fa'}
            >
              {isLoginMode ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════
   §5  AUTHENTICATED DASHBOARD
   ═══════════════════════════════════════════════════════════════ */
const moodData = [
  { day: 'Mon', score: 4 }, { day: 'Tue', score: 6 }, { day: 'Wed', score: 5 },
  { day: 'Thu', score: 8 }, { day: 'Fri', score: 7 }, { day: 'Sat', score: 9 }, { day: 'Sun', score: 7.2 },
];

function AuthenticatedApp({ onLogout, scrollProgressRef }) {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [messages, setMessages] = useState([{ sender: 'ai', text: "Hello! I'm your HealthCatch AI Counselor. How are you feeling today?" }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Reset scroll progress for dashboard context
  useEffect(() => { scrollProgressRef.current = 0; }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    if (activeTab === 'chat') inputRef.current?.focus();
  }, [messages, isLoading, activeTab]);

  const handleSendMessage = async () => {
    if (!input.trim() && !selectedFile) return;
    const userMessage = { sender: 'user', text: input || (selectedFile ? `Uploaded: ${selectedFile.name}` : '') };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages); setIsLoading(true);

    const formData = new FormData();
    formData.append("message", input);
    if (selectedFile) formData.append("file", selectedFile);
    setInput(''); setSelectedFile(null);

    try {
      const response = await fetch('http://127.0.0.1:8000/chat', { method: 'POST', body: formData });
      const data = await response.json();
      setMessages([...newMessages, { sender: 'ai', text: data.reply }]);
    } catch { setMessages([...newMessages, { sender: 'ai', text: "Sorry, network issue. Please try again." }]); }
    finally { setIsLoading(false); }
  };

  const user = auth.currentUser;
  const userName = user?.displayName || "Wellness User";
  const userPhoto = user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`;

  // All glass panels now use semi-transparent dark tones that let the 3D through
  const panelBg = 'rgba(8, 15, 30, 0.55)';
  const panelBorder = 'rgba(255,255,255,0.06)';
  const textPrimary = '#ffffff';
  const textSecondary = 'rgba(148,163,184,0.7)';
  const inputBg = 'rgba(0,0,0,0.4)';
  const inputBorder = 'rgba(255,255,255,0.07)';

  return (
    <div style={{
      position: 'relative', zIndex: 1,
      display: 'flex', height: '100vh', overflow: 'hidden',
      fontFamily: "'Inter', sans-serif", color: textPrimary,
    }}>

      {/* ── SIDEBAR ── */}
      <motion.div
        initial={{ x: -280 }} animate={{ x: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: '256px', display: 'flex', flexDirection: 'column',
          background: panelBg, backdropFilter: 'blur(50px) saturate(180%)',
          WebkitBackdropFilter: 'blur(50px) saturate(180%)',
          borderRight: `1px solid ${panelBorder}`,
        }}
      >
        <div style={{ padding: '28px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
            <div style={{
              width: 34, height: 34, borderRadius: '10px',
              background: 'linear-gradient(135deg, #3b82f6, #10b981)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(59,130,246,0.25)',
            }}>
              <BrainCircuit size={17} color="#fff" />
            </div>
            <span style={{ fontSize: '17px', fontWeight: 800, color: '#60a5fa', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.01em' }}>HealthCatch</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <SidebarBtn icon={<LayoutDashboard size={17} />} label="Dashboard" tab="dashboard" active={activeTab} set={setActiveTab} isDark={true} />
            <SidebarBtn icon={<MessageSquare size={17} />} label="AI Chatbot" tab="chat" active={activeTab} set={setActiveTab} isDark={true} />
            <SidebarBtn icon={<HeartPulse size={17} />} label="Mood Tracker" tab="mood" active={activeTab} set={setActiveTab} isDark={true} />
            <SidebarBtn icon={<Settings size={17} />} label="Settings" tab="settings" active={activeTab} set={setActiveTab} isDark={true} />
          </div>
        </div>

        <div style={{ marginTop: 'auto', padding: '22px', borderTop: `1px solid ${panelBorder}` }}>
          <button
            onClick={() => signOut(auth).then(onLogout)}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
              padding: '12px 18px', borderRadius: '12px', border: 'none',
              background: 'transparent', color: 'rgba(148,163,184,0.6)',
              fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
              fontFamily: "'Inter', sans-serif",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#f87171'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(148,163,184,0.6)'; }}
          >
            <LogOut size={17} /> Logout
          </button>
        </div>
      </motion.div>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>

        {/* Topbar */}
        <motion.div
          initial={{ y: -80 }} animate={{ y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          style={{
            height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 28px', borderBottom: `1px solid ${panelBorder}`,
            background: panelBg, backdropFilter: 'blur(50px) saturate(180%)',
            WebkitBackdropFilter: 'blur(50px) saturate(180%)',
          }}
        >
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: textSecondary }} />
            <input type="text" placeholder="Search..." style={{
              width: '100%', height: '38px', borderRadius: '11px',
              background: inputBg, border: `1px solid ${inputBorder}`,
              color: textPrimary, padding: '0 14px 0 40px', fontSize: '12.5px',
              outline: 'none', transition: 'all 0.2s', fontFamily: "'Inter', sans-serif",
            }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => setIsDarkMode(!isDarkMode)} style={{
              width: 36, height: 36, borderRadius: '10px', border: 'none',
              background: 'rgba(255,255,255,0.04)', color: '#fbbf24',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
            }}>
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowNotifications(!showNotifications)} style={{
                width: 36, height: 36, borderRadius: '10px', border: 'none',
                background: 'rgba(255,255,255,0.04)', color: textSecondary,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', transition: 'all 0.2s',
              }}>
                <Bell size={16} />
                <span style={{ position: 'absolute', top: 7, right: 7, width: 7, height: 7, background: '#ef4444', borderRadius: '50%' }} />
              </button>
              <AnimatePresence>
                {showNotifications && (
                  <motion.div initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.96 }} transition={{ duration: 0.2 }} style={{
                    position: 'absolute', right: 0, top: '48px', width: '280px', borderRadius: '16px', overflow: 'hidden',
                    background: 'rgba(15,23,42,0.92)', border: `1px solid ${panelBorder}`,
                    backdropFilter: 'blur(40px)', boxShadow: '0 20px 60px -15px rgba(0,0,0,0.6)', zIndex: 50,
                  }}>
                    <div style={{ padding: '14px 18px', borderBottom: `1px solid ${panelBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: '13px' }}>
                      <span>Notifications</span>
                      <span style={{ fontSize: '10px', background: '#3b82f6', color: '#fff', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>New</span>
                    </div>
                    <div style={{ padding: '14px 18px' }}>
                      <p style={{ fontSize: '12.5px', fontWeight: 600 }}>Welcome to HealthCatch!</p>
                      <p style={{ fontSize: '11.5px', color: textSecondary, marginTop: '4px' }}>Your AI wellness journey begins now.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div onClick={() => setActiveTab('profile')} style={{
              width: 36, height: 36, borderRadius: '10px', overflow: 'hidden',
              border: '2px solid rgba(59,130,246,0.4)', cursor: 'pointer',
              boxShadow: '0 0 16px -4px rgba(59,130,246,0.25)',
            }}>
              <img src={userPhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
        </motion.div>

        {/* ── CONTENT ── */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

          {/* DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div style={{ height: '100%', overflowY: 'auto', position: 'absolute', inset: 0, scrollbarWidth: 'none' }}>
              <div style={{ padding: '40px 36px 120px', maxWidth: '1100px', margin: '0 auto' }}>

                {/* Welcome */}
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <Sparkles size={22} color="#3b82f6" />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(96,165,250,0.8)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Dashboard</span>
                  </div>
                  <h2 style={{
                    fontSize: 'clamp(30px, 4vw, 44px)', fontWeight: 900, letterSpacing: '-0.04em',
                    lineHeight: 1.15, marginBottom: '8px', fontFamily: "'Space Grotesk', sans-serif",
                  }}>
                    Welcome back, <span className="text-gradient-hero">{userName.split(' ')[0]}</span>
                  </h2>
                  <p style={{ fontSize: '15px', color: textSecondary, marginBottom: '40px', fontWeight: 300 }}>Your mind. Your journey. Let's explore today.</p>
                </motion.div>

                {/* Stat Cards — entrance animated */}
                <div style={{ display: 'flex', gap: '18px', marginBottom: '28px', flexWrap: 'wrap' }}>
                  <StatCard title="Mood Score" value="7.2" subtitle="/ 10" color="#34d399" panelBg={panelBg} panelBorder={panelBorder} textSecondary={textSecondary} />
                  <StatCard title="Assessments" value="3" subtitle="Completed" color="#60a5fa" panelBg={panelBg} panelBorder={panelBorder} textSecondary={textSecondary} />
                  <StatCard title="AI Sessions" value="12" subtitle="Total chats" color="#a78bfa" panelBg={panelBg} panelBorder={panelBorder} textSecondary={textSecondary} />
                </div>

                {/* Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    padding: '28px', borderRadius: '22px', height: '360px',
                    display: 'flex', flexDirection: 'column',
                    background: panelBg, backdropFilter: 'blur(50px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(50px) saturate(180%)',
                    border: `1px solid ${panelBorder}`,
                  }}
                >
                  <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '20px', fontFamily: "'Space Grotesk', sans-serif" }}>Your Mood Journey</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={moodData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="day" stroke={textSecondary} axisLine={false} tickLine={false} style={{ fontSize: '11px' }} />
                      <YAxis stroke={textSecondary} axisLine={false} tickLine={false} domain={[0, 10]} style={{ fontSize: '11px' }} />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '12px', backdropFilter: 'blur(20px)' }} />
                      <Line type="monotone" dataKey="score" stroke="url(#lineGrad)" strokeWidth={3}
                        dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#020617' }}
                        activeDot={{ r: 7, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} />
                      <defs>
                        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                      </defs>
                    </LineChart>
                  </ResponsiveContainer>
                </motion.div>

                {/* Motivational Quote */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.6, delay: 0.15 }}
                  style={{
                    marginTop: '28px', padding: '32px', borderRadius: '22px',
                    background: panelBg, backdropFilter: 'blur(50px)',
                    WebkitBackdropFilter: 'blur(50px)',
                    border: `1px solid ${panelBorder}`, textAlign: 'center',
                  }}
                >
                  <p style={{ fontSize: '20px', fontWeight: 600, lineHeight: 1.6, fontFamily: "'Space Grotesk', sans-serif", fontStyle: 'italic', color: 'rgba(255,255,255,0.6)' }}>
                    "The greatest wealth is health."
                  </p>
                  <p style={{ fontSize: '13px', color: textSecondary, marginTop: '12px' }}>— Virgil</p>
                </motion.div>
              </div>
            </div>
          )}

          {/* AI CHATBOT */}
          {activeTab === 'chat' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
              style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'absolute', inset: 0 }}
            >
              <div style={{ flex: 1, padding: '28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px', scrollbarWidth: 'none' }}>
                {messages.map((msg, index) => (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.03 }} key={index}
                    style={{
                      display: 'flex', gap: '12px', maxWidth: '70%',
                      alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                      flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row',
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: '11px', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: msg.sender === 'user' ? 'linear-gradient(135deg, #3b82f6, #10b981)' : 'rgba(255,255,255,0.05)',
                      color: msg.sender === 'user' ? '#fff' : textSecondary,
                      border: msg.sender === 'user' ? 'none' : `1px solid ${panelBorder}`,
                    }}>
                      {msg.sender === 'user' ? <User size={15} /> : <Bot size={15} />}
                    </div>
                    <div style={{
                      padding: '13px 18px', borderRadius: '16px',
                      background: msg.sender === 'user' ? 'linear-gradient(135deg, #3b82f6, #10b981)' : panelBg,
                      border: msg.sender === 'user' ? 'none' : `1px solid ${panelBorder}`,
                      color: '#fff',
                      borderTopRightRadius: msg.sender === 'user' ? '4px' : '16px',
                      borderTopLeftRadius: msg.sender === 'user' ? '16px' : '4px',
                      backdropFilter: msg.sender === 'user' ? 'none' : 'blur(30px)',
                      WebkitBackdropFilter: msg.sender === 'user' ? 'none' : 'blur(30px)',
                      boxShadow: msg.sender === 'user' ? '0 4px 20px -6px rgba(59,130,246,0.3)' : 'none',
                    }}>
                      <p style={{ fontSize: '13.5px', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>{msg.text}</p>
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '11px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${panelBorder}` }}>
                      <Bot size={15} style={{ color: textSecondary }} />
                    </div>
                    <div style={{ padding: '13px 22px', borderRadius: '16px', borderTopLeftRadius: '4px', background: panelBg, border: `1px solid ${panelBorder}`, backdropFilter: 'blur(30px)' }}>
                      <Loader2 size={16} color="#3b82f6" style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div style={{ padding: '18px 28px', borderTop: `1px solid ${panelBorder}`, background: panelBg, backdropFilter: 'blur(50px)', WebkitBackdropFilter: 'blur(50px)' }}>
                {selectedFile && (
                  <div style={{
                    maxWidth: '640px', margin: '0 auto 10px', padding: '9px 14px', borderRadius: '12px',
                    background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <span style={{ fontSize: '12px', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '6px' }}><Paperclip size={13} /> {selectedFile.name}</span>
                    <button onClick={() => setSelectedFile(null)} style={{ background: 'none', border: 'none', color: textSecondary, cursor: 'pointer', fontSize: '14px' }}>✕</button>
                  </div>
                )}
                <div style={{
                  maxWidth: '640px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '5px', borderRadius: '16px', background: inputBg, border: `1px solid ${inputBorder}`,
                }}>
                  <input type="file" ref={fileInputRef} onChange={(e) => e.target.files[0] && setSelectedFile(e.target.files[0])} style={{ display: 'none' }} accept=".pdf, image/*" />
                  <button onClick={() => fileInputRef.current.click()} style={{
                    width: 38, height: 38, borderRadius: '10px', border: 'none', background: 'transparent',
                    color: textSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Paperclip size={16} />
                  </button>
                  <input ref={inputRef} type="text" value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Message AI..."
                    style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: textPrimary, fontSize: '13.5px', fontFamily: "'Inter', sans-serif" }}
                  />
                  <button onClick={handleSendMessage} disabled={isLoading || (!input.trim() && !selectedFile)} style={{
                    width: 38, height: 38, borderRadius: '10px', border: 'none',
                    background: 'linear-gradient(135deg, #3b82f6, #10b981)',
                    color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: (isLoading || (!input.trim() && !selectedFile)) ? 0.35 : 1, transition: 'opacity 0.2s',
                    boxShadow: '0 4px 16px -4px rgba(59,130,246,0.3)',
                  }}>
                    <Send size={14} style={{ marginLeft: '1px' }} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Placeholder Pages */}
          {['profile', 'mood', 'settings'].includes(activeTab) && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', position: 'absolute', inset: 0 }}
            >
              <div style={{
                padding: '56px 72px', borderRadius: '28px',
                background: panelBg, backdropFilter: 'blur(50px) saturate(180%)',
                WebkitBackdropFilter: 'blur(50px) saturate(180%)',
                border: `1px solid ${panelBorder}`, textAlign: 'center',
              }}>
                <h2 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '12px', textTransform: 'capitalize', fontFamily: "'Space Grotesk', sans-serif" }}>
                  <span className="text-gradient-hero">{activeTab}</span>
                </h2>
                <p style={{ color: textSecondary, fontSize: '14px' }}>This section is coming soon.</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════
   §6  ROOT APP — GLOBAL 3D + AUTH SWITCHING
   ═══════════════════════════════════════════════════════════════ */
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const scrollProgressRef = useRef(0);

  return (
    <>
      <GlobalStyles />

      {/* 🔴 GLOBAL 3D CANVAS — always visible, persists across auth & dashboard */}
      <Global3DBackground isLoggedIn={isLoggedIn} scrollProgress={scrollProgressRef} />

      {/* UI Layer on top */}
      <AnimatePresence mode="wait">
        {!isLoggedIn ? (
          <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
            <CinematicLanding onLogin={() => setIsLoggedIn(true)} scrollProgressRef={scrollProgressRef} />
          </motion.div>
        ) : (
          <motion.div key="app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <AuthenticatedApp onLogout={() => setIsLoggedIn(false)} scrollProgressRef={scrollProgressRef} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default App;āā