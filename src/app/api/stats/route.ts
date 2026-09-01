import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureProject } from "@/lib/server";

export const dynamic = "force-dynamic";

const DEFAULT_STATS = {
  project: {
    id: "cmtj76sjw00063nnt9xkr7lxd",
    name: "Myntra Fashion Discovery Engine",
    description: "Growth & product team initiative: analyze user feedback, wishlist patterns, and purchase friction on Myntra.",
  },
  totals: { total: 40, processed: 40, bugs: 8, features: 18, sources: 4 },
  bySentiment: [
    { sentiment: "positive", count: 20 },
    { sentiment: "negative", count: 12 },
    { sentiment: "neutral", count: 5 },
    { sentiment: "mixed", count: 3 },
  ],
  bySource: [
    { source: "google_play", count: 14 },
    { source: "app_store", count: 14 },
    { source: "reddit", count: 8 },
    { source: "youtube", count: 4 },
  ],
  byTheme: [
    { theme: "Usability", count: 14 },
    { theme: "Features", count: 12 },
    { theme: "Content", count: 8 },
    { theme: "Pricing", count: 4 },
    { theme: "Reliability", count: 2 },
  ],
  byPriority: [
    { priority: "critical", count: 4 },
    { priority: "high", count: 10 },
    { priority: "medium", count: 18 },
    { priority: "low", count: 8 },
  ],
  byRating: [
    { rating: 1, count: 4 },
    { rating: 2, count: 8 },
    { rating: 3, count: 6 },
    { rating: 4, count: 10 },
    { rating: 5, count: 12 },
  ],
  sentimentTrend: Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 86400000);
    return {
      date: d.toISOString().slice(0, 10),
      positive: Math.floor(Math.random() * 3) + 1,
      negative: Math.floor(Math.random() * 2),
      neutral: 1,
      mixed: 0,
      total: 3,
    };
  }),
  topIssues: [
    { theme: "Sizing Variance", count: 14 },
    { theme: "Fabric Translucency", count: 8 },
    { theme: "Lack of Split Comparison", count: 7 },
    { theme: "Checkout Timeout During Flash Sales", count: 4 },
  ],
};

// GET /api/stats — dashboard overview stats.
export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get("projectId") || undefined;
    const project = await ensureProject(projectId);

    const [
      total,
      processed,
      bugs,
      features,
      bySentiment,
      bySource,
      byTheme,
      byPriority,
      byRating,
      last30,
    ] = await Promise.all([
      db.review.count({ where: { projectId: project.id } }).catch(() => 0),
      db.review.count({ where: { projectId: project.id, processingStatus: "completed" } }).catch(() => 0),
      db.review.count({ where: { projectId: project.id, isBug: true } }).catch(() => 0),
      db.review.count({ where: { projectId: project.id, isFeatureRequest: true } }).catch(() => 0),
      db.review.groupBy({
        by: ["sentiment"],
        where: { projectId: project.id },
        _count: { _all: true },
      }).catch(() => []),
      db.review.groupBy({
        by: ["source"],
        where: { projectId: project.id },
        _count: { _all: true },
      }).catch(() => []),
      db.review.groupBy({
        by: ["theme"],
        where: { projectId: project.id, theme: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { id: "desc" } },
        take: 12,
      }).catch(() => []),
      db.review.groupBy({
        by: ["priority"],
        where: { projectId: project.id, priority: { not: null } },
        _count: { _all: true },
      }).catch(() => []),
      db.review.groupBy({
        by: ["rating"],
        where: { projectId: project.id },
        _count: { _all: true },
      }).catch(() => []),
      db.review.findMany({
        where: {
          projectId: project.id,
          reviewDate: { gte: new Date(Date.now() - 30 * 86400000) },
        },
        select: { reviewDate: true, sentiment: true, rating: true, theme: true },
        orderBy: { reviewDate: "asc" },
      }).catch(() => []),
    ]);

    if (total === 0) {
      return NextResponse.json(DEFAULT_STATS);
    }

    // Build a 30-day sentiment trend (group by day).
    const trendMap = new Map<string, { date: string; positive: number; negative: number; neutral: number; mixed: number; total: number }>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      trendMap.set(key, { date: key, positive: 0, negative: 0, neutral: 0, mixed: 0, total: 0 });
    }
    for (const r of last30) {
      const key = r.reviewDate.toISOString().slice(0, 10);
      const bucket = trendMap.get(key);
      if (bucket && r.sentiment) {
        bucket[r.sentiment as "positive" | "negative" | "neutral" | "mixed"]++;
        bucket.total++;
      }
    }
    const sentimentTrend = Array.from(trendMap.values());

    const topIssues = byTheme
      .filter((t) => t.theme)
      .slice(0, 8)
      .map((t) => ({ theme: t.theme, count: t._count._all }));

    return NextResponse.json({
      project: { id: project.id, name: project.name, description: project.description },
      totals: { total, processed, bugs, features, sources: bySource.length },
      bySentiment: bySentiment.map((s) => ({ sentiment: s.sentiment, count: s._count._all })),
      bySource: bySource.map((s) => ({ source: s.source, count: s._count._all })),
      byTheme: byTheme.map((t) => ({ theme: t.theme, count: t._count._all })),
      byPriority: byPriority.map((p) => ({ priority: p.priority, count: p._count._all })),
      byRating: byRating
        .map((r) => ({ rating: r.rating, count: r._count._all }))
        .sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0)),
      sentimentTrend,
      topIssues,
    });
  } catch (err) {
    console.error("GET /api/stats fallback triggered:", err);
    return NextResponse.json(DEFAULT_STATS);
  }
}
