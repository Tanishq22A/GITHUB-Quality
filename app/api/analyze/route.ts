import { NextRequest, NextResponse } from "next/server";
import { analyzeRepo, parseGitHubUrl } from "@/lib/analyze";

export async function GET(request: NextRequest) {
  const repoUrl = new URL(request.url).searchParams.get("url");
  if (!repoUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid GitHub URL" }, { status: 400 });
  }

  const result = await analyzeRepo(parsed.owner, parsed.repo);

  if (!result.ok) {
    const { error } = result;
    switch (error.type) {
      case "not_found":
        return NextResponse.json({ error: "Repository not found" }, { status: 404 });
      case "unauthorized":
        return NextResponse.json({ error: "Invalid GitHub token. Check your GITHUB_TOKEN env variable." }, { status: 401 });
      case "rate_limit":
        return NextResponse.json(
          { error: `GitHub API rate limit exceeded.${error.resetIn ? ` Resets in ~${error.resetIn} min.` : ""} ${error.hint}` },
          { status: 429 }
        );
      case "http_error":
        return NextResponse.json({ error: `GitHub API error (HTTP ${error.status})` }, { status: 500 });
      default:
        return NextResponse.json({ error: "Network error. Please try again." }, { status: 500 });
    }
  }

  // Cache-Control: cache at CDN/edge for 5 min, stale-while-revalidate 10 min
  return NextResponse.json(result.data, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
}
