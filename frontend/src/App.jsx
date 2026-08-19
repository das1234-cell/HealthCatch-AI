import { auth, provider } from './firebase';
import {
  signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  sendEmailVerification, updateProfile, signOut
} from 'firebase/auth';
import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import * as THREE from 'three';
import {
  LayoutDashboard, MessageSquare, HeartPulse, Settings, Send, User, Bot, Loader2,
  LogOut, Search, Sun, Moon, Bell, Paperclip, Mail, Lock,
  Calendar, Users, CheckCircle, BrainCircuit, ChevronDown, Sparkles,
  Stethoscope, Video, ThumbsUp, MessageCircle, Share2, UserPlus, Image as ImageIcon, Camera, Home,
  HelpCircle, ShoppingBag, Target, FolderHeart 
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   §1  GLOBAL STYLES
   ═══════════════════════════════════════════════════════════════ */
const GlobalStyles = ({ isDarkMode }) => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap');
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      background: ${isDarkMode ? '#000000' : '#f8fafc'};
      color: ${isDarkMode ? '#ffffff' : '#0f172a'};
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      transition: background-color 0.5s ease, color 0.5s ease;
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
function DNAHelix({ scrollProgress }) {
  const groupRef = useRef();
  const STRAND_COUNT = 80;
  const HELIX_HEIGHT = 12;
  const HELIX_RADIUS = 1.2;
  const TURNS = 3;

  const { strandA, strandB, rungs } = useMemo(() => {
    const a = [], b = [], r = [];
    for (let i = 0; i < STRAND_COUNT; i++) {
      const t = i / STRAND_COUNT;
      const angle = t * Math.PI * 2 * TURNS;
      const y = (t - 0.5) * HELIX_HEIGHT;

      a.push({ pos: [Math.cos(angle) * HELIX_RADIUS, y, Math.sin(angle) * HELIX_RADIUS], phase: t });
      b.push({ pos: [Math.cos(angle + Math.PI) * HELIX_RADIUS, y, Math.sin(angle + Math.PI) * HELIX_RADIUS], phase: t });

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
      {strandA.map((node, i) => <DNASphere key={`a-${i}`} position={node.pos} phase={node.phase} color="#3b82f6" emissive="#1d4ed8" />)}
      {strandB.map((node, i) => <DNASphere key={`b-${i}`} position={node.pos} phase={node.phase} color="#10b981" emissive="#047857" />)}
      {rungs.map((rung, i) => <DNARung key={`r-${i}`} start={rung.start} end={rung.end} phase={rung.phase} />)}
    </group>
  );
}

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
      <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.5} roughness={0.2} metalness={0.8} transparent opacity={0.9} />
    </mesh>
  );
}

function DNARung({ start, end, phase }) {
  const ref = useRef();
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
      <meshStandardMaterial color="#60a5fa" emissive="#3b82f6" emissiveIntensity={0.3} transparent opacity={0.2} roughness={0.5} />
    </mesh>
  );
}

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
  const linePositions = useMemo(() => new Float32Array(count * count * 6), [count]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const p = particles[i];
      p.pos[0] += p.vel[0] + Math.sin(t * 0.3 + p.phase) * 0.002;
      p.pos[1] += p.vel[1] + Math.cos(t * 0.2 + p.phase) * 0.002;
      p.pos[2] += p.vel[2];

      for (let axis = 0; axis < 3; axis++) {
        const limit = axis < 2 ? 8 : 5;
        if (p.pos[axis] > limit) p.pos[axis] = -limit;
        if (p.pos[axis] < -limit) p.pos[axis] = limit;
      }
      positions[i * 3] = p.pos[0]; positions[i * 3 + 1] = p.pos[1]; positions[i * 3 + 2] = p.pos[2];
    }

    if (pointsRef.current) { pointsRef.current.geometry.attributes.position.needsUpdate = true; }

    let lineIdx = 0; const CONNECTION_DIST = 2.5; const MAX_LINES = 300; let lineCount = 0;
    for (let i = 0; i < count && lineCount < MAX_LINES; i++) {
      for (let j = i + 1; j < count && lineCount < MAX_LINES; j++) {
        const dx = particles[i].pos[0] - particles[j].pos[0], dy = particles[i].pos[1] - particles[j].pos[1], dz = particles[i].pos[2] - particles[j].pos[2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < CONNECTION_DIST) {
          linePositions[lineIdx++] = particles[i].pos[0]; linePositions[lineIdx++] = particles[i].pos[1]; linePositions[lineIdx++] = particles[i].pos[2];
          linePositions[lineIdx++] = particles[j].pos[0]; linePositions[lineIdx++] = particles[j].pos[1]; linePositions[lineIdx++] = particles[j].pos[2];
          lineCount++;
        }
      }
    }
    if (linesRef.current) {
      linesRef.current.geometry.setAttribute('position', new THREE.BufferAttribute(linePositions.slice(0, lineIdx), 3));
      linesRef.current.geometry.attributes.position.needsUpdate = true;
      linesRef.current.geometry.setDrawRange(0, lineCount * 2);
    }
    if (pointsRef.current) pointsRef.current.rotation.y = scrollProgress.current * Math.PI * 0.5;
  });

  return (
    <>
      <points ref={pointsRef}>
        <bufferGeometry><bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} /></bufferGeometry>
        <pointsMaterial size={0.05} color="#60a5fa" transparent opacity={0.5} sizeAttenuation depthWrite={false} />
      </points>
      <lineSegments ref={linesRef}>
        <bufferGeometry><bufferAttribute attach="attributes-position" count={0} array={linePositions} itemSize={3} /></bufferGeometry>
        <lineBasicMaterial color="#60a5fa" transparent opacity={0.06} depthWrite={false} />
      </lineSegments>
    </>
  );
}

function AmbientGlow({ isDarkMode }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.material.opacity = isDarkMode ? 0.04 + Math.sin(t * 0.5) * 0.02 : 0;
    ref.current.scale.setScalar(3 + Math.sin(t * 0.3) * 0.4);
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial color="#3b82f6" transparent opacity={0.04} depthWrite={false} side={THREE.BackSide} />
    </mesh>
  );
}

