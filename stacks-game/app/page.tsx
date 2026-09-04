'use client';

import {
  Bell,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Coins,
  Gauge,
  HelpCircle,
  History,
  Home,
  Menu,
  Music,
  Play,
  RotateCcw,
  Settings,
  ShieldCheck,
  Trophy,
  Volume2,
  Wallet,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const modeCards = [
  { name: 'Classic', range: '1x-5x', tone: 'cyan', copy: 'Steady stack growth with clean cash-out points.' },
  { name: 'Bonus', range: '2x-10x', tone: 'violet', copy: 'Bonus blocks can boost the climb mid-round.' },
  { name: 'High Stage', range: '5x-25x', tone: 'rose', copy: 'Sharper pacing and bigger cash-out tension.' },
  { name: 'Jackpot', range: '25x+', tone: 'amber', copy: 'Rare top-stack run with the highest upside.' },
];

const historyRows = [
  { id: 'R-2049', result: 'Cash out', multiplier: '3.42x', value: '+342.00' },
  { id: 'R-2048', result: 'Bonus hit', multiplier: '7.28x', value: '+728.00' },
  { id: 'R-2047', result: 'Broke', multiplier: '0.73x', value: '-100.00' },
  { id: 'R-2046', result: 'Cash out', multiplier: '2.31x', value: '+231.00' },
];

function StackScene() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(4.8, 4.2, 7.2);
    camera.lookAt(0, 1.35, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const ambient = new THREE.AmbientLight(0x75cfff, 1.1);
    scene.add(ambient);

    const key = new THREE.PointLight(0x20d9ff, 16, 18);
    key.position.set(-3, 5, 5);
    scene.add(key);

    const rim = new THREE.PointLight(0xbf45ff, 18, 18);
    rim.position.set(3.5, 3.5, 2);
    scene.add(rim);

    const gold = new THREE.PointLight(0xffc24a, 10, 13);
    gold.position.set(0, 4.6, 1.5);
    scene.add(gold);

    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    const edgeGeometry = new THREE.EdgesGeometry(cubeGeometry);
    const cyanMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0ccfff,
      emissive: 0x075f91,
      emissiveIntensity: 0.8,
      metalness: 0.05,
      roughness: 0.18,
      transmission: 0.35,
      transparent: true,
      opacity: 0.72,
    });
    const violetMaterial = cyanMaterial.clone();
    violetMaterial.color.set(0x7b3cff);
    violetMaterial.emissive.set(0x35128e);
    const amberMaterial = cyanMaterial.clone();
    amberMaterial.color.set(0xffbf32);
    amberMaterial.emissive.set(0x9a5f00);
    amberMaterial.opacity = 0.84;

    const edgeMaterials = [
      new THREE.LineBasicMaterial({ color: 0x81f1ff, transparent: true, opacity: 0.78 }),
      new THREE.LineBasicMaterial({ color: 0xd47cff, transparent: true, opacity: 0.7 }),
      new THREE.LineBasicMaterial({ color: 0xffdf7a, transparent: true, opacity: 0.82 }),
    ];

    const positions = [
      [-1.65, 0, 0],
      [-0.55, 0, 0],
      [0.55, 0, 0],
      [1.65, 0, 0],
      [-1.1, 1.03, 0],
      [0, 1.03, 0],
      [1.1, 1.03, 0],
      [-0.55, 2.06, 0],
      [0.55, 2.06, 0],
      [0, 3.09, 0],
    ];

    positions.forEach((position, index) => {
      const material = index === 9 ? amberMaterial : index % 3 === 1 ? violetMaterial : cyanMaterial;
      const mesh = new THREE.Mesh(cubeGeometry, material);
      mesh.position.set(position[0], position[1], position[2]);
      mesh.rotation.y = index % 2 ? 0.08 : -0.08;
      group.add(mesh);

      const edges = new THREE.LineSegments(edgeGeometry, edgeMaterials[index === 9 ? 2 : index % 3 === 1 ? 1 : 0]);
      edges.position.copy(mesh.position);
      edges.rotation.copy(mesh.rotation);
      group.add(edges);
    });

    const platformGeometry = new THREE.CylinderGeometry(3.5, 3.8, 0.32, 96);
    const platformMaterial = new THREE.MeshStandardMaterial({
      color: 0x061527,
      emissive: 0x062f56,
      emissiveIntensity: 0.4,
      metalness: 0.4,
      roughness: 0.35,
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = -0.7;
    group.add(platform);

    const ringGeometry = new THREE.TorusGeometry(3.85, 0.035, 12, 128);
    const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x26dbff, transparent: true, opacity: 0.85 });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.5;
    group.add(ring);

    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 120;
    const vertices = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i += 1) {
      vertices[i * 3] = (Math.random() - 0.5) * 10;
      vertices[i * 3 + 1] = Math.random() * 7 - 1;
      vertices[i * 3 + 2] = (Math.random() - 0.5) * 7;
    }
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    const particles = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({ color: 0x56dcff, size: 0.035, transparent: true, opacity: 0.55 }),
    );
    scene.add(particles);

    const clock = new THREE.Clock();
    const animate = () => {
      const elapsed = clock.getElapsedTime();
      group.rotation.y = Math.sin(elapsed * 0.35) * 0.18;
      group.position.y = Math.sin(elapsed * 0.8) * 0.08;
      ring.rotation.z = elapsed * 0.25;
      particles.rotation.y = elapsed * 0.035;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };

    let frame = requestAnimationFrame(animate);

    const resize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };

    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      renderer.dispose();
      cubeGeometry.dispose();
      edgeGeometry.dispose();
      platformGeometry.dispose();
      ringGeometry.dispose();
      particleGeometry.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} aria-label="Animated 3D stack preview" className="absolute inset-0" />;
}

