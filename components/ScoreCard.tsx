"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Breakdown {
  codeStructure: number;
  practicalUseDocs: number;
  originality: number;
  maintenance: number;
  signals: Record<string, boolean>;
}

interface AnalysisResult {
  score: number;
  breakdown: Breakdown;
  owner: string;
  repo: string;
  description: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  contributors: number;
  lastPushed: string;
  daysSinceLastPush: number;
  license: string | null;
  topics: string[];
  watchers: number;
  homepage: string | null;
  isForked: boolean;
  languages: Record<string, number>;
  primaryLanguage: string | null;
  weeklyCommits: number;
  hasReleases: boolean;
  latestRelease: string | null;
}

// ── Animated counter ──────────────────────────────────────────────────────────
function useCounter(target: number, duration = 1400) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      setVal(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

// ── Radar chart ───────────────────────────────────────────────────────────────
function RadarChart({ breakdown }: { breakdown: Breakdown }) {
  const cx = 120, cy = 120, maxR = 80;
  const axes = [
    { key: "codeStructure",    max: 35, angle: -Math.PI / 2, label: "Structure",   color: "#3b82f6" }, /* Electric Blue */
    { key: "practicalUseDocs", max: 30, angle: 0,             label: "Docs",        color: "#60a5fa" }, /* Lighter Blue */
    { key: "originality",      max: 20, angle:  Math.PI / 2,  label: "Originality", color: "#eab308" }, /* Gold */
    { key: "maintenance",      max: 15, angle:  Math.PI,      label: "Maintenance", color: "#94a3b8" }, /* Slate */
  ];

  const pts = axes.map((a) => {
    const r = ((breakdown[a.key as keyof Pick<Breakdown,"codeStructure"|"practicalUseDocs"|"originality"|"maintenance">] as number) / a.max) * maxR;
    return { x: cx + r * Math.cos(a.angle), y: cy + r * Math.sin(a.angle), color: a.color };
  });

  const polygon = pts.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg viewBox="0 0 240 240" className="w-full h-full">
      <defs>
        <radialGradient id="rg" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#818cf8" stopOpacity="0.55"/>
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.05"/>
        </radialGradient>
      </defs>
      {/* Grid rings */}
      {[0.25, 0.5, 0.75, 1].map((lvl) => (
        <polygon
          key={lvl}
          points={axes.map((a) => `${cx + lvl * maxR * Math.cos(a.angle)},${cy + lvl * maxR * Math.sin(a.angle)}`).join(" ")}
          fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1"
        />
      ))}
      {/* Axis lines */}
      {axes.map((a) => (
        <line key={a.key} x1={cx} y1={cy}
          x2={cx + maxR * Math.cos(a.angle)}
          y2={cy + maxR * Math.sin(a.angle)}
          stroke="rgba(255,255,255,0.12)" strokeWidth="1"
        />
      ))}
      {/* Data polygon */}
      <polygon points={polygon} fill="url(#rg)" stroke="#818cf8" strokeWidth="2.5" strokeLinejoin="round"/>
      {/* Data dots */}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="5" fill={p.color} stroke="#0f1115" strokeWidth="1.5"/>
      ))}
      {/* Labels */}
      {axes.map((a) => {
        const lr = maxR + 22;
        const lx = cx + lr * Math.cos(a.angle);
        const ly = cy + lr * Math.sin(a.angle);
        return (
          <text key={a.key} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
            fontSize="9.5" fill="#94a3b8" fontFamily="Inter,sans-serif">{a.label}</text>
        );
      })}
    </svg>
  );
}

