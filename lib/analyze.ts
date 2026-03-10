// Shared analysis logic — used by API route, badge route, and result page.

import { cacheGet, cacheSet, cacheKey } from "./cache";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Breakdown {
  codeStructure: number;    // /35
  practicalUseDocs: number; // /30
  originality: number;      // /20
  maintenance: number;      // /15
  signals: Record<string, boolean>;
}

export interface AnalysisResult {
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
  // Deeper metrics
  languages: Record<string, number>;   // { TypeScript: 450000, CSS: 12000 }
  primaryLanguage: string | null;
  weeklyCommits: number;               // avg per week last 12 weeks
  hasReleases: boolean;
  latestRelease: string | null;        // tag name, e.g. "v4.2.0"
}

// ── GitHub interfaces ─────────────────────────────────────────────────────────

interface RepoData {
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  pushed_at: string;
  description: string | null;
  license: { name: string } | null;
  topics: string[];
  watchers_count: number;
  homepage: string | null;
  fork: boolean;
  default_branch: string;
}

interface ContributorData { login: string; }
interface ReleaseData     { tag_name: string; }
interface CommitWeek      { total: number; }
interface RootEntry       { name: string; type: "file" | "dir"; }

// ── Helpers ───────────────────────────────────────────────────────────────────

function hasMatch(entries: RootEntry[], names: string[], type?: "file" | "dir") {
  return entries.some(
    (e) => names.some((n) => e.name.toLowerCase() === n.toLowerCase()) && (!type || e.type === type)
  );
}
function hasPartial(entries: RootEntry[], subs: string[]) {
  return entries.some((e) => subs.some((s) => e.name.toLowerCase().includes(s)));
}

// ── Scoring ───────────────────────────────────────────────────────────────────

function computeScore(
  repo: RepoData,
  contributorsCount: number,
  rootEntries: RootEntry[],
  weeklyCommits: number,
  hasReleases: boolean
): Breakdown {
  const signals: Record<string, boolean> = {};
  let codeStructure = 0;
  let practicalUseDocs = 0;
  let originality = 0;
  let maintenance = 0;

  // ── Code Structure (0-35) ─────────────────────────────────────────────────
  signals.hasTests = hasMatch(rootEntries, ["test","tests","__tests__","spec","e2e","cypress"], "dir")
    || hasPartial(rootEntries, ["jest.config","vitest.config","pytest.ini",".mocharc","karma.conf"]);
  if (signals.hasTests) codeStructure += 12;

  signals.hasCI = hasMatch(rootEntries, [".github",".circleci",".travis.yml","Jenkinsfile",".gitlab-ci.yml"]);
  if (signals.hasCI) codeStructure += 10;

  signals.hasLinting = hasPartial(rootEntries, [
    ".eslintrc",".eslint",".prettierrc",".prettier",
    ".editorconfig","pylintrc",".rubocop",".stylelintrc",
    "tsconfig",".flake8","mypy.ini","ruff.toml",
  ]);
  if (signals.hasLinting) codeStructure += 8;

  signals.hasSourceLayout = hasMatch(rootEntries, ["src","lib","packages","modules","core"], "dir");
  if (signals.hasSourceLayout) codeStructure += 5;

  // ── Practical Use & Docs (0-35 after releases bonus) ──────────────────────
  signals.hasReadme = hasPartial(rootEntries, ["readme"]) || !!repo.description;
  if (signals.hasReadme) practicalUseDocs += 8;

  signals.hasDescription = !!repo.description && repo.description.length > 20;
  if (signals.hasDescription) practicalUseDocs += 5;

  signals.hasHomepage = !!repo.homepage && repo.homepage.length > 5;
  if (signals.hasHomepage) practicalUseDocs += 7;

  signals.hasTopics = repo.topics.length >= 2;
  if (signals.hasTopics) practicalUseDocs += 5;

  signals.hasCommunityFiles = hasPartial(rootEntries, ["contributing","changelog","code_of_conduct","security"]);
  if (signals.hasCommunityFiles) practicalUseDocs += 5;

  // +5 for proper versioned releases
  signals.hasReleases = hasReleases;
  if (hasReleases) practicalUseDocs += 5;

  // ── Originality (0-20) ────────────────────────────────────────────────────
  signals.isOriginal = !repo.fork;
  if (signals.isOriginal) originality += 10;

  signals.isWidelyForked = repo.forks_count >= 5;
  originality += Math.round(
    repo.forks_count > 0
      ? Math.min(10, (Math.log10(repo.forks_count + 1) / Math.log10(5001)) * 10)
      : 0
  );

  // ── Maintenance (0-15) ────────────────────────────────────────────────────
  // Use 12-week commit average if available, else fall back to push-date decay
  signals.activelyCommitting = weeklyCommits >= 1;
  if (weeklyCommits > 0) {
    maintenance += Math.min(10, Math.round((Math.log10(weeklyCommits + 1) / Math.log10(51)) * 10));
  } else {
    const daysSince = (Date.now() - new Date(repo.pushed_at).getTime()) / 86400000;
    maintenance += Math.max(0, Math.round(10 - (daysSince / 180) * 10));
  }

  const issuePerContrib = contributorsCount > 0
    ? repo.open_issues_count / contributorsCount
    : repo.open_issues_count;
  signals.issuesManaged = issuePerContrib < 5;
  if (signals.issuesManaged) maintenance += 5;

  const total = Math.round(
    Math.max(0, Math.min(100, codeStructure + practicalUseDocs + originality + maintenance))
  );

  return {
    codeStructure:    Math.min(35, codeStructure),
    practicalUseDocs: Math.min(35, practicalUseDocs), // 35 now (added releases bonus)
    originality:      Math.min(20, originality),
    maintenance:      Math.min(15, maintenance),
    total,
    signals,
  } as Breakdown & { total: number };
}