function CameraRig({ isLoggedIn }) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 0, 14));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    if (isLoggedIn) { targetPos.current.set(6, 2, 12); targetLookAt.current.set(-1, 0, 0); } 
    else { targetPos.current.set(0, 0, 14); targetLookAt.current.set(0, 0, 0); }
  }, [isLoggedIn]);

  useFrame(() => {
    camera.position.lerp(targetPos.current, 0.02);
    const currentLookAt = new THREE.Vector3();
    camera.getWorldDirection(currentLookAt);
    const targetDir = targetLookAt.current.clone().sub(camera.position).normalize();
    currentLookAt.lerp(targetDir, 0.02);
    camera.lookAt(camera.position.x + currentLookAt.x, camera.position.y + currentLookAt.y, camera.position.z + currentLookAt.z);
  });
  return null;
}

function SceneLights({ isDarkMode }) {
  return (
    <>
      <ambientLight intensity={isDarkMode ? 0.08 : 0.6} />
      <directionalLight position={[5, 8, 5]} intensity={0.6} color="#60a5fa" />
      <directionalLight position={[-5, -3, 3]} intensity={0.3} color="#34d399" />
      <pointLight position={[0, 4, 2]} intensity={0.8} color="#3b82f6" distance={15} decay={2} />
      <pointLight position={[-3, -4, 4]} intensity={0.4} color="#10b981" distance={12} decay={2} />
      <pointLight position={[4, 0, -3]} intensity={0.3} color="#8b5cf6" distance={10} decay={2} />
    </>
  );
}

function Global3DBackground({ isLoggedIn, scrollProgress, isDarkMode }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 0, transition: 'background 0.5s ease',
      background: isDarkMode ? 'radial-gradient(ellipse at 50% 40%, #06101f 0%, #000000 70%)' : 'radial-gradient(ellipse at 50% 40%, #e0f2fe 0%, #f8fafc 70%)',
    }}>
      <Canvas camera={{ position: [0, 0, 14], fov: 40 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }} style={{ pointerEvents: 'none' }}>
        <Suspense fallback={null}>
          <SceneLights isDarkMode={isDarkMode} />
          <CameraRig isLoggedIn={isLoggedIn} />
          <DNAHelix scrollProgress={scrollProgress} />
          <NeuralParticles key={isDarkMode ? 'dark' : 'light'} scrollProgress={scrollProgress} count={isDarkMode ? 100 : 50} />
          <AmbientGlow isDarkMode={isDarkMode} />
          <fog attach="fog" args={[isDarkMode ? '#000000' : '#f8fafc', 10, 28]} />
        </Suspense>
      </Canvas>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   §3  REUSABLE UI COMPONENTS
   ═══════════════════════════════════════════════════════════════ */
function InputField({ icon, style, isDark = true, ...props }) {
  const [focused, setFocused] = useState(false);
  const bg = isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)';
  const border = focused ? '#60a5fa' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.1)');
  const textC = isDark ? '#fff' : '#0f172a';
  
  return (
    <div style={{ position: 'relative', marginBottom: '14px', ...style }}>
      <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: focused ? '#60a5fa' : 'rgba(148,163,184,0.5)', transition: 'color 0.25s', zIndex: 1, pointerEvents: 'none' }}>
        {icon}
      </div>
      <input
        {...props}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        style={{ width: '100%', height: '50px', background: bg, border: `1px solid ${border}`, borderRadius: '14px', color: textC, padding: '0 16px 0 48px', fontSize: '14px', outline: 'none', transition: 'all 0.25s', fontFamily: "'Inter', sans-serif", boxShadow: focused ? '0 0 0 3px rgba(59,130,246,0.08)' : 'none' }}
      />
    </div>
  );
}

function SidebarBtn({ icon, label, tab, active, set, isDark }) {
  const isActive = active === tab;
  return (
    <button
      onClick={() => set(tab)}
      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 20px', borderRadius: '14px', border: 'none', width: '100%', background: isActive ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : 'transparent', color: isActive ? '#fff' : (isDark ? 'rgba(148,163,184,0.65)' : 'rgba(71,85,105,0.8)'), fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.25s', textAlign: 'left', fontFamily: "'Inter', sans-serif", boxShadow: isActive ? '0 4px 24px -6px rgba(59,130,246,0.35)' : 'none' }}
      onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'; e.currentTarget.style.color = isDark ? '#fff' : '#000'; } }}
      onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = isDark ? 'rgba(148,163,184,0.65)' : 'rgba(71,85,105,0.8)'; } }}
    >
      {icon} {label}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   §4  CINEMATIC LANDING (Unauthenticated)
   ═══════════════════════════════════════════════════════════════ */