// ── Particle burst ────────────────────────────────────────────────────────────
function ParticleBurst({ active }: { active: boolean }) {
  if (!active) return null;
  const colors = ["#3b82f6", "#2563eb", "#60a5fa", "#eab308", "#ca8a04", "#cbd5e1"];
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden rounded-2xl">
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i / 16) * 360;
        const dist = 70 + (i % 3) * 25;
        const tx = `${Math.round(Math.cos(angle * Math.PI / 180) * dist)}px`;
        const ty = `${Math.round(Math.sin(angle * Math.PI / 180) * dist)}px`;
        return (
          <div key={i} className="particle"
            style={{
              backgroundColor: colors[i % colors.length],
              "--tx": tx, "--ty": ty,
              animationDelay: `${i * 40}ms`,
              width: `${6 + (i % 3) * 2}px`,
              height: `${6 + (i % 3) * 2}px`,
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
}

// ── 3D tilt card ─────────────────────────────────────────────────────────────
function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: React.MouseEvent) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width  / 2) / (r.width  / 2);
    const y = (e.clientY - r.top  - r.height / 2) / (r.height / 2);
    el.style.transform = `perspective(700px) rotateY(${x*14}deg) rotateX(${-y*14}deg) scale(1.03)`;
  };
  const leave = () => { if (ref.current) ref.current.style.transform = "perspective(700px) rotateY(0) rotateX(0) scale(1)"; };
  return (
    <div ref={ref} onMouseMove={move} onMouseLeave={leave} className={`transition-transform duration-200 ${className}`}
      style={{ transformStyle: "preserve-3d" }}>
      {children}
    </div>
  );
}

// ── Tooltip signal chip ───────────────────────────────────────────────────────
const SIGNAL_TIPS: Record<string, string> = {
  hasTests:       "A test suite (test/, __tests__, jest.config, etc.) shows code reliability.",
  hasCI:          ".github/workflows or similar CI pipeline for automated checks.",
  hasLinting:     "ESLint, Prettier, or similar enforce consistent code style.",
  hasSourceLayout:"Organized src/, lib/, or packages/ directory structure.",
  hasReadme:      "README file helps users understand and use the project.",
  hasDescription: "A clear description explains the project's purpose.",
  hasHomepage:    "A live demo or website proves practical utility.",
  hasTopics:      "Topics & tags improve discoverability and categorisation.",
  hasCommunityFiles: "CONTRIBUTING, CHANGELOG, or CODE_OF_CONDUCT show community focus.",
  isOriginal:     "Original (non-fork) code scores higher for uniqueness.",
  isWidelyForked: "When others fork your repo, it confirms real-world value.",
  issuesManaged:  "Low issues-per-contributor ratio shows the team stays on top of bugs.",
};

