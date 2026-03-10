import { NextRequest, NextResponse } from "next/server";
import { analyzeRepo } from "@/lib/analyze";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  const { owner, repo } = await params;
  const result = await analyzeRepo(owner, repo);

  if (!result.ok) {
    // Return a "unknown" grey badge on error
    return badgeSvg(owner, repo, null);
  }

  return badgeSvg(owner, repo, result.data.score);
}

function badgeSvg(owner: string, repo: string, score: number | null) {
  const label = "quality score";
  const value = score !== null ? `${score} / 100` : "unavailable";

  const color =
    score === null       ? "#6b7280"
    : score >= 70        ? "#22c55e"
    : score >= 45        ? "#eab308"
    : /*  < 45 */          "#ef4444";

  const labelW = 100;
  const valueW = 80;
  const totalW = labelW + valueW;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="20" role="img" aria-label="${label}: ${value}">
  <title>${label}: ${value}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r"><rect width="${totalW}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelW}" height="20" fill="#555"/>
    <rect x="${labelW}" width="${valueW}" height="20" fill="${color}"/>
    <rect width="${totalW}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="${labelW / 2}" y="15" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${labelW / 2}" y="14">${label}</text>
    <text x="${labelW + valueW / 2}" y="15" fill="#010101" fill-opacity=".3">${value}</text>
    <text x="${labelW + valueW / 2}" y="14">${value}</text>
  </g>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
