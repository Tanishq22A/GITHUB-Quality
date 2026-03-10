"use client";

import { useState, useEffect, FormEvent } from "react";
import ScoreCard from "@/components/ScoreCard";

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

interface HistoryItem {
  url: string;
  owner: string;
  repo: string;
  score: number;
  ts: number;
}

const STORAGE_KEY = "gqa_history";
const EXAMPLES = [
  "https://github.com/vercel/next.js",
  "https://github.com/facebook/react",
  "https://github.com/microsoft/vscode",
];

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="w-full max-w-3xl mx-auto mt-8 space-y-4 animate-fadeIn">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="skeleton h-6 w-48 rounded-lg" />
        <div className="skeleton h-4 w-72 rounded-lg" />
        <div className="flex gap-6 mt-4">
          <div className="skeleton w-36 h-36 rounded-full flex-shrink-0" />
          <div className="skeleton w-36 h-36 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-8 rounded-lg" />
            <div className="skeleton h-8 rounded-lg" />
            <div className="skeleton h-8 rounded-lg" />
          </div>
        </div>
      </div>
      <div className="flex gap-2 items-center justify-center">
        <div className="skeleton w-8 h-8 rounded-full" />
        <div className="skeleton w-40 h-4 rounded-lg" />
        <div className="skeleton w-8 h-8 rounded-full" />
      </div>
    </div>
  );
}

// ── History strip ─────────────────────────────────────────────────────────────
function HistoryStrip({ history, onSelect }: { history: HistoryItem[]; onSelect: (url: string) => void }) {
  if (!history.length) return null;
  return (
    <div className="mt-5">
      <p className="text-xs text-slate-600 mb-2 uppercase tracking-wide">Recent</p>
      <div className="flex gap-2 flex-wrap">
        {history.map((h) => {
          const isExcellent = h.score >= 70;
          const isGood      = h.score >= 45;
          const color       = isExcellent ? "text-blue-400 border-blue-500/20 bg-blue-500/5"
                            : isGood      ? "text-yellow-400 border-yellow-500/20 bg-yellow-500/5"
                            : "text-slate-400 border-slate-500/20 bg-slate-500/5";
          return (
            <button key={h.ts} onClick={() => onSelect(h.url)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-sm border text-[11px] font-medium transition-all hover:bg-white/5 ${color}`}>
              <span>{h.owner}/{h.repo}</span>
              <span className="font-bold">{h.score}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const [url, setUrl]         = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<AnalysisResult | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setHistory(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const pushHistory = (res: AnalysisResult, repoUrl: string) => {
    const item: HistoryItem = { url: repoUrl, owner: res.owner, repo: res.repo, score: res.score, ts: Date.now() };
    setHistory((prev) => {
      const next = [item, ...prev.filter((h) => h.url !== repoUrl)].slice(0, 6);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  const analyze = async (repoUrl: string) => {
    if (!repoUrl.trim()) return;
    setUrl(repoUrl);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res  = await fetch(`/api/analyze?url=${encodeURIComponent(repoUrl.trim())}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong"); }
      else         { setResult(data); pushHistory(data, repoUrl.trim()); }
    } catch { setError("Network error. Please try again."); }
    finally  { setLoading(false); }
  };

  const handleSubmit = (e: FormEvent) => { e.preventDefault(); analyze(url); };

  return (
    <main className="min-h-screen relative px-4 py-16 overflow-hidden">
      {/* Background geometric accents */}
      <div className="fixed inset-0 pointer-events-none z-[-1]">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-slate-600/10 blur-[100px] rounded-full" />
      </div>

      <div className="relative max-w-3xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#1e293b]/50 border border-slate-700/50 rounded-sm text-slate-400 text-[10px] font-bold tracking-widest uppercase mb-6">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-sm animate-pulse" />
            Powered by GitHub Data
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#f1f5f9] tracking-tight leading-tight">
            Engineering Quality <span className="text-blue-500">Analyzer</span>
          </h1>
          <p className="mt-4 text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
            Enter a public GitHub repository URL to receive an authoritative {" "}
            <strong className="text-white font-semibold">Health Score</strong> evaluating code structure, 
            documentation, originality, and maintenance hygiene.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
              </div>
              <input
                id="repo-url" type="url" value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://github.com/owner/repository"
                required
                className="w-full pl-11 pr-4 py-4 bg-[#1e2430]/60 border border-slate-700/50 rounded-sm text-white placeholder-slate-500
                           focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-[#1e2430]
                           hover:border-slate-600 transition-all text-sm font-medium"
              />
            </div>
            <button
              id="analyze-btn" type="submit" disabled={loading}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700
                         disabled:opacity-50 disabled:cursor-not-allowed
                         text-white text-sm font-bold uppercase tracking-wide rounded-sm transition-all duration-200
                         whitespace-nowrap flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.2)]">
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path  className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Analyzing…
                </>
              ) : "Analyze Repository"}
            </button>
          </div>
        </form>

        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Explore Examples:</span>
          {EXAMPLES.map((ex) => (
            <button key={ex} onClick={() => analyze(ex)}
              className="text-[11px] text-slate-400 hover:text-white transition-colors py-1 px-2 border border-transparent hover:border-slate-700 hover:bg-[#1e2430] rounded-sm">
              {ex.replace("https://github.com/", "")}
            </button>
          ))}
        </div>

        {/* History */}
        <HistoryStrip history={history} onSelect={analyze} />

        {/* Error */}
        {error && (
          <div className="mt-6 animate-fadeInUp p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-start gap-3">
            <span className="text-lg flex-shrink-0">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Skeleton */}
        {loading && <Skeleton />}

        {/* Results */}
        {!loading && result && <ScoreCard result={result} />}

        {/* Empty state */}
        {!loading && !result && !error && (
          <div className="mt-16 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-slate-600 text-sm">Enter a GitHub URL above to analyze a repository</p>
          </div>
        )}

        <footer className="mt-16 text-center text-xs text-slate-700">
          Uses public GitHub API · No auth required · Anonymous rate limit: 60 req/hr
        </footer>
      </div>
    </main>
  );
}