function Signal({ id, label, active }: { id: string; label: string; active: boolean }) {
  const tip = SIGNAL_TIPS[id] ?? "";
  return (
    <div className="tooltip-wrap">
      <div className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-sm border cursor-default select-none transition-colors ${
        active
          ? "bg-[#1e293b]/50 border-blue-500/30 text-blue-400 hover:bg-[#1e293b]/70"
          : "bg-white/5 border-white/10 text-slate-500"
      }`}>
        <span className={active ? "text-blue-500" : "text-slate-600"}>{active ? "✓" : "✗"}</span>
        <span className={active ? "" : "line-through"}>{label}</span>
      </div>
      {tip && <div className="tooltip-box">{tip}</div>}
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value }: { icon: string; label: string; value: string | number }) {
  return (
    <TiltCard className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-1 hover:bg-white/10 transition-colors">
      <span className="text-2xl">{icon}</span>
      <span className="text-xl font-bold text-white">{typeof value === "number" ? value.toLocaleString() : value}</span>
      <span className="text-xs text-slate-400 uppercase tracking-wide">{label}</span>
    </TiltCard>
  );
}

// ── Dimension card ────────────────────────────────────────────────────────────
const DIM_META = [
  { key: "codeStructure",    max: 35, icon: "🏗️", label: "Code Structure",    desc: "Tests, CI/CD, linting, src layout", color: "from-blue-700 to-[#0f1115]" },
  { key: "practicalUseDocs", max: 30, icon: "📘", label: "Practical & Docs",   desc: "README, demo, topics, community",   color: "from-slate-700 to-[#0f1115]" },
  { key: "originality",      max: 20, icon: "💡", label: "Originality",         desc: "Not a fork, others forked it",      color: "from-yellow-700 to-[#0f1115]" },
  { key: "maintenance",      max: 15, icon: "🔧", label: "Maintenance",         desc: "Recent commits, issue hygiene",     color: "from-gray-700 to-[#0f1115]" },
];

function DimCard({ meta, value }: { meta: typeof DIM_META[0]; value: number }) {
  const pct = Math.round((value / meta.max) * 100);
  return (
    <TiltCard className={`bg-gradient-to-br ${meta.color} bg-opacity-20 border border-white/10 rounded-xl p-5 flex flex-col gap-3`}>
      <div className="flex items-center justify-between">
        <span className="text-3xl">{meta.icon}</span>
        <span className="text-2xl font-bold text-white">{value}<span className="text-sm text-white/40">/{meta.max}</span></span>
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{meta.label}</p>
        <p className="text-xs text-white/50 mt-0.5">{meta.desc}</p>
      </div>
      <div className="w-full bg-black/30 rounded-full h-1.5">
        <div className="h-1.5 rounded-full bg-white/80 transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
    </TiltCard>
  );
}

// ── Carousel ──────────────────────────────────────────────────────────────────
const SLIDE_LABELS = ["Overview", "Breakdown", "Signals", "Stats"];

function Carousel({ children }: { children: React.ReactNode[] }) {
  const [active, setActive] = useState(0);
  const count = children.length;

  const go = useCallback((next: number) => setActive(Math.max(0, Math.min(count - 1, next))), [count]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(active + 1);
      if (e.key === "ArrowLeft")  go(active - 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [active, go]);

  return (
    <div className="w-full">
      {/* 3D slide area */}
      <div className="carousel-perspective relative overflow-hidden" style={{ minHeight: "420px" }}>
        <div className="relative w-full flex items-start justify-center" style={{ minHeight: "420px" }}>
          {children.map((child, i) => {
            const diff = i - active;
            const abs = Math.abs(diff);
            const visible = abs <= 1;
            return (
              <div
                key={i}
                aria-hidden={i !== active}
                className="absolute w-full transition-all duration-500 ease-in-out"
                style={{
                  transform: `translateX(${diff * 102}%) rotateY(${diff * -38}deg) scale(${diff === 0 ? 1 : 0.82})`,
                  opacity: diff === 0 ? 1 : abs === 1 ? 0.35 : 0,
                  zIndex: diff === 0 ? 10 : 4 - abs,
                  pointerEvents: diff === 0 ? "auto" : visible ? "none" : "none",
                  transformOrigin: diff < 0 ? "right center" : "left center",
                }}
                onClick={() => abs === 1 && go(i)}
              >
                {child}
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <button onClick={() => go(active - 1)} disabled={active === 0}
          className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-white/10 disabled:opacity-20 transition-all">
          ‹
        </button>

        <div className="flex gap-2 items-center">
          {SLIDE_LABELS.map((lbl, i) => (
            <button key={i} onClick={() => go(i)}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-all ${
                i === active ? "opacity-100" : "opacity-35 hover:opacity-60"
              }`}>
              <div className={`h-1 rounded-full transition-all duration-300 ${i === active ? "w-6 bg-indigo-400" : "w-2 bg-white/40"}`} />
              <span className="text-[10px] text-slate-400 hidden sm:block">{lbl}</span>
            </button>
          ))}
        </div>

        <button onClick={() => go(active + 1)} disabled={active === count - 1}
          className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-white/10 disabled:opacity-20 transition-all">
          ›
        </button>
      </div>
    </div>
  );
}

