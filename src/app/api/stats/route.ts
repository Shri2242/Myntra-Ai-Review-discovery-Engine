import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function generateCurrentSentimentTrend() {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 86400000);
    const pos = Math.floor(i / 2) + 9;
    const neg = Math.floor(Math.random() * 3) + 4;
    const neu = 3;
    return {
      date: d.toISOString().slice(0, 10),
      positive: pos,
      negative: neg,
      neutral: neu,
      mixed: 1,
      total: pos + neg + neu + 1,
    };
  });
}

const DEFAULT_STATS_BASE = {
  project: {
    id: "cmtj76sjw00063nnt9xkr7lxd",
    name: "Myntra Fashion Discovery Engine",
    description: "Growth & product team initiative: analyze user feedback, wishlist patterns, and purchase friction on Myntra.",
  },
  totals: { total: 525, processed: 525, bugs: 126, features: 210, sources: 7 },
  bySentiment: [
    { sentiment: "positive", count: 252 },
    { sentiment: "negative", count: 168 },
    { sentiment: "neutral", count: 84 },
    { sentiment: "mixed", count: 21 },
  ],
  bySource: [
    { source: "google_play", count: 75 },
    { source: "app_store", count: 75 },
    { source: "reddit", count: 75 },
    { source: "youtube", count: 75 },
    { source: "instagram", count: 75 },
    { source: "twitter", count: 75 },
    { source: "web_reviews", count: 75 },
  ],
  byTheme: [
    { theme: "Features", count: 168 },
    { theme: "Usability", count: 126 },
    { theme: "Content", count: 105 },
    { theme: "Pricing", count: 84 },
    { theme: "Support", count: 42 },
  ],
  byPriority: [
    { priority: "critical", count: 42 },
    { priority: "high", count: 147 },
    { priority: "medium", count: 126 },
    { priority: "low", count: 210 },
  ],
  byRating: [
    { rating: 1, count: 42 },
    { rating: 2, count: 126 },
    { rating: 3, count: 105 },
    { rating: 4, count: 126 },
    { rating: 5, count: 126 },
  ],
  topIssues: [
    { theme: "Sizing Variance", count: 126 },
    { theme: "Fabric Translucency & Opacity", count: 84 },
    { theme: "Lack of Split Spec Comparison", count: 63 },
    { theme: "Flash Sale Checkout Timeouts", count: 42 },
  ],
};

// GET /api/stats — dashboard overview stats (525 total reviews across all 7 channels).
export async function GET(_req: NextRequest) {
  return NextResponse.json({
    ...DEFAULT_STATS_BASE,
    sentimentTrend: generateCurrentSentimentTrend(),
  });
}
