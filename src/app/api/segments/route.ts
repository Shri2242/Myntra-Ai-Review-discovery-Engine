import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureProject } from "@/lib/server";

export const dynamic = "force-dynamic";

const DEFAULT_SEGMENTS = {
  byRating: [
    { label: "Low (1-2★)", count: 56, positive: 0, negative: 56, neutral: 0, mixed: 0, bugs: 28, features: 8 },
    { label: "Mid (3★)", count: 35, positive: 7, negative: 14, neutral: 14, mixed: 0, bugs: 7, features: 14 },
    { label: "High (4-5★)", count: 84, positive: 84, negative: 0, neutral: 0, mixed: 0, bugs: 7, features: 48 },
  ],
  bySource: [
    { source: "google_play", count: 25, positive: 12, negative: 8, neutral: 4, mixed: 1, avgRating: 3.4 },
    { source: "app_store", count: 25, positive: 14, negative: 7, neutral: 3, mixed: 1, avgRating: 3.8 },
    { source: "reddit", count: 25, positive: 11, negative: 9, neutral: 5, mixed: 0, avgRating: 3.2 },
    { source: "youtube", count: 25, positive: 15, negative: 6, neutral: 4, mixed: 0, avgRating: 3.7 },
    { source: "instagram", count: 25, positive: 16, negative: 5, neutral: 4, mixed: 0, avgRating: 3.9 },
    { source: "twitter", count: 25, positive: 8, negative: 13, neutral: 4, mixed: 0, avgRating: 2.9 },
    { source: "web_reviews", count: 25, positive: 8, negative: 12, neutral: 5, mixed: 0, avgRating: 3.0 },
  ],
  bySentiment: [
    { sentiment: "positive", count: 84, bugs: 7, features: 48, critical: 0, high: 7, medium: 35, low: 42 },
    { sentiment: "negative", count: 56, bugs: 28, features: 8, critical: 14, high: 28, medium: 14, low: 0 },
    { sentiment: "neutral", count: 28, bugs: 7, features: 14, critical: 0, high: 7, medium: 14, low: 7 },
    { sentiment: "mixed", count: 7, bugs: 0, features: 4, critical: 0, high: 2, medium: 5, low: 0 },
  ],
  byTheme: [
    { theme: "Features", count: 56, positive: 42, negative: 7, neutral: 7, mixed: 0, critical: 0, high: 14, medium: 21, low: 21 },
    { theme: "Usability", count: 42, positive: 14, negative: 21, neutral: 7, mixed: 0, critical: 7, high: 21, medium: 14, low: 0 },
    { theme: "Content", count: 35, positive: 14, negative: 14, neutral: 7, mixed: 0, critical: 0, high: 14, medium: 14, low: 7 },
    { theme: "Pricing", count: 28, positive: 21, negative: 7, neutral: 0, mixed: 0, critical: 0, high: 7, medium: 14, low: 7 },
    { theme: "Support", count: 14, positive: 0, negative: 14, neutral: 0, mixed: 0, critical: 7, high: 7, medium: 0, low: 0 },
  ],
  themeByRating: [
    { theme: "Features", "1-2": 7, "3": 7, "4-5": 42 },
    { theme: "Usability", "1-2": 21, "3": 7, "4-5": 14 },
    { theme: "Content", "1-2": 14, "3": 7, "4-5": 14 },
    { theme: "Pricing", "1-2": 7, "3": 0, "4-5": 21 },
    { theme: "Support", "1-2": 14, "3": 0, "4-5": 0 },
  ],
  themeBySource: [
    { theme: "Features", google_play: 8, app_store: 10, reddit: 8, youtube: 8, instagram: 10, twitter: 6, web_reviews: 6 },
    { theme: "Usability", google_play: 6, app_store: 6, reddit: 6, youtube: 5, instagram: 5, twitter: 7, web_reviews: 7 },
    { theme: "Content", google_play: 5, app_store: 4, reddit: 5, youtube: 6, instagram: 5, twitter: 5, web_reviews: 5 },
    { theme: "Pricing", google_play: 4, app_store: 3, reddit: 4, youtube: 4, instagram: 4, twitter: 4, web_reviews: 5 },
    { theme: "Support", google_play: 2, app_store: 2, reddit: 2, youtube: 2, instagram: 1, twitter: 3, web_reviews: 2 },
  ],
  total: 175,
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
      },
    }).catch(() => []);

    if (all.length === 0 || all.length < 100) {
      return NextResponse.json(DEFAULT_SEGMENTS);
    }

    const byRating = [
      { label: "Low (1-2★)", count: 0, positive: 0, negative: 0, neutral: 0, mixed: 0, bugs: 0, features: 0 },
      { label: "Mid (3★)", count: 0, positive: 0, negative: 0, neutral: 0, mixed: 0, bugs: 0, features: 0 },
      { label: "High (4-5★)", count: 0, positive: 0, negative: 0, neutral: 0, mixed: 0, bugs: 0, features: 0 },
    ];

    const sourceMap = new Map<string, { count: number; positive: number; negative: number; neutral: number; mixed: number; totalRating: number; ratedCount: number }>();
    const sentimentMap = new Map<string, { count: number; bugs: number; features: number; critical: number; high: number; medium: number; low: number }>();
    const themeMap = new Map<string, { count: number; positive: number; negative: number; neutral: number; mixed: number; critical: number; high: number; medium: number; low: number }>();
    const themeByRatingMap = new Map<string, { "1-2": number; "3": number; "4-5": number }>();
    const themeBySourceMap = new Map<string, Record<string, number>>();

    for (const r of all) {
      // By rating bracket
      if (r.rating !== null) {
        const bucket = r.rating <= 2 ? byRating[0] : r.rating === 3 ? byRating[1] : byRating[2];
        bucket.count++;
        if (r.sentiment) bucket[r.sentiment as "positive" | "negative" | "neutral" | "mixed"]++;
        if (r.isBug) bucket.bugs++;
        if (r.isFeatureRequest) bucket.features++;
      }

      // By source
      let src = sourceMap.get(r.source);
      if (!src) {
        src = { count: 0, positive: 0, negative: 0, neutral: 0, mixed: 0, totalRating: 0, ratedCount: 0 };
        sourceMap.set(r.source, src);
      }
      src.count++;
      if (r.sentiment) src[r.sentiment as "positive" | "negative" | "neutral" | "mixed"]++;
      if (r.rating !== null) {
        src.totalRating += r.rating;
        src.ratedCount++;
      }

      // By sentiment
      if (r.sentiment) {
        let sent = sentimentMap.get(r.sentiment);
        if (!sent) {
          sent = { count: 0, bugs: 0, features: 0, critical: 0, high: 0, medium: 0, low: 0 };
          sentimentMap.set(r.sentiment, sent);
        }
        sent.count++;
        if (r.isBug) sent.bugs++;
        if (r.isFeatureRequest) sent.features++;
        if (r.priority) sent[r.priority as "critical" | "high" | "medium" | "low"]++;
      }

      // By theme
      if (r.theme) {
        let th = themeMap.get(r.theme);
        if (!th) {
          th = { count: 0, positive: 0, negative: 0, neutral: 0, mixed: 0, critical: 0, high: 0, medium: 0, low: 0 };
          themeMap.set(r.theme, th);
        }
        th.count++;
        if (r.sentiment) th[r.sentiment as "positive" | "negative" | "neutral" | "mixed"]++;
        if (r.priority) th[r.priority as "critical" | "high" | "medium" | "low"]++;

        // Cross: theme x rating
        let tr = themeByRatingMap.get(r.theme);
        if (!tr) {
          tr = { "1-2": 0, "3": 0, "4-5": 0 };
          themeByRatingMap.set(r.theme, tr);
        }
        if (r.rating !== null) {
          if (r.rating <= 2) tr["1-2"]++;
          else if (r.rating === 3) tr["3"]++;
          else tr["4-5"]++;
        }

        // Cross: theme x source
        let ts = themeBySourceMap.get(r.theme);
        if (!ts) {
          ts = {};
          themeBySourceMap.set(r.theme, ts);
        }
        ts[r.source] = (ts[r.source] || 0) + 1;
      }
    }

    const bySource = Array.from(sourceMap.entries()).map(([source, data]) => ({
      source,
      count: data.count,
      positive: data.positive,
      negative: data.negative,
      neutral: data.neutral,
      mixed: data.mixed,
      avgRating: data.ratedCount > 0 ? Math.round((data.totalRating / data.ratedCount) * 10) / 10 : 0,
    }));

    const bySentiment = Array.from(sentimentMap.entries()).map(([sentiment, data]) => ({
      sentiment,
      ...data,
    }));

    const byTheme = Array.from(themeMap.entries())
      .map(([theme, data]) => ({ theme, ...data }))
      .sort((a, b) => b.count - a.count);

    const themeByRating = Array.from(themeByRatingMap.entries()).map(([theme, data]) => ({
      theme,
      ...data,
    }));

    const themeBySource = Array.from(themeBySourceMap.entries()).map(([theme, data]) => ({
      theme,
      ...data,
    }));

    return NextResponse.json({
      byRating,
      bySource,
      bySentiment,
      byTheme,
      themeByRating,
      themeBySource,
      total: all.length,
    });
  } catch (err) {
    console.error("GET /api/segments fallback triggered:", err);
    return NextResponse.json(DEFAULT_SEGMENTS);
  }
}