// ── Main ScoreCard ────────────────────────────────────────────────────────────
export default function ScoreCard({ result }: { result: AnalysisResult }) {
  const { score, breakdown, owner, repo } = result;
  const displayScore = useCounter(score);
  const isExcellent = score >= 70;
  const isGood      = score >= 45;

  const ringColor  = isExcellent ? "stroke-blue-500"   : isGood ? "stroke-yellow-500"  : "stroke-slate-500";
  const textColor  = isExcellent ? "text-blue-400"     : isGood ? "text-yellow-400"    : "text-slate-400";
  const glowClass  = isExcellent ? "glow-blue"         : isGood ? "glow-gold"          : "glow-slate";
  const scoreLabel = isExcellent ? "PRODUCTION GRADE"  : isGood ? "SOLID FOUNDATION"   : "NEEDS ENGINEERING";

  const circ  = 2 * Math.PI * 54;
  const offset = circ - (displayScore / 100) * circ;
  const lastPushed = new Date(result.lastPushed).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  // ── Slides ─────────────────────────────────────────────────────────────────
  const slides = [
    /* Slide 0: Overview */
    <div key="overview" className="animate-fadeIn">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
        <ParticleBurst active={isExcellent} />

        {/* Repo title */}
        <div className="mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-white">
              <span className="text-slate-500">{owner} / </span>{repo}
            </h2>
            {result.isForked && <span className="px-1.5 py-0.5 bg-slate-800 text-slate-400 text-[10px] uppercase font-bold tracking-wider rounded-sm border border-slate-700">Fork</span>}
          </div>
          {result.description && <p className="text-slate-400 text-sm mt-2 max-w-md leading-relaxed">{result.description}</p>}
          {result.homepage && (
            <a href={result.homepage} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
              🌐 {result.homepage.replace(/^https?:\/\//, "").slice(0, 48)}
            </a>
          )}
          {result.topics.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {result.topics.slice(0, 5).map((t) => (
                <span key={t} className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-xs rounded-full border border-indigo-500/30">{t}</span>
              ))}
            </div>
          )}
        </div>

        {/* Score + radar side-by-side */}
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Score ring */}
          <div className={`${glowClass} flex-shrink-0 relative`}>
            <svg width="150" height="150" viewBox="0 0 150 150">
              <circle cx="75" cy="75" r="54" fill="none" className="stroke-[#1e293b]" strokeWidth="10"/>
              <circle cx="75" cy="75" r="54" fill="none" strokeWidth="10" strokeLinecap="square"
                strokeDasharray={circ} strokeDashoffset={offset}
                className={`${ringColor} transition-all duration-75`}
                transform="rotate(-90 75 75)"
              />
              <text x="75" y="70" textAnchor="middle" fontSize="34" fontWeight="800" fill="#f8fafc" letterSpacing="-1">{displayScore}</text>
              <text x="75" y="88" textAnchor="middle" fontSize="10" fontWeight="600" fill="#64748b" letterSpacing="1">SCORE</text>
            </svg>
            <p className={`text-center text-[10px] uppercase tracking-[0.15em] font-bold mt-2 ${textColor}`}>{scoreLabel}</p>
          </div>

          {/* Radar chart */}
          <div className="w-48 h-48 flex-shrink-0">
            <RadarChart breakdown={breakdown} />
          </div>

          {/* Quick facts */}
          <div className="flex-1 grid grid-cols-2 gap-2 text-sm w-full">
            {[
              ["⭐", "Stars",    result.stars.toLocaleString()],
              ["🍴", "Forks",    result.forks.toLocaleString()],
              ["👥", "Contribs", result.contributors.toLocaleString()],
              ["📅", "Pushed",   result.daysSinceLastPush === 0 ? "Today" : `${result.daysSinceLastPush}d ago`],
            ].map(([icon, lbl, val]) => (
              <div key={lbl} className="bg-white/5 rounded-lg px-3 py-2">
                <span className="mr-1">{icon}</span>
                <span className="text-slate-400 text-xs">{lbl}: </span>
                <span className="text-white font-semibold">{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,

    /* Slide 1: Breakdown */
    <div key="breakdown" className="animate-fadeIn">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Score Breakdown</h3>
        <div className="grid grid-cols-2 gap-3">
          {DIM_META.map((m) => (
            <DimCard key={m.key} meta={m} value={breakdown[m.key as keyof Pick<Breakdown,"codeStructure"|"practicalUseDocs"|"originality"|"maintenance">] as number} />
          ))}
        </div>
        <p className="text-center text-xs text-slate-600 mt-4">Hover cards for 3D effect · Total: {score}/100</p>
      </div>
    </div>,

    /* Slide 2: Signals */
    <div key="signals" className="animate-fadeIn">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Quality Signals Detected</h3>
        <div className="flex flex-wrap gap-2">
          {([
            ["hasTests",         "Test Suite"],
            ["hasCI",            "CI / CD Pipeline"],
            ["hasLinting",       "Lint / Format Config"],
            ["hasSourceLayout",  "Organised Source Layout"],
            ["hasReadme",        "README"],
            ["hasDescription",   "Meaningful Description"],
            ["hasHomepage",      "Live Demo / Homepage"],
            ["hasTopics",        "Topics & Tags"],
            ["hasCommunityFiles","Community Files"],
            ["isOriginal",       "Original (not a fork)"],
            ["isWidelyForked",   "Forked by Others"],
            ["issuesManaged",    "Issues Well-Managed"],
          ] as [string, string][]).map(([id, label]) => (
            <Signal key={id} id={id} label={label} active={!!breakdown.signals[id]} />
          ))}
        </div>
        <p className="text-xs text-slate-600 mt-4">Hover any chip for details</p>
      </div>
    </div>,

    /* Slide 3: Stats */
    <div key="stats" className="animate-fadeIn">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Repository Stats</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard icon="⭐" label="Stars"          value={result.stars} />
          <StatCard icon="🍴" label="Forks"          value={result.forks} />
          <StatCard icon="👥" label="Contributors"   value={result.contributors} />
          <StatCard icon="🐛" label="Open Issues"    value={result.openIssues} />
          <StatCard icon="📝" label="Weekly Commits" value={result.weeklyCommits > 0 ? `~${result.weeklyCommits}/wk` : "N/A"} />
          <StatCard icon="📅" label="Last Push"      value={lastPushed} />
        </div>

        {/* Language breakdown */}
        {Object.keys(result.languages).length > 0 && (() => {
          const total = Object.values(result.languages).reduce((a, b) => a + b, 0);
          const palette = ["bg-blue-600","bg-slate-500","bg-yellow-600","bg-zinc-600","bg-blue-800","bg-slate-700"];
          const langs = Object.entries(result.languages).slice(0, 6);
          return (
            <div className="mt-5">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Language Distribution</p>
              <div className="flex rounded-sm overflow-hidden h-1.5">
                {langs.map(([lang, bytes], i) => (
                  <div key={lang} title={`${lang} ${Math.round((bytes/total)*100)}%`}
                    className={`${palette[i]} transition-all`} style={{ width: `${(bytes/total)*100}%` }} />
                ))}
              </div>
              <div className="flex flex-wrap gap-3 mt-2">
                {langs.map(([lang, bytes], i) => (
                  <span key={lang} className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                    <span className={`inline-block w-1.5 h-1.5 rounded-sm ${palette[i]}`} />
                    {lang} {Math.round((bytes/total)*100)}%
                  </span>
                ))}
              </div>
            </div>
          );
        })()}

        <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-slate-500 border-t border-white/10 pt-4">
          {result.license      && <span>📜 {result.license}</span>}
          {result.latestRelease && <span>🏷️ {result.latestRelease}</span>}
          <a href={`/result/${owner}/${repo}`} className="text-blue-400 hover:text-blue-300 font-medium transition-colors">🔗 Share Report</a>
          <a href={`https://github.com/${owner}/${repo}`} target="_blank" rel="noopener noreferrer"
            className="ml-auto text-slate-400 hover:text-white font-medium transition-colors">
            Source Code ↗
          </a>
        </div>
      </div>
    </div>,
  ];

  return (
    <div className="animate-fadeInUp w-full max-w-3xl mx-auto mt-8">
      <Carousel>{slides}</Carousel>
    </div>
  );
}
