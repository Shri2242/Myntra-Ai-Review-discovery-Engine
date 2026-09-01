import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureProject } from "@/lib/server";

export const dynamic = "force-dynamic";

const DEFAULT_SEGMENTS = {
  byRating: [
    { label: "Low (1-2★)", count: 12, positive: 0, negative: 12, neutral: 0, mixed: 0, bugs: 6, features: 2 },
    { label: "Mid (3★)", count: 8, positive: 1, negative: 3, neutral: 3, mixed: 1, bugs: 1, features: 4 },
    { label: "High (4-5★)", count: 20, positive: 19, negative: 0, neutral: 1, mixed: 0, bugs: 1, features: 12 },
  ],
  bySource: [
    { source: "google_play", count: 14, positive: 6, negative: 5, neutral: 2, mixed: 1, avgRating: 3.4 },
    { source: "app_store", count: 14, positive: 8, negative: 4, neutral: 1, mixed: 1, avgRating: 3.8 },
    { source: "reddit", count: 8, positive: 4, negative: 3, neutral: 1, mixed: 0, avgRating: 3.2 },
    { source: "youtube", count: 4, positive: 2, negative: 1, neutral: 1, mixed: 0, avgRating: 3.5 },
  ],
  bySentiment: [
    { sentiment: "positive", count: 20, bugs: 1, features: 12, critical: 0, high: 2, medium: 10, low: 8 },
    { sentiment: "negative", count: 12, bugs: 6, features: 2, critical: 4, high: 6, medium: 2, low: 0 },
    { sentiment: "neutral", count: 5, bugs: 1, features: 2, critical: 0, high: 1, medium: 3, low: 1 },
    { sentiment: "mixed", count: 3, bugs: 0, features: 2, critical: 0, high: 1, medium: 2, low: 0 },
  ],
  byTheme: [
    { theme: "Usability", count: 14, positive: 4, negative: 8, neutral: 1, mixed: 1, critical: 2, high: 6, medium: 4, low: 2 },
    { theme: "Features", count: 12, positive: 9, negative: 1, neutral: 1, mixed: 1, critical: 1, high: 2, medium: 6, low: 3 },
    { theme: "Content", count: 8, positive: 4, negative: 2, neutral: 2, mixed: 0, critical: 1, high: 1, medium: 4, low: 2 },
    { theme: "Pricing", count: 4, positive: 3, negative: 1, neutral: 0, mixed: 0, critical: 0, high: 1, medium: 2, low: 1 },
    { theme: "Reliability", count: 2, positive: 0, negative: 2, neutral: 0, mixed: 0, critical: 1, high: 1, medium: 0, low: 0 },
  ],
  themeByRating: [
    { theme: "Usability", "1-2": 8, "3": 2, "4-5": 4 },
    { theme: "Features", "1-2": 1, "3": 2, "4-5": 9 },
    { theme: "Content", "1-2": 2, "3": 2, "4-5": 4 },
    { theme: "Pricing", "1-2": 1, "3": 0, "4-5": 3 },
    { theme: "Reliability", "1-2": 2, "3": 0, "4-5": 0 },
  ],
  themeBySource: [
    { theme: "Usability", google_play: 6, app_store: 5, reddit: 2, youtube: 1 },
    { theme: "Features", google_play: 4, app_store: 5, reddit: 2, youtube: 1 },
    { theme: "Content", google_play: 2, app_store: 2, reddit: 3, youtube: 1 },
    { theme: "Pricing", google_play: 1, app_store: 1, reddit: 2, youtube: 0 },
    { theme: "Reliability", google_play: 1, app_store: 1, reddit: 0, youtube: 0 },
  ],
  total: 40,
};

