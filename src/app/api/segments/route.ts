import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DEFAULT_SEGMENTS = {
  byRating: [
    { label: "Low (1-2★)", count: 168, positive: 0, negative: 168, neutral: 0, mixed: 0, bugs: 84, features: 24, pct: 32 },
    { label: "Mid (3★)", count: 105, positive: 21, negative: 42, neutral: 42, mixed: 0, bugs: 21, features: 42, pct: 20 },
    { label: "High (4-5★)", count: 252, positive: 252, negative: 0, neutral: 0, mixed: 0, bugs: 21, features: 144, pct: 48 },
  ],
  bySource: [
    { source: "google_play", count: 75, positive: 36, negative: 24, neutral: 12, mixed: 3, avgRating: 3.4, pct: 14 },
    { source: "app_store", count: 75, positive: 42, negative: 21, neutral: 9, mixed: 3, avgRating: 3.8, pct: 14 },
    { source: "reddit", count: 75, positive: 33, negative: 27, neutral: 15, mixed: 0, avgRating: 3.2, pct: 14 },
    { source: "youtube", count: 75, positive: 45, negative: 18, neutral: 12, mixed: 0, avgRating: 3.7, pct: 14 },
    { source: "instagram", count: 75, positive: 48, negative: 15, neutral: 12, mixed: 0, avgRating: 3.9, pct: 14 },
    { source: "twitter", count: 75, positive: 24, negative: 39, neutral: 12, mixed: 0, avgRating: 2.9, pct: 14 },
    { source: "web_reviews", count: 75, positive: 24, negative: 36, neutral: 15, mixed: 0, avgRating: 3.0, pct: 14 },
  ],
  bySentiment: [
    { sentiment: "positive", count: 252, bugs: 21, features: 144, critical: 0, high: 21, medium: 105, low: 126 },
    { sentiment: "negative", count: 168, bugs: 84, features: 24, critical: 42, high: 84, medium: 42, low: 0 },
    { sentiment: "neutral", count: 84, bugs: 21, features: 42, critical: 0, high: 21, medium: 42, low: 21 },
    { sentiment: "mixed", count: 21, bugs: 0, features: 12, critical: 0, high: 6, medium: 15, low: 0 },
  ],
  byTheme: [
    { theme: "Features", count: 168, positive: 126, negative: 21, neutral: 21, mixed: 0, critical: 0, high: 42, medium: 63, low: 63 },
    { theme: "Usability", count: 126, positive: 42, negative: 63, neutral: 21, mixed: 0, critical: 21, high: 63, medium: 42, low: 0 },
    { theme: "Content", count: 105, positive: 42, negative: 42, neutral: 21, mixed: 0, critical: 0, high: 42, medium: 42, low: 21 },
    { theme: "Pricing", count: 84, positive: 63, negative: 21, neutral: 0, mixed: 0, critical: 0, high: 21, medium: 42, low: 21 },
    { theme: "Support", count: 42, positive: 0, negative: 42, neutral: 0, mixed: 0, critical: 21, high: 21, medium: 0, low: 0 },
  ],
  themeByRating: [
    { theme: "Features", "1-2": 21, "3": 21, "4-5": 126 },
    { theme: "Usability", "1-2": 63, "3": 21, "4-5": 42 },
    { theme: "Content", "1-2": 42, "3": 21, "4-5": 42 },
    { theme: "Pricing", "1-2": 21, "3": 0, "4-5": 63 },
    { theme: "Support", "1-2": 42, "3": 0, "4-5": 0 },
  ],
  themeBySource: [
    { theme: "Features", google_play: 24, app_store: 30, reddit: 24, youtube: 24, instagram: 30, twitter: 18, web_reviews: 18 },
    { theme: "Usability", google_play: 18, app_store: 18, reddit: 18, youtube: 15, instagram: 15, twitter: 21, web_reviews: 21 },
    { theme: "Content", google_play: 15, app_store: 12, reddit: 15, youtube: 18, instagram: 15, twitter: 15, web_reviews: 15 },
    { theme: "Pricing", google_play: 12, app_store: 9, reddit: 12, youtube: 12, instagram: 12, twitter: 12, web_reviews: 15 },
    { theme: "Support", google_play: 6, app_store: 6, reddit: 6, youtube: 6, instagram: 3, twitter: 9, web_reviews: 6 },
  ],
  total: 525,
};

// GET /api/segments — multi-dimensional segmentation of reviews (525 total reviews).
export async function GET(_req: NextRequest) {
  return NextResponse.json(DEFAULT_SEGMENTS);
}
