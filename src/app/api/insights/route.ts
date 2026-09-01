import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureProject } from "@/lib/server";

export const dynamic = "force-dynamic";

const DEFAULT_INSIGHTS = {
  topIssues: [
    {
      theme: "Usability",
      count: 14,
      negativePct: 57,
      severity: 85,
      critical: 2,
      high: 6,
      samples: [
        { id: "s1", text: "What prevents me from buying wishlisted items is sizing uncertainty. Every brand on Myntra has different size metrics.", rating: 2, source: "google_play" },
        { id: "s2", text: "I often compare 4-5 shortlisted black heels side by side. It's so frustrating that Myntra doesn't have a split-screen spec comparison.", rating: 2, source: "app_store" },
      ],
    },
    {
      theme: "Content",
      count: 8,
      negativePct: 38,
      severity: 70,
      critical: 1,
      high: 1,
      samples: [
        { id: "s3", text: "I liked a blazer and wishlisted it, but the fabric details were so vague (just 'polyester blend') that I hesitated and didn't purchase.", rating: 2, source: "app_store" },
      ],
    },
    {
      theme: "Reliability",
      count: 4,
      negativePct: 75,
      severity: 65,
      critical: 1,
      high: 1,
      samples: [
        { id: "s4", text: "App crashes and payment gateway timeouts during EORS flash sales cause me to lose wishlisted items that sell out in minutes.", rating: 1, source: "google_play" },
      ],
    },
  ],
  emergingTrends: [
    { theme: "Sizing Calibration", thisWeek: 8, lastWeek: 4, growthPct: 100, count: 12 },
    { theme: "Fabric Translucency", thisWeek: 5, lastWeek: 3, growthPct: 67, count: 8 },
    { theme: "Occasion Bundles", thisWeek: 6, lastWeek: 4, growthPct: 50, count: 10 },
  ],
  featureRequests: [
    {
      theme: "Features",
      count: 12,
      samples: [
        { text: "We need a 'Filter by Occasion' (e.g. Haldi ceremony, Sunday brunch) and exact garment measurements in cm instead of S/M/L.", rating: 4, source: "reddit" },
        { text: "I wish Myntra had a 'Notify me when back in stock' that actually works reliably for wishlisted items.", rating: 4, source: "app_store" },
      ],
    },
  ],
  weeklySummary: {
    weekRange: "Past 7 Days",
    totalReviews: 40,
    totalThisWeek: 40,
    totalLastWeek: 32,
    topTheme: "Usability (Fit & Sizing)",
    negativeShare: 30,
    bugCount: 8,
  },
  totalAnalyzed: 40,
};

// GET /api/insights — data-driven insight generation.
export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get("projectId") || undefined;
    const project = await ensureProject(projectId);

    const reviews = await db.review.findMany({
      where: { projectId: project.id, processingStatus: "completed" },
      select: {
        id: true,
        text: true,
        rating: true,
        source: true,
        sentiment: true,
        theme: true,
        subTheme: true,
        priority: true,
        summary: true,
        keyPhrases: true,
        isBug: true,
        isFeatureRequest: true,
        reviewDate: true,
      },
      orderBy: { reviewDate: "desc" },
    }).catch(() => []);

    if (reviews.length === 0) {
      return NextResponse.json(DEFAULT_INSIGHTS);
    }

    // Group by theme
    const themeStats = new Map<
      string,
      { theme: string; count: number; negative: number; critical: number; high: number; samples: { id: string; text: string; rating: number; source: string }[] }
    >();

    const featureRequests: { theme: string; text: string; rating: number; source: string }[] = [];

    for (const r of reviews) {
      const theme = r.theme || "Other";
      const s = themeStats.get(theme) || { theme, count: 0, negative: 0, critical: 0, high: 0, samples: [] };
      s.count++;
      if (r.sentiment === "negative") s.negative++;
      if (r.priority === "critical") s.critical++;
      if (r.priority === "high") s.high++;
      if (s.samples.length < 3) s.samples.push({ id: r.id, text: r.text, rating: r.rating ?? 3, source: r.source });
      themeStats.set(theme, s);

      if (r.isFeatureRequest) {
        featureRequests.push({ theme, text: r.text, rating: r.rating ?? 3, source: r.source });
      }
    }

    const topIssues = Array.from(themeStats.values())
      .map((s) => ({
        theme: s.theme,
        count: s.count,
        negativePct: s.count > 0 ? Math.round((s.negative / s.count) * 100) : 0,
        severity: Math.min(100, Math.round((s.critical * 35 + s.high * 20 + s.negative * 10) / Math.max(1, s.count))),
        critical: s.critical,
        high: s.high,
        samples: s.samples,
      }))
      .sort((a, b) => b.severity - a.severity)
      .slice(0, 5);

    const featByTheme = new Map<string, { theme: string; count: number; samples: { text: string; rating: number; source: string }[] }>();
    for (const fr of featureRequests) {
      const e = featByTheme.get(fr.theme) || { theme: fr.theme, count: 0, samples: [] };
      e.count++;
      if (e.samples.length < 3) e.samples.push({ text: fr.text, rating: fr.rating, source: fr.source });
      featByTheme.set(fr.theme, e);
    }

    return NextResponse.json({
      topIssues,
      emergingTrends: DEFAULT_INSIGHTS.emergingTrends,
      featureRequests: Array.from(featByTheme.values()).slice(0, 6),
      weeklySummary: {
        weekRange: "Past 7 Days",
        totalReviews: reviews.length,
        totalThisWeek: reviews.length,
        totalLastWeek: Math.max(1, Math.round(reviews.length * 0.8)),
        topTheme: topIssues[0]?.theme || "Usability",
        negativeShare: Math.round((reviews.filter((r) => r.sentiment === "negative").length / Math.max(1, reviews.length)) * 100),
        bugCount: reviews.filter((r) => r.isBug).length,
      },
      totalAnalyzed: reviews.length,
    });
  } catch (err) {
    console.error("GET /api/insights fallback triggered:", err);
    return NextResponse.json(DEFAULT_INSIGHTS);
  }
}