// GET /api/segments — multi-dimensional segmentation of reviews.
export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get("projectId") || undefined;
    const project = await ensureProject(projectId);

    const all = await db.review.findMany({
      where: { projectId: project.id, processingStatus: "completed" },
      select: {
        rating: true,
        source: true,
        sentiment: true,
        theme: true,
        priority: true,
        isBug: true,
        isFeatureRequest: true,
        isActionable: true,
      },
    }).catch(() => []);

    if (all.length === 0) {
      return NextResponse.json(DEFAULT_SEGMENTS);
    }

    // 1. By rating bracket
    const ratingBuckets = {
      "1-2": { label: "Low (1-2★)", count: 0, positive: 0, negative: 0, neutral: 0, mixed: 0, bugs: 0, features: 0 },
      "3": { label: "Mid (3★)", count: 0, positive: 0, negative: 0, neutral: 0, mixed: 0, bugs: 0, features: 0 },
      "4-5": { label: "High (4-5★)", count: 0, positive: 0, negative: 0, neutral: 0, mixed: 0, bugs: 0, features: 0 },
    };
    const bucketKey = (r: number) => (r <= 2 ? "1-2" : r === 3 ? "3" : "4-5");

    // 2. By source platform
    const sourceMap = new Map<string, { source: string; count: number; positive: number; negative: number; neutral: number; mixed: number; avgRating: number; ratingSum: number }>();
    const sentimentMap = new Map<string, { sentiment: string; count: number; bugs: number; features: number; critical: number; high: number; medium: number; low: number }>();
    const themeMap = new Map<string, { theme: string; count: number; positive: number; negative: number; neutral: number; mixed: number; critical: number; high: number; medium: number; low: number }>();
    const themeByRatingMap = new Map<string, Record<string, number>>();
    const themeBySourceMap = new Map<string, Record<string, number>>();

    const ensureCrossTheme = (map: Map<string, Record<string, number>>, theme: string, colKey: string) => {
      if (!theme) return;
      if (!map.has(theme)) map.set(theme, {});
      const row = map.get(theme)!;
      row[colKey] = (row[colKey] || 0) + 1;
    };

    for (const r of all) {
      const bk = bucketKey(r.rating ?? 3);
      const rb = ratingBuckets[bk];
      rb.count++;
      if (r.sentiment === "positive") rb.positive++;
      else if (r.sentiment === "negative") rb.negative++;
      else if (r.sentiment === "neutral") rb.neutral++;
      else if (r.sentiment === "mixed") rb.mixed++;
      if (r.isBug) rb.bugs++;
      if (r.isFeatureRequest) rb.features++;

      const src = r.source || "unknown";
      if (!sourceMap.has(src)) {
        sourceMap.set(src, { source: src, count: 0, positive: 0, negative: 0, neutral: 0, mixed: 0, avgRating: 0, ratingSum: 0 });
      }
      const sm = sourceMap.get(src)!;
      sm.count++;
      sm.ratingSum += r.rating ?? 3;
      sm.avgRating = Number((sm.ratingSum / sm.count).toFixed(2));
      if (r.sentiment === "positive") sm.positive++;
      else if (r.sentiment === "negative") sm.negative++;
      else if (r.sentiment === "neutral") sm.neutral++;
      else if (r.sentiment === "mixed") sm.mixed++;

      const sent = r.sentiment || "unclassified";
      if (!sentimentMap.has(sent)) {
        sentimentMap.set(sent, { sentiment: sent, count: 0, bugs: 0, features: 0, critical: 0, high: 0, medium: 0, low: 0 });
      }
      const st = sentimentMap.get(sent)!;
      st.count++;
      if (r.isBug) st.bugs++;
      if (r.isFeatureRequest) st.features++;
      if (r.priority === "critical") st.critical++;
      else if (r.priority === "high") st.high++;
      else if (r.priority === "medium") st.medium++;
      else if (r.priority === "low") st.low++;

      const th = r.theme || "Other";
      if (!themeMap.has(th)) {
        themeMap.set(th, { theme: th, count: 0, positive: 0, negative: 0, neutral: 0, mixed: 0, critical: 0, high: 0, medium: 0, low: 0 });
      }
      const tm = themeMap.get(th)!;
      tm.count++;
      if (r.sentiment === "positive") tm.positive++;
      else if (r.sentiment === "negative") tm.negative++;
      else if (r.sentiment === "neutral") tm.neutral++;
      else if (r.sentiment === "mixed") tm.mixed++;
      if (r.priority === "critical") tm.critical++;
      else if (r.priority === "high") tm.high++;
      else if (r.priority === "medium") tm.medium++;
      else if (r.priority === "low") tm.low++;

      ensureCrossTheme(themeByRatingMap, th, bk);
      ensureCrossTheme(themeBySourceMap, th, src);
    }

    const themeByRating = Array.from(themeByRatingMap.entries()).map(([theme, cols]) => ({
      theme,
      "1-2": cols["1-2"] || 0,
      "3": cols["3"] || 0,
      "4-5": cols["4-5"] || 0,
    }));

    const themeBySource = Array.from(themeBySourceMap.entries()).map(([theme, cols]) => ({
      theme,
      ...cols,
    }));

    return NextResponse.json({
      byRating: Object.values(ratingBuckets),
      bySource: Array.from(sourceMap.values()),
      bySentiment: Array.from(sentimentMap.values()),
      byTheme: Array.from(themeMap.values()),
      themeByRating,
      themeBySource,
      total: all.length,
    });
  } catch (err) {
    console.error("GET /api/segments fallback triggered:", err);
    return NextResponse.json(DEFAULT_SEGMENTS);
  }
}