function CinematicLanding({ onLogin, scrollProgressRef }) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [fullName, setFullName] = useState(''); const [dob, setDob] = useState(''); const [gender, setGender] = useState('');
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState(''); const [successMsg, setSuccessMsg] = useState(''); const [isAuthLoading, setIsAuthLoading] = useState(false);

  const { scrollYProgress } = useScroll();
  useMotionValueEvent(scrollYProgress, "change", (v) => { scrollProgressRef.current = v; });

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

  const handleGoogleLogin = async () => { try { setAuthError(''); await signInWithPopup(auth, provider); onLogin(); } catch { setAuthError("Google Login Failed!"); } };

  const handleAuthSubmit = async (e) => {
    e.preventDefault(); setAuthError(''); setSuccessMsg(''); setIsAuthLoading(true);
    try {
      if (isLoginMode) {
        if (!email || !password) throw new Error("Please enter email and password.");
        const cred = await signInWithEmailAndPassword(auth, email, password);
        if (!cred.user.emailVerified) { await signOut(auth); throw new Error("Please verify your email first! Check your inbox."); }
        onLogin();
      } else {
        if (!fullName || !dob || !gender || !email || !password || !confirmPassword) throw new Error("Fill all fields.");
        if (password !== confirmPassword) throw new Error("Passwords do not match!");
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: fullName });
        await sendEmailVerification(cred.user);
        await signOut(auth);
        setSuccessMsg("Account created! Check your email to verify before logging in.");
        setIsLoginMode(true); setPassword(''); setConfirmPassword('');
      }
    } catch (error) { setAuthError(error.message.replace("Firebase: ", "")); } finally { setIsAuthLoading(false); }
  };

  return (
    <div style={{ position: 'relative', zIndex: 1, height: '600vh' }}>
      <motion.div style={{ opacity: s1Opacity, y: s1Y, scale: s1Scale, filter: useTransform(s1Blur, v => `blur(${v}px)`), position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 24px', pointerEvents: 'none' }}>
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginBottom: '36px' }}>
            <div style={{ width: 52, height: 52, borderRadius: '16px', background: 'linear-gradient(135deg, #3b82f6, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 50px rgba(59,130,246,0.35), 0 0 100px rgba(16,185,129,0.15)' }}>
              <BrainCircuit size={26} color="#fff" />
            </div>
            <span style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontFamily: "'Space Grotesk', sans-serif" }}>HealthCatch</span>
          </div>
          <h1 style={{ fontSize: 'clamp(38px, 7.5vw, 88px)', fontWeight: 900, lineHeight: 1.0, letterSpacing: '-0.045em', marginBottom: '28px', fontFamily: "'Space Grotesk', sans-serif", textShadow: '0 0 80px rgba(96,165,250,0.2)' }}>
            <span style={{ color: '#fff' }}>Your Health.</span><br /><span className="text-gradient-hero">Decoded by AI.</span>
          </h1>
          <p style={{ fontSize: 'clamp(15px, 1.8vw, 20px)', color: 'rgba(255,255,255,0.35)', maxWidth: '500px', margin: '0 auto', lineHeight: 1.75, fontWeight: 300 }}>
            Meet the AI-powered wellness companion that listens, understands, and guides your mental & physical health journey.
          </p>
        </motion.div>
        <motion.div animate={{ y: [0, 12, 0] }} transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }} style={{ position: 'absolute', bottom: '56px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.2)' }}>
          <span style={{ fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', fontWeight: 600 }}>Scroll to explore</span><ChevronDown size={18} />
        </motion.div>
      </motion.div>

      <motion.div style={{ opacity: s2Opacity, y: s2Y, filter: useTransform(s2Blur, v => `blur(${v}px)`), position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 24px', pointerEvents: 'none' }}>
        <h2 style={{ fontSize: 'clamp(26px, 4.5vw, 58px)', fontWeight: 800, lineHeight: 1.18, letterSpacing: '-0.03em', maxWidth: '750px', fontFamily: "'Space Grotesk', sans-serif", textShadow: '0 0 60px rgba(96,165,250,0.15)' }}>Every heartbeat tells a story.<br />We help you <span className="text-gradient-warm">understand it.</span></h2>
      </motion.div>

      <motion.div style={{ opacity: s3Opacity, y: s3Y, filter: useTransform(s3Blur, v => `blur(${v}px)`), position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', pointerEvents: 'none' }}>
        <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 44px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '48px', textAlign: 'center', fontFamily: "'Space Grotesk', sans-serif" }}>Powered by <span className="text-gradient-cool">intelligence.</span></h2>
      </motion.div>

      <motion.div style={{ opacity: s4Opacity, y: s4Y, scale: s4Scale, position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', pointerEvents: 'auto' }}>
        <div style={{ width: '100%', maxWidth: '460px', background: 'rgba(8, 15, 30, 0.6)', backdropFilter: 'blur(60px) saturate(200%)', WebkitBackdropFilter: 'blur(60px) saturate(200%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '30px', padding: '44px 36px', boxShadow: '0 0 100px -30px rgba(59,130,246,0.2), 0 40px 80px -30px rgba(0,0,0,0.7)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'linear-gradient(135deg, #3b82f6, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(59,130,246,0.3)' }}><BrainCircuit size={20} color="#fff" /></div>
              <span style={{ fontSize: '20px', fontWeight: 800, color: '#fff', fontFamily: "'Space Grotesk', sans-serif" }}>HealthCatch</span>
            </div>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, textAlign: 'center', marginBottom: '4px', fontFamily: "'Space Grotesk', sans-serif", color: '#fff' }}>{isLoginMode ? 'Welcome Back' : 'Create Account'}</h2>
          
          {authError && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', padding: '11px 16px', borderRadius: '12px', marginBottom: '14px', fontSize: '13px', textAlign: 'center' }}>{authError}</div>}
          {successMsg && <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#86efac', padding: '11px 16px', borderRadius: '12px', marginBottom: '14px', fontSize: '13px', textAlign: 'center' }}><CheckCircle size={15} style={{display:'inline', verticalAlign:'middle'}}/> {successMsg}</div>}

          <form onSubmit={handleAuthSubmit} style={{marginTop: '20px'}}>
            <AnimatePresence mode="wait">
              {!isLoginMode && (
                <motion.div key="signup" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                  <InputField icon={<User size={17} />} type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} isDark={true} />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <InputField icon={<Calendar size={17} />} type="date" value={dob} onChange={(e) => setDob(e.target.value)} style={{ flex: 1 }} isDark={true} />
                    <div style={{ position: 'relative', flex: 1, marginBottom: '14px' }}>
                      <Users size={17} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(148,163,184,0.5)', zIndex: 1 }} />
                      <select value={gender} onChange={(e) => setGender(e.target.value)} style={{ width: '100%', height: '50px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', color: gender ? '#fff' : 'rgba(148,163,184,0.5)', padding: '0 16px 0 48px', fontSize: '14px', outline: 'none', appearance: 'none', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                        <option value="" disabled>Gender</option>
                        <option value="male" style={{ background: '#0f172a' }}>Male</option>
                        <option value="female" style={{ background: '#0f172a' }}>Female</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <InputField icon={<Mail size={17} />} type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} isDark={true} />
            <InputField icon={<Lock size={17} />} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} isDark={true} />
            <AnimatePresence>
              {!isLoginMode && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                  <InputField icon={<Lock size={17} />} type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} isDark={true} />
                </motion.div>
              )}
            </AnimatePresence>
            <button type="submit" disabled={isAuthLoading} style={{ width: '100%', height: '50px', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg, #3b82f6, #10b981)', color: '#fff', fontSize: '14.5px', fontWeight: 700, cursor: 'pointer', marginTop: '6px', transition: 'all 0.3s' }}>
              {isAuthLoading ? 'Processing...' : (isLoginMode ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', margin: '22px 0', gap: '14px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', fontWeight: 500 }}>or</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
          </div>

          <button onClick={handleGoogleLogin} style={{ width: '100%', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.06)', color: '#fff', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="G" style={{ width: 18, height: 18 }} /> Continue with Google
          </button>
          <p style={{ textAlign: 'center', marginTop: '22px', fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>
            {isLoginMode ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => { setIsLoginMode(!isLoginMode); setAuthError(''); setSuccessMsg(''); }} style={{ background: 'none', border: 'none', color: '#60a5fa', fontWeight: 700, cursor: 'pointer' }}>
              {isLoginMode ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   §5  AUTHENTICATED SUPER-APP DASHBOARD
   ═══════════════════════════════════════════════════════════════ */
const MOCK_POSTS = [
  { id: 1, name: 'Dr. Sarah Jenkins', time: '2 hours ago', text: 'Daily reminder: 30 minutes of brisk walking can reduce anxiety by 40%. Keep moving! 🚶‍♀️💪', likes: 124, comments: 18 },
  { id: 2, name: 'Rahul Sharma', time: '5 hours ago', text: 'Just completed my first 5K run! Never thought I could do it. Thanks to the community for the support. 🏅', img: 'https://images.unsplash.com/photo-1552674605-15c2145eba11?auto=format&fit=crop&w=600&q=80', likes: 342, comments: 56 }
];

const MOCK_DOCTORS = [
  { id: 1, name: 'Dr. Amit Patel', spec: 'Cardiologist', rating: '4.9/5', available: 'Available Now' },
  { id: 2, name: 'Dr. Sneha Roy', spec: 'Clinical Psychologist', rating: '5.0/5', available: 'Next Slot: 2:00 PM' }
];

function AuthenticatedApp({ onLogout, scrollProgressRef, isDarkMode, setIsDarkMode }) {
  const [activeTab, setActiveTab] = useState('home'); 
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [messages, setMessages] = useState([{ sender: 'ai', text: "Hello! I'm your HealthCatch AI Counselor. How are you feeling today?" }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const profilePicRef = useRef(null);
  const dropdownRef = useRef(null); // <--- Added Ref for Click Outside Logic

  useEffect(() => { scrollProgressRef.current = 0; }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isLoading, activeTab]);

  // Global Click Listener to close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
  const userEmail = user?.email || "No email provided"; 
  const userPhoto = user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`;

  const panelBg = isDarkMode ? 'rgba(8, 15, 30, 0.55)' : 'rgba(255, 255, 255, 0.7)';
  const panelBorder = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.1)';
  const textPrimary = isDarkMode ? '#ffffff' : '#0f172a';
  const textSecondary = isDarkMode ? 'rgba(148,163,184,0.7)' : 'rgba(71,85,105,0.7)';
  const inputBg = isDarkMode ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.5)';
  const inputBorder = isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.1)';

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  };

  return (
    <div style={{ position: 'relative', zIndex: 1, display: 'flex', height: '100vh', overflow: 'hidden', color: textPrimary }}>
      {/* ── SIDEBAR ── */}
      <motion.div initial={{ x: -280 }} animate={{ x: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} style={{ width: '256px', display: 'flex', flexDirection: 'column', background: panelBg, backdropFilter: 'blur(50px)', borderRight: `1px solid ${panelBorder}` }}>
        <div style={{ padding: '28px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <div style={{ width: 34, height: 34, borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BrainCircuit size={17} color="#fff" />
            </div>
            <span style={{ fontSize: '17px', fontWeight: 800, color: '#60a5fa', fontFamily: "'Space Grotesk', sans-serif" }}>HealthCatch</span>
          </div>

          <div style={{ background: isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)', borderRadius: '16px', padding: '16px', marginBottom: '24px', border: `1px solid ${panelBorder}`, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', border: '3px solid #3b82f6', marginBottom: '10px' }}>
               <img src={userPhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: textPrimary }}>{userName}</h3>
            <p style={{ fontSize: '11px', color: textSecondary, marginTop: '2px', padding: '0 4px' }}>Aspiring Wellness Journey</p>
            <div style={{ width: '100%', height: '1px', background: panelBorder, margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '12px' }}>
              <span style={{ color: textSecondary }}>Connections</span>
              <span style={{ color: '#3b82f6', fontWeight: 600 }}>42</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <SidebarBtn icon={<LayoutDashboard size={17} />} label="Dashboard" tab="dashboard" active={activeTab} set={setActiveTab} isDark={isDarkMode} />
            <SidebarBtn icon={<Stethoscope size={17} />} label="Consult Doctors" tab="doctors" active={activeTab} set={setActiveTab} isDark={isDarkMode} />
            <SidebarBtn icon={<MessageSquare size={17} />} label="AI Chatbot" tab="chat" active={activeTab} set={setActiveTab} isDark={isDarkMode} />
          </div>
        </div>
      </motion.div>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Topbar with HIGHER Z-INDEX */}
        <motion.div initial={{ y: -80 }} animate={{ y: 0 }} transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }} style={{ height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', borderBottom: `1px solid ${panelBorder}`, background: panelBg, backdropFilter: 'blur(50px)', position: 'relative', zIndex: 50 }}>
          
          {/* Left: Search Bar */}
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: textSecondary }} />
            <input type="text" placeholder="Search..." style={{ width: '100%', height: '38px', borderRadius: '11px', background: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary, padding: '0 14px 0 40px', outline: 'none' }} />
          </div>

          {/* Center: Top Navigation Icons */}
          <div style={{ display: 'flex', justifyContent: 'center', flex: 1, gap: '15px' }}>
            <button title="Home" onClick={() => setActiveTab('home')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: activeTab === 'home' ? '#3b82f6' : textSecondary, borderBottom: activeTab === 'home' ? '3px solid #3b82f6' : '3px solid transparent', padding: '10px 30px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
              <Home size={26} />
            </button>
            <button title="Health Circle" onClick={() => setActiveTab('network')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: activeTab === 'network' ? '#3b82f6' : textSecondary, borderBottom: activeTab === 'network' ? '3px solid #3b82f6' : '3px solid transparent', padding: '10px 30px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
              <Users size={26} />
            </button>
            <button title="Health Market" onClick={() => setActiveTab('market')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: activeTab === 'market' ? '#3b82f6' : textSecondary, borderBottom: activeTab === 'market' ? '3px solid #3b82f6' : '3px solid transparent', padding: '10px 30px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
              <ShoppingBag size={26} />
            </button>
            <button title="Challenges" onClick={() => setActiveTab('challenges')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: activeTab === 'challenges' ? '#3b82f6' : textSecondary, borderBottom: activeTab === 'challenges' ? '3px solid #3b82f6' : '3px solid transparent', padding: '10px 30px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
              <Target size={26} />
            </button>
            <button title="Medical Vault" onClick={() => setActiveTab('vault')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: activeTab === 'vault' ? '#3b82f6' : textSecondary, borderBottom: activeTab === 'vault' ? '3px solid #3b82f6' : '3px solid transparent', padding: '10px 30px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
              <FolderHeart size={26} />
            </button>
          </div>

          {/* Right: Icons & Profile Menu with REF for Click Outside */}
          <div ref={dropdownRef} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button title="Messaging" onClick={() => setActiveTab('messaging')} style={{ width: 36, height: 36, borderRadius: '10px', background: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', color: textSecondary, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
              <MessageCircle size={16} />
            </button>

            <div style={{ position: 'relative' }}>
              <button 
                title="Notifications" 
                onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); }} 
                style={{ width: 36, height: 36, borderRadius: '10px', background: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', color: textSecondary, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
              >
                <Bell size={16} /><span style={{ position: 'absolute', top: 7, right: 7, width: 7, height: 7, background: '#ef4444', borderRadius: '50%' }} />
              </button>
              <AnimatePresence>
                {showNotifications && (
                  <motion.div initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.96 }} style={{ position: 'absolute', right: 0, top: '48px', width: '280px', borderRadius: '16px', background: isDarkMode ? 'rgba(15,23,42,0.92)' : 'rgba(255,255,255,0.95)', border: `1px solid ${panelBorder}`, backdropFilter: 'blur(40px)', zIndex: 100, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 18px', borderBottom: `1px solid ${panelBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: '13px' }}>
                      <span>Notifications</span><span style={{ fontSize: '10px', background: '#3b82f6', color: '#fff', padding: '2px 8px', borderRadius: '20px' }}>New</span>
                    </div>
                    <div style={{ padding: '14px 18px' }}>
                      <p style={{ fontSize: '12.5px', fontWeight: 600 }}>Welcome to HealthCatch!</p>
                      <p style={{ fontSize: '11.5px', color: textSecondary, marginTop: '4px' }}>Your AI wellness journey begins now.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div style={{ position: 'relative' }}>
              <div 
                onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }} 
                style={{ width: 36, height: 36, borderRadius: '10px', overflow: 'hidden', border: '2px solid rgba(59,130,246,0.4)', cursor: 'pointer' }}
              >
                <img src={userPhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>

              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.96 }} style={{ position: 'absolute', right: 0, top: '48px', width: '280px', borderRadius: '16px', background: isDarkMode ? 'rgba(15,23,42,0.92)' : 'rgba(255,255,255,0.95)', border: `1px solid ${panelBorder}`, backdropFilter: 'blur(40px)', zIndex: 100, overflow: 'hidden', boxShadow: '0 20px 60px -15px rgba(0,0,0,0.6)' }}>
                    <div style={{ padding: '16px', borderBottom: `1px solid ${panelBorder}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <img src={userPhoto} alt="Profile" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                        <div>
                          <p style={{ fontWeight: 700, fontSize: '15px' }}>{userName}</p>
                          <p style={{ fontSize: '12px', color: textSecondary }}>Aspiring Wellness</p>
                        </div>
                      </div>
                      <button onClick={() => { setActiveTab('profile'); setShowProfileMenu(false); }} style={{ width: '100%', padding: '6px 0', borderRadius: '20px', border: `1px solid #3b82f6`, background: 'transparent', color: '#3b82f6', fontWeight: 600, fontSize: '13px', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={(e)=>e.currentTarget.style.background='rgba(59,130,246,0.1)'} onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}>
                        View Profile
                      </button>
                    </div>
                    <div style={{ padding: '8px' }}>
                      <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: 'transparent', border: 'none', color: textPrimary, cursor: 'pointer', borderRadius: '8px', fontSize: '14px', fontWeight: 500 }} onMouseEnter={(e)=>e.currentTarget.style.background=isDarkMode?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.05)'} onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}>
                        <Settings size={18} color={textSecondary} /> Settings & Privacy
                      </button>
                      <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: 'transparent', border: 'none', color: textPrimary, cursor: 'pointer', borderRadius: '8px', fontSize: '14px', fontWeight: 500 }} onMouseEnter={(e)=>e.currentTarget.style.background=isDarkMode?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.05)'} onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}>
                        <HelpCircle size={18} color={textSecondary} /> Help & Support
                      </button>
                      <button onClick={() => setIsDarkMode(!isDarkMode)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'transparent', border: 'none', color: textPrimary, cursor: 'pointer', borderRadius: '8px', fontSize: '14px', fontWeight: 500 }} onMouseEnter={(e)=>e.currentTarget.style.background=isDarkMode?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.05)'} onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                           {isDarkMode ? <Moon size={18} color={textSecondary} /> : <Sun size={18} color={textSecondary} />} 
                           Display & Accessibility
                        </div>
                      </button>
                      <button onClick={() => signOut(auth).then(onLogout)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: 'transparent', border: 'none', color: textPrimary, cursor: 'pointer', borderRadius: '8px', fontSize: '14px', fontWeight: 500 }} onMouseEnter={(e)=>e.currentTarget.style.background=isDarkMode?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.05)'} onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}>
                        <LogOut size={18} color={textSecondary} /> Log Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Dynamic Pages Area */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <AnimatePresence mode="wait">
            
            {/* DASHBOARD */}
            {activeTab === 'dashboard' && (
              <motion.div key="dashboard" variants={pageVariants} initial="initial" animate="animate" exit="exit" style={{ height: '100%', overflowY: 'auto', position: 'absolute', inset: 0, padding: '40px 36px 120px' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <Sparkles size={22} color="#3b82f6" />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#3b82f6', textTransform: 'uppercase' }}>Dashboard</span>
                  </div>
                  <h2 style={{ fontSize: 'clamp(30px, 4vw, 44px)', fontWeight: 900, marginBottom: '8px', fontFamily: "'Space Grotesk', sans-serif" }}>Welcome back, <span className="text-gradient-hero">{userName.split(' ')[0]}</span></h2>
                  <p style={{ fontSize: '15px', color: textSecondary, marginBottom: '40px' }}>Your mind. Your journey. Let's explore today.</p>

                  <div style={{ display: 'flex', gap: '18px', marginBottom: '28px', flexWrap: 'wrap' }}>
                    <motion.div style={{ flex: '1 1 220px', padding: '28px 24px', borderRadius: '22px', background: panelBg, backdropFilter: 'blur(40px)', border: `1px solid ${panelBorder}` }}>
                      <h3 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: textSecondary, marginBottom: '14px' }}>Mood Score</h3>
                      <p style={{ fontSize: '38px', fontWeight: 900, color: '#34d399', fontFamily: "'Space Grotesk', sans-serif" }}>7.2 <span style={{ fontSize: '14px', color: textSecondary }}>/ 10</span></p>
                    </motion.div>
                    <motion.div style={{ flex: '1 1 220px', padding: '28px 24px', borderRadius: '22px', background: panelBg, backdropFilter: 'blur(40px)', border: `1px solid ${panelBorder}` }}>
                      <h3 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: textSecondary, marginBottom: '14px' }}>Assessments</h3>
                      <p style={{ fontSize: '38px', fontWeight: 900, color: '#60a5fa', fontFamily: "'Space Grotesk', sans-serif" }}>3 <span style={{ fontSize: '14px', color: textSecondary }}>Completed</span></p>
                    </motion.div>
                    <motion.div style={{ flex: '1 1 220px', padding: '28px 24px', borderRadius: '22px', background: panelBg, backdropFilter: 'blur(40px)', border: `1px solid ${panelBorder}` }}>
                      <h3 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: textSecondary, marginBottom: '14px' }}>Community</h3>
                      <p style={{ fontSize: '38px', fontWeight: 900, color: '#a78bfa', fontFamily: "'Space Grotesk', sans-serif" }}>12 <span style={{ fontSize: '14px', color: textSecondary }}>Posts</span></p>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* HOME / SOCIAL FEED */}
            {activeTab === 'home' && (
              <motion.div key="home" variants={pageVariants} initial="initial" animate="animate" exit="exit" style={{ height: '100%', overflowY: 'auto', position: 'absolute', inset: 0, padding: '40px 36px 120px' }}>
                <div style={{ maxWidth: '680px', margin: '0 auto' }}>
                  <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '24px', fontFamily: "'Space Grotesk', sans-serif" }}>Home Feed</h2>
                  
                  <div style={{ background: panelBg, padding: '24px', borderRadius: '24px', border: `1px solid ${panelBorder}`, marginBottom: '30px', backdropFilter: 'blur(40px)' }}>
                    <div style={{ display: 'flex', gap: '15px' }}>
                      <img src={userPhoto} alt="User" style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid #3b82f6' }} />
                      <input type="text" placeholder="Share your health journey, tips or ask a question..." style={{ flex: 1, background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: '20px', padding: '0 20px', color: textPrimary, outline: 'none' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingLeft: '60px' }}>
                      <button style={{ background: 'none', border: 'none', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 600 }}><ImageIcon size={18} /> Photo/Video</button>
                      <button style={{ background: '#3b82f6', border: 'none', color: '#fff', padding: '10px 24px', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }}>Post</button>
                    </div>
                  </div>

                  {MOCK_POSTS.map(post => (
                    <div key={post.id} style={{ background: panelBg, padding: '24px', borderRadius: '24px', border: `1px solid ${panelBorder}`, marginBottom: '24px', backdropFilter: 'blur(40px)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>{post.name.charAt(0)}</div>
                          <div>
                            <p style={{ fontWeight: 700, fontSize: '15px' }}>{post.name}</p>
                            <p style={{ fontSize: '12.5px', color: textSecondary }}>{post.time}</p>
                          </div>
                        </div>
                        <button style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: 'none', padding: '8px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, cursor: 'pointer' }}><UserPlus size={16} /> Follow</button>
                      </div>
                      <p style={{ lineHeight: 1.6, marginBottom: '16px', fontSize: '15px' }}>{post.text}</p>
                      {post.img && <img src={post.img} alt="Post" style={{ width: '100%', borderRadius: '16px', marginBottom: '16px' }} />}
                      <div style={{ display: 'flex', gap: '24px', borderTop: `1px solid ${panelBorder}`, paddingTop: '16px', color: textSecondary }}>
                        <button style={{ background: 'none', border: 'none', color: textSecondary, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 500 }}><ThumbsUp size={18} /> {post.likes}</button>
                        <button style={{ background: 'none', border: 'none', color: textSecondary, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 500 }}><MessageCircle size={18} /> {post.comments}</button>
                        <button style={{ background: 'none', border: 'none', color: textSecondary, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 500 }}><Share2 size={18} /> Share</button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* HEALTH CIRCLE (FRIENDS / CONNECTIONS FEED) */}
            {activeTab === 'network' && (
              <motion.div key="network" variants={pageVariants} initial="initial" animate="animate" exit="exit" style={{ height: '100%', overflowY: 'auto', position: 'absolute', inset: 0, padding: '30px' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                  
                  <div style={{ width: '280px', flexShrink: 0, background: panelBg, borderRadius: '24px', padding: '24px', border: `1px solid ${panelBorder}`, height: 'fit-content', backdropFilter: 'blur(40px)' }}>
                    <h3 style={{ fontSize: '22px', fontWeight: 900, marginBottom: '20px', fontFamily: "'Space Grotesk', sans-serif" }}>Health Circle</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {['Friend requests', 'Suggestions', 'All friends', 'Connections', 'Following & followers', 'Groups', 'Events', 'Doctors Section', 'Patients Section'].map((item, i) => (
                        <button key={i} style={{ background: i === 0 ? 'rgba(59,130,246,0.1)' : 'transparent', border: 'none', color: i === 0 ? '#3b82f6' : textPrimary, padding: '12px 16px', borderRadius: '12px', textAlign: 'left', fontWeight: i === 0 ? 700 : 500, cursor: 'pointer', transition: 'background 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          {item} {i === 0 && <span style={{ background: '#3b82f6', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>3</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ background: panelBg, borderRadius: '24px', padding: '30px', border: `1px solid ${panelBorder}`, backdropFilter: 'blur(40px)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 800 }}>People you may know / Requests</h2>
                        <span style={{ color: '#3b82f6', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>See all</span>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                        {[
                          { id: 1, name: 'Samyajit Khan', role: 'CSE Student', extra: '3 mutual friends', type: 'request' },
                          { id: 2, name: 'Ankita Halder', role: 'Health Enthusiast', extra: 'Followed by 2K', type: 'request' },
                          { id: 3, name: 'Dr. Radha Krishna', role: 'Cardiologist', extra: '15 connections', type: 'suggest' },
                          { id: 4, name: 'Soumabrata M.', role: 'Business Analyst', extra: 'Open to connect', type: 'suggest' },
                        ].map(person => (
                          <div key={person.id} style={{ background: isDarkMode ? 'rgba(0,0,0,0.4)' : '#ffffff', borderRadius: '16px', overflow: 'hidden', border: `1px solid ${panelBorder}`, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ height: '80px', background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)' }}></div>
                            <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                              <div style={{ width: 70, height: 70, borderRadius: '50%', border: `4px solid ${isDarkMode ? '#0f172a' : '#fff'}`, background: '#cbd5e1', margin: '-35px auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${person.name}`} alt={person.name} style={{ width: '100%', height: '100%' }} />
                              </div>
                              <h4 style={{ fontSize: '16px', fontWeight: 700, textAlign: 'center', marginBottom: '4px' }}>{person.name}</h4>
                              <p style={{ fontSize: '12px', color: textSecondary, textAlign: 'center', marginBottom: '6px', fontWeight: 500 }}>{person.role}</p>
                              <p style={{ fontSize: '11px', color: textSecondary, textAlign: 'center', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                <Users size={12} /> {person.extra}
                              </p>
                              
                              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {person.type === 'request' ? (
                                  <>
                                    <button style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', transition: '0.2s' }}>Confirm</button>
                                    <button style={{ background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', color: textPrimary, border: 'none', padding: '10px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', transition: '0.2s' }}>Delete</button>
                                  </>
                                ) : (
                                  <button style={{ background: 'transparent', color: '#3b82f6', border: '2px solid #3b82f6', padding: '8px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', transition: '0.2s' }}>Connect</button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* DOCTORS & APPOINTMENTS */}
            {activeTab === 'doctors' && (
              <motion.div key="doctors" variants={pageVariants} initial="initial" animate="animate" exit="exit" style={{ height: '100%', overflowY: 'auto', position: 'absolute', inset: 0, padding: '40px 36px 120px' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                  <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '24px', fontFamily: "'Space Grotesk', sans-serif" }}>Consult Top Specialists</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                    {MOCK_DOCTORS.map(doc => (
                      <div key={doc.id} style={{ background: panelBg, padding: '28px', borderRadius: '24px', border: `1px solid ${panelBorder}`, backdropFilter: 'blur(40px)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '20px', fontWeight: 'bold' }}>{doc.name.charAt(4)}</div>
                          <div>
                            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{doc.name}</h3>
                            <p style={{ color: '#60a5fa', fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>{doc.spec}</p>
                            <p style={{ color: '#fbbf24', fontSize: '13.5px', marginTop: '4px', fontWeight: 600 }}>⭐ {doc.rating}</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <button style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: `1px solid rgba(59,130,246,0.3)`, padding: '14px', borderRadius: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <Calendar size={18} /> Book Appointment
                          </button>
                          <button style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', padding: '14px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 15px rgba(16,185,129,0.3)' }}>
                            <Video size={18} /> Join Video Call
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* AI CHATBOT */}
            {activeTab === 'chat' && (
              <motion.div key="chat" variants={pageVariants} initial="initial" animate="animate" exit="exit" style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'absolute', inset: 0 }}>
                <div style={{ flex: 1, padding: '28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px', scrollbarWidth: 'none' }}>
                  {messages.map((msg, index) => (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={index} style={{ display: 'flex', gap: '12px', maxWidth: '70%', alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '11px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: msg.sender === 'user' ? 'linear-gradient(135deg, #3b82f6, #10b981)' : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'), color: msg.sender === 'user' ? '#fff' : textSecondary, border: msg.sender === 'user' ? 'none' : `1px solid ${panelBorder}` }}>
                        {msg.sender === 'user' ? <User size={15} /> : <Bot size={15} />}
                      </div>
                      <div style={{ padding: '14px 18px', borderRadius: '16px', background: msg.sender === 'user' ? 'linear-gradient(135deg, #3b82f6, #10b981)' : panelBg, border: msg.sender === 'user' ? 'none' : `1px solid ${panelBorder}`, color: msg.sender === 'user' ? '#fff' : textPrimary, borderTopRightRadius: msg.sender === 'user' ? '4px' : '16px', borderTopLeftRadius: msg.sender === 'user' ? '16px' : '4px', backdropFilter: msg.sender === 'user' ? 'none' : 'blur(30px)' }}>
                        <p style={{ fontSize: '14px', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>{msg.text}</p>
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '11px', background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${panelBorder}` }}><Bot size={15} style={{ color: textSecondary }} /></div>
                      <div style={{ padding: '14px 22px', borderRadius: '16px', borderTopLeftRadius: '4px', background: panelBg, border: `1px solid ${panelBorder}`, backdropFilter: 'blur(30px)' }}>
                        <Loader2 size={16} color="#3b82f6" style={{ animation: 'spin 1s linear infinite' }} />
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div style={{ padding: '18px 28px', borderTop: `1px solid ${panelBorder}`, background: panelBg, backdropFilter: 'blur(50px)' }}>
                  {selectedFile && (
                    <div style={{ maxWidth: '700px', margin: '0 auto 10px', padding: '10px 16px', borderRadius: '14px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}><Paperclip size={14} /> {selectedFile.name}</span>
                      <button onClick={() => setSelectedFile(null)} style={{ background: 'none', border: 'none', color: textSecondary, cursor: 'pointer', fontSize: '14px' }}>✕</button>
                    </div>
                  )}
                  <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '10px', padding: '6px', borderRadius: '18px', background: inputBg, border: `1px solid ${inputBorder}` }}>
                    <input type="file" ref={fileInputRef} onChange={(e) => e.target.files[0] && setSelectedFile(e.target.files[0])} style={{ display: 'none' }} accept=".pdf, image/*" />
                    <button onClick={() => fileInputRef.current.click()} style={{ width: 42, height: 42, borderRadius: '12px', border: 'none', background: 'transparent', color: textSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Paperclip size={18} /></button>
                    <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Message HealthCatch AI..." style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: textPrimary, fontSize: '14.5px', fontFamily: "'Inter', sans-serif" }} />
                    <button onClick={handleSendMessage} disabled={isLoading || (!input.trim() && !selectedFile)} style={{ width: 42, height: 42, borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #3b82f6, #10b981)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (isLoading || (!input.trim() && !selectedFile)) ? 0.4 : 1, transition: 'opacity 0.2s', boxShadow: '0 4px 16px -4px rgba(59,130,246,0.4)' }}><Send size={16} style={{ marginLeft: '2px' }} /></button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* FULL PROFILE PAGE */}
            {activeTab === 'profile' && (
              <motion.div key="profile" variants={pageVariants} initial="initial" animate="animate" exit="exit" style={{ padding: '40px', display: 'flex', alignItems: 'center', justifyItems: 'center', height: '100%', position: 'absolute', inset: 0, overflowY: 'auto' }}>
                <div style={{ margin: 'auto', width: '100%', maxWidth: '800px', padding: '48px', borderRadius: '32px', background: panelBg, backdropFilter: 'blur(50px)', border: `1px solid ${panelBorder}` }}>
                  <h2 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '40px', fontFamily: "'Space Grotesk', sans-serif" }}>My Profile</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                      <div style={{ position: 'relative', width: 100, height: 100, borderRadius: '50%', overflow: 'hidden', border: '4px solid rgba(59,130,246,0.3)', cursor: 'pointer' }} onClick={() => profilePicRef.current.click()}>
                        <img src={userPhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }} onMouseEnter={(e)=>e.currentTarget.style.opacity=1} onMouseLeave={(e)=>e.currentTarget.style.opacity=0}><Camera color="#fff" /></div>
                        <input type="file" ref={profilePicRef} className="hidden" accept="image/*" />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '24px', fontWeight: 700 }}>{userName}</h3>
                        <p style={{ color: textSecondary, fontSize: '14px', marginTop: '4px' }}>{userEmail}</p>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: textSecondary }}>Phone Number</label>
                        <input type="text" placeholder="+91 98765 43210" style={{ width: '100%', marginTop: '8px', padding: '14px 16px', background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: '12px', color: textPrimary, outline: 'none' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: textSecondary }}>Blood Group</label>
                        <select style={{ width: '100%', marginTop: '8px', padding: '14px 16px', background: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary, borderRadius: '12px', outline: 'none', appearance: 'none' }}>
                          <option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>O+</option><option>O-</option><option>AB+</option><option>AB-</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: 600, color: textSecondary }}>Medical Bio / Allergies</label>
                      <textarea rows="4" placeholder="Briefly describe your health goals or any past medical history..." style={{ width: '100%', marginTop: '8px', padding: '16px', background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: '12px', color: textPrimary, outline: 'none', resize: 'vertical' }}></textarea>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                      <button style={{ padding: '14px 24px', borderRadius: '12px', background: 'transparent', border: `1px solid ${panelBorder}`, color: textPrimary, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                      <button style={{ padding: '14px 32px', borderRadius: '12px', background: '#3b82f6', border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 15px rgba(59,130,246,0.3)' }}>Save Changes</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Other Placeholders */}
            {['market', 'challenges', 'vault', 'messaging'].includes(activeTab) && (
              <motion.div key={activeTab} variants={pageVariants} initial="initial" animate="animate" exit="exit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', position: 'absolute', inset: 0 }}>
                <div style={{ padding: '56px 72px', borderRadius: '28px', background: panelBg, backdropFilter: 'blur(50px)', border: `1px solid ${panelBorder}`, textAlign: 'center' }}>
                  <h2 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '12px', textTransform: 'capitalize', fontFamily: "'Space Grotesk', sans-serif" }}><span className="text-gradient-hero">{activeTab}</span></h2>
                  <p style={{ color: textSecondary, fontSize: '14px' }}>This section is coming soon.</p>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   §6  ROOT APP
   ═══════════════════════════════════════════════════════════════ */
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const scrollProgressRef = useRef(0);

  return (
    <>
      <GlobalStyles isDarkMode={isDarkMode} />
      <Global3DBackground isLoggedIn={isLoggedIn} scrollProgress={scrollProgressRef} isDarkMode={isDarkMode} />

      <AnimatePresence mode="wait">
        {!isLoggedIn ? (
          <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
            <CinematicLanding onLogin={() => setIsLoggedIn(true)} scrollProgressRef={scrollProgressRef} />
          </motion.div>
        ) : (
          <motion.div key="app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
            <AuthenticatedApp onLogout={() => setIsLoggedIn(false)} scrollProgressRef={scrollProgressRef} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default App;