// ── Main fetch function ───────────────────────────────────────────────────────

export type AnalyzeError =
  | { type: "not_found" }
  | { type: "rate_limit"; resetIn: number | null; hint: string }
  | { type: "unauthorized" }
  | { type: "http_error"; status: number }
  | { type: "network" };

export type AnalyzeResponse =
  | { ok: true;  data: AnalysisResult }
  | { ok: false; error: AnalyzeError };

function makeHeaders(): HeadersInit {
  return {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "github-quality-analyzer",
    ...(process.env.GITHUB_TOKEN
      ? { Authorization: `token ${process.env.GITHUB_TOKEN}` }
      : {}),
  };
}

export async function analyzeRepo(owner: string, repo: string): Promise<AnalyzeResponse> {
  const key = cacheKey(owner, repo);
  const cached = cacheGet<AnalysisResult>(key);
  if (cached) return { ok: true, data: cached };

  const headers = makeHeaders();
  const base = `https://api.github.com/repos/${owner}/${repo}`;

  try {
    const [repoRes, contribRes, rootRes, langRes, releaseRes, commitRes] = await Promise.all([
      fetch(base,                                             { headers }),
      fetch(`${base}/contributors?per_page=1&anon=1`,        { headers }),
      fetch(`${base}/contents/`,                             { headers }),
      fetch(`${base}/languages`,                             { headers }),
      fetch(`${base}/releases?per_page=1`,                   { headers }),
      fetch(`${base}/stats/commit_activity`,                 { headers }),
    ]);

    // Error handling on primary response
    if (repoRes.status === 404) return { ok: false, error: { type: "not_found" } };
    if (repoRes.status === 401) return { ok: false, error: { type: "unauthorized" } };
    const remaining = repoRes.headers.get("x-ratelimit-remaining");
    if (repoRes.status === 403 || remaining === "0") {
      const resetTs = repoRes.headers.get("x-ratelimit-reset");
      const resetIn = resetTs ? Math.ceil((parseInt(resetTs) * 1000 - Date.now()) / 60000) : null;
      const hint = process.env.GITHUB_TOKEN
        ? "(authenticated limit reached)"
        : "Add a GITHUB_TOKEN env variable for 5,000 req/hr.";
      return { ok: false, error: { type: "rate_limit", resetIn, hint } };
    }
    if (!repoRes.ok) return { ok: false, error: { type: "http_error", status: repoRes.status } };

    const repoData: RepoData = await repoRes.json();

    // Contributor count via Link header
    let contributorsCount = 0;
    if (contribRes.ok) {
      const link = contribRes.headers.get("link");
      if (link) {
        const m = link.match(/page=(\d+)>; rel="last"/);
        contributorsCount = m ? parseInt(m[1]) : 1;
      } else {
        const c: ContributorData[] = await contribRes.json();
        contributorsCount = c.length;
      }
    }

    // Root directory listing
    const rootEntries: RootEntry[] = rootRes.ok ? await rootRes.json() : [];

    // Languages
    const languages: Record<string, number> = langRes.ok ? await langRes.json() : {};
    const primaryLanguage = Object.keys(languages)[0] ?? null;

    // Releases
    let hasReleases = false;
    let latestRelease: string | null = null;
    if (releaseRes.ok) {
      const releases: ReleaseData[] = await releaseRes.json();
      hasReleases = releases.length > 0;
      latestRelease = releases[0]?.tag_name ?? null;
    }

    // Commit activity (may return 202 while GitHub computes — handle gracefully)
    let weeklyCommits = 0;
    if (commitRes.ok && commitRes.status === 200) {
      const weeks: CommitWeek[] = await commitRes.json();
      if (Array.isArray(weeks) && weeks.length >= 12) {
        const last12 = weeks.slice(-12);
        weeklyCommits = Math.round(last12.reduce((s, w) => s + w.total, 0) / 12);
      }
    }

    const breakdown = computeScore(repoData, contributorsCount, rootEntries, weeklyCommits, hasReleases);
    const daysSinceLastPush = Math.floor((Date.now() - new Date(repoData.pushed_at).getTime()) / 86400000);

    const result: AnalysisResult = {
      score: (breakdown as Breakdown & { total: number }).total,
      breakdown,
      owner, repo,
      description: repoData.description,
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      openIssues: repoData.open_issues_count,
      contributors: contributorsCount,
      lastPushed: repoData.pushed_at,
      daysSinceLastPush,
      license: repoData.license?.name ?? null,
      topics: repoData.topics ?? [],
      watchers: repoData.watchers_count,
      homepage: repoData.homepage,
      isForked: repoData.fork,
      languages,
      primaryLanguage,
      weeklyCommits,
      hasReleases,
      latestRelease,
    };

    cacheSet(key, result);
    return { ok: true, data: result };
  } catch {
    return { ok: false, error: { type: "network" } };
  }
}

// ── URL parser ────────────────────────────────────────────────────────────────

export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const m = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!m) return null;
  return { owner: m[1], repo: m[2].replace(/\.git$/, "").split("?")[0] };
}