export default function HomePage() {
  const [soundOn, setSoundOn] = useState(true);
  const [musicOn, setMusicOn] = useState(true);
  const [turboOn, setTurboOn] = useState(false);
  const [autoCashout, setAutoCashout] = useState(true);

  return (
    <main className="min-h-screen overflow-hidden bg-[#020713] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_22%_12%,rgba(39,208,255,0.18),transparent_28%),radial-gradient(circle_at_80%_18%,rgba(166,80,255,0.18),transparent_24%),linear-gradient(180deg,#04101f_0%,#020713_58%,#01040a_100%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-[1500px] flex-col px-5 py-4">
        <header className="grid h-16 grid-cols-[auto_1fr_auto] items-center gap-5 border-b border-cyan-300/15">
          <div className="flex items-center gap-3">
            <button aria-label="Open menu" className="grid h-11 w-11 place-items-center rounded-md border border-cyan-300/20 bg-slate-950/70 text-cyan-100 shadow-[0_0_24px_rgba(28,196,255,0.08)]">
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-md bg-cyan-400/15 shadow-[0_0_28px_rgba(34,211,238,0.35)]">
                <div className="grid grid-cols-2 gap-0.5">
                  <span className="h-3.5 w-3.5 rounded-[3px] bg-cyan-300" />
                  <span className="mt-2 h-3.5 w-3.5 rounded-[3px] bg-violet-400" />
                  <span className="-mt-2 ml-2 h-3.5 w-3.5 rounded-[3px] bg-blue-500" />
                </div>
              </div>
              <strong className="text-3xl font-black tracking-normal text-white">STACKS</strong>
            </div>
          </div>

          <nav aria-label="Main navigation" className="flex items-center justify-center gap-1">
            {[
              ['Home', Home],
              ['Games', Play],
              ['Fairness', ShieldCheck],
              ['Leaderboard', Trophy],
              ['Rewards', Zap],
              ['Help', HelpCircle],
            ].map(([label, Icon]) => (
              <button
                key={label as string}
                className={`flex h-10 items-center gap-2 rounded-md px-4 text-sm font-semibold transition ${label === 'Home' ? 'bg-cyan-400/12 text-cyan-200 shadow-[inset_0_-2px_0_#22d3ee]' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
              >
                <Icon size={17} />
                {label as string}
              </button>
            ))}
          </nav>

          <div className="flex items-center justify-end gap-3">
            <button className="flex h-11 items-center gap-2 rounded-md border border-cyan-300/20 bg-slate-950/75 px-4 text-sm font-semibold text-slate-200">
              <Wallet size={18} className="text-cyan-300" />
              Demo Balance
              <span className="text-white">12,450</span>
              <ChevronDown size={16} />
            </button>
            <button className="h-11 rounded-md border border-cyan-300/35 px-5 text-sm font-bold text-cyan-100">Play Demo</button>
            <button className="h-11 rounded-md bg-emerald-400 px-6 text-sm font-black text-slate-950 shadow-[0_0_30px_rgba(52,211,153,0.28)]">Start Stacking</button>
          </div>
        </header>

        <section className="grid flex-1 grid-cols-[280px_minmax(520px,1fr)_330px] gap-4 py-4">
          <aside className="flex min-h-0 flex-col gap-4">
            <section className="rounded-lg border border-cyan-300/15 bg-slate-950/72 p-4 shadow-[0_0_38px_rgba(15,23,42,0.45)] backdrop-blur">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase text-cyan-300">Mode</p>
                  <h2 className="text-xl font-black">Classic Stack</h2>
                </div>
                <Gauge className="text-emerald-300" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {modeCards.map((mode) => (
                  <button
                    key={mode.name}
                    className={`rounded-md border p-3 text-left transition hover:-translate-y-0.5 ${
                      mode.tone === 'cyan'
                        ? 'border-cyan-300/40 bg-cyan-400/10'
                        : mode.tone === 'violet'
                          ? 'border-violet-300/35 bg-violet-500/10'
                          : mode.tone === 'rose'
                            ? 'border-rose-300/35 bg-rose-500/10'
                            : 'border-amber-300/40 bg-amber-400/10'
                    }`}
                  >
                    <p className="text-sm font-black">{mode.name}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">{mode.range}</p>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-cyan-300/15 bg-slate-950/72 p-4 backdrop-blur">
              <div className="mb-4 flex items-center gap-2">
                <Settings size={18} className="text-cyan-300" />
                <h2 className="text-lg font-black">Play Settings</h2>
              </div>
              <div className="space-y-3">
                <ToggleRow label="Sound" icon={<Volume2 size={17} />} enabled={soundOn} onClick={() => setSoundOn(!soundOn)} />
                <ToggleRow label="Music" icon={<Music size={17} />} enabled={musicOn} onClick={() => setMusicOn(!musicOn)} />
                <ToggleRow label="Turbo" icon={<Zap size={17} />} enabled={turboOn} onClick={() => setTurboOn(!turboOn)} />
                <ToggleRow label="Auto cashout" icon={<RotateCcw size={17} />} enabled={autoCashout} onClick={() => setAutoCashout(!autoCashout)} />
              </div>
            </section>

            <section className="rounded-lg border border-rose-300/20 bg-rose-950/18 p-4">
              <p className="text-sm font-black text-rose-200">Play Smart</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">Session limit: 30 min. Loss reminder: 500. Autoplay requires stop limits.</p>
            </section>
          </aside>

          <section className="relative min-h-[720px] overflow-hidden rounded-lg border border-cyan-300/15 bg-[#06111f]/80 shadow-[0_0_60px_rgba(34,211,238,0.08)]">
            <StackScene />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,7,19,0.25),transparent_34%,rgba(2,7,19,0.72)_100%)]" />
            <div className="relative z-10 flex h-full flex-col justify-between p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.28em] text-cyan-300">Live Demo Round</p>
                  <h1 className="mt-3 max-w-xl text-6xl font-black leading-[1.02] tracking-normal">
                    Build Higher.
                    <span className="block bg-gradient-to-r from-cyan-200 via-blue-300 to-violet-300 bg-clip-text text-transparent">Cash Out Smarter.</span>
                  </h1>
                </div>
                <div className="rounded-lg border border-emerald-300/25 bg-emerald-400/10 px-4 py-3 text-right">
                  <p className="text-xs font-bold uppercase text-emerald-300">Current Win</p>
                  <p className="text-3xl font-black text-emerald-300">342.00</p>
                </div>
              </div>

              <div className="mx-auto mb-8 w-full max-w-3xl rounded-lg border border-cyan-300/15 bg-slate-950/76 p-5 backdrop-blur">
                <div className="mb-4 grid grid-cols-5 gap-2">
                  {['1.05x', '2.31x', '3.42x', '7.28x', '25x+'].map((step) => (
                    <div key={step} className={`rounded-md border px-3 py-2 text-center text-sm font-black ${step === '3.42x' ? 'border-cyan-300 bg-cyan-400/16 text-cyan-100' : 'border-white/10 bg-white/5 text-slate-400'}`}>
                      {step}
                    </div>
                  ))}
                </div>
                <div className="flex items-end justify-between gap-5">
                  <div>
                    <p className="text-sm font-bold uppercase text-violet-200">Mid Stage</p>
                    <p className="mt-1 text-7xl font-black leading-none text-cyan-100 drop-shadow-[0_0_22px_rgba(34,211,238,0.4)]">3.42x</p>
                  </div>
                  <div className="min-w-72">
                    <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-400">
                      <span>1x</span>
                      <span>5x</span>
                      <span>25x+</span>
                    </div>
                    <div className="h-3 rounded-full bg-slate-800">
                      <div className="h-full w-[46%] rounded-full bg-gradient-to-r from-cyan-300 to-violet-400 shadow-[0_0_18px_rgba(34,211,238,0.55)]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className="flex min-h-0 flex-col gap-4">
            <section className="rounded-lg border border-cyan-300/15 bg-slate-950/76 p-4 backdrop-blur">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-black">Play Bar</h2>
                <span className="rounded-full bg-emerald-400/12 px-3 py-1 text-xs font-bold text-emerald-300">Ready</span>
              </div>
              <div className="space-y-4">
                <ControlBox label="Bet Amount" value="100" icon={<CircleDollarSign size={18} />} />
                <ControlBox label="Auto Cashout" value="5.00x" icon={<Clock3 size={18} />} />
                <ControlBox label="Risk" value="Medium" icon={<Gauge size={18} />} />
                <button className="h-16 w-full rounded-md bg-emerald-400 text-xl font-black text-slate-950 shadow-[0_0_34px_rgba(52,211,153,0.28)]">Start Stack</button>
              </div>
            </section>

            <section className="rounded-lg border border-cyan-300/15 bg-slate-950/76 p-4 backdrop-blur">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-black">Round History</h2>
                <History size={18} className="text-cyan-300" />
              </div>
              <div className="space-y-2">
                {historyRows.map((row) => (
                  <div key={row.id} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-md border border-white/8 bg-white/[0.035] p-3">
                    <div>
                      <p className="text-sm font-bold text-white">{row.result}</p>
                      <p className="text-xs text-slate-500">{row.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-cyan-200">{row.multiplier}</p>
                      <p className={`text-xs font-bold ${row.value.startsWith('+') ? 'text-emerald-300' : 'text-rose-300'}`}>{row.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid grid-cols-2 gap-2">
              <UtilityButton icon={<ShieldCheck size={19} />} label="Fairness" />
              <UtilityButton icon={<History size={19} />} label="History" />
              <UtilityButton icon={<Bell size={19} />} label="Alerts" />
              <UtilityButton icon={<Coins size={19} />} label="Wallet" />
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}

function ToggleRow({ label, icon, enabled, onClick }: { label: string; icon: React.ReactNode; enabled: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex h-11 w-full items-center justify-between rounded-md border border-white/8 bg-white/[0.035] px-3 text-sm font-semibold">
      <span className="flex items-center gap-2 text-slate-200">
        <span className="text-cyan-300">{icon}</span>
        {label}
      </span>
      <span className={`h-6 w-11 rounded-full p-1 transition ${enabled ? 'bg-emerald-400' : 'bg-slate-700'}`}>
        <span className={`block h-4 w-4 rounded-full bg-white transition ${enabled ? 'translate-x-5' : ''}`} />
      </span>
    </button>
  );
}

function ControlBox({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.035] p-3">
      <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase text-slate-400">
        <span>{label}</span>
        <span className="text-cyan-300">{icon}</span>
      </div>
      <div className="grid grid-cols-[42px_1fr_42px] items-center gap-2">
        <button className="h-10 rounded-md border border-white/10 bg-slate-900 text-xl font-black">-</button>
        <div className="h-10 rounded-md border border-cyan-300/20 bg-slate-950 px-3 text-center text-2xl font-black leading-10 text-white">{value}</div>
        <button className="h-10 rounded-md border border-white/10 bg-slate-900 text-xl font-black">+</button>
      </div>
    </div>
  );
}

function UtilityButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex h-14 items-center justify-center gap-2 rounded-md border border-cyan-300/15 bg-slate-950/72 text-sm font-bold text-slate-200 hover:border-cyan-300/35 hover:text-cyan-100">
      <span className="text-cyan-300">{icon}</span>
      {label}
    </button>
  );
}
