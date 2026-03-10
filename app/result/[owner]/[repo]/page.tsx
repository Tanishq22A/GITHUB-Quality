import { notFound } from "next/navigation";
import Link from "next/link";
import { analyzeRepo } from "@/lib/analyze";
import type { Metadata } from "next";
import ScoreCard from "@/components/ScoreCard";

interface Props {
  params: Promise<{ owner: string; repo: string }>;
}

// ── Open Graph / Twitter metadata ─────────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { owner, repo } = await params;
  const result = await analyzeRepo(owner, repo);

  if (!result.ok) {
    return { title: `${owner}/${repo} — Quality Analyzer` };
  }

  const { score } = result.data;
  const label = score >= 70 ? "Excellent" : score >= 45 ? "Good" : "Needs Work";
  const title = `${owner}/${repo} — Health Score: ${score}/100 (${label})`;
  const description =
    result.data.description
      ? `${result.data.description} · Scored ${score}/100 on structure, docs, originality & maintenance.`
      : `GitHub project health score: ${score}/100 for ${owner}/${repo}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://github.com/${owner}/${repo}`,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export const revalidate = 600; // ISR: re-generate at most every 10 minutes

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function ResultPage({ params }: Props) {
  const { owner, repo } = await params;
  const result = await analyzeRepo(owner, repo);

  if (!result.ok) {
    if (result.error.type === "not_found") notFound();
    // For other errors, show a minimal message
    return (
      <main className="min-h-screen bg-[#080d1a] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-4xl mb-4">😕</p>
          <h1 className="text-white text-xl font-bold mb-2">Could not load {owner}/{repo}</h1>
          {result.error.type === "rate_limit" && (
            <p className="text-slate-400 text-sm">GitHub rate limit reached. Try again in a few minutes.</p>
          )}
          <Link href="/" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
            Could not load {owner}/{repo}
          </Link>
        </div>
      </main>
    );
  }

  const { data } = result;

  return (
    <main className="min-h-screen bg-[#080d1a] px-4 py-12">
      {/* Ambient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -left-48 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl"/>
        <div className="absolute top-1/2 -right-40  w-96 h-96 bg-purple-600/15 rounded-full blur-3xl"/>
      </div>

      <div className="relative max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
            ← Analyzer
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-sm text-slate-400">{owner} / {repo}</span>
        </div>

        {/* Score card */}
        <ScoreCard result={data} />

        {/* Badge embed snippet */}
        <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Embed Badge in README
          </p>
          <code className="block text-xs text-slate-300 bg-black/30 rounded-lg px-4 py-3 break-all select-all">
            {`![Quality Score](https://YOUR_DOMAIN/api/badge/${owner}/${repo})`}
          </code>
          <p className="text-xs text-slate-600 mt-2">Replace YOUR_DOMAIN with your Vercel deployment URL</p>
        </div>

        {/* Share link */}
        <div className="mt-4 bg-white/5 border border-white/10 rounded-2xl p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Share this Analysis
          </p>
          <code className="block text-xs text-slate-300 bg-black/30 rounded-lg px-4 py-3 break-all select-all">
            {`https://YOUR_DOMAIN/result/${owner}/${repo}`}
          </code>
        </div>
      </div>
    </main>
  );
}
