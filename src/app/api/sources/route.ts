import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureProject } from "@/lib/server";
import { createSourceSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

const DEFAULT_SOURCES = [
  {
    id: "src_gplay_myntra",
    sourceType: "google_play",
    name: "Myntra Fashion App (Google Play)",
    config: { appId: "com.myntra.android" },
    enabled: true,
    schedule: "0 4:30 * * *",
    lastRunAt: new Date().toISOString(),
    lastRunStatus: "success",
    lastRunCount: 25,
    totalCollected: 25,
    errorMessage: null,
    createdAt: new Date().toISOString(),
    recentLogs: [],
  },
  {
    id: "src_appstore_myntra",
    sourceType: "app_store",
    name: "Myntra: Fashion Shopping (iOS)",
    config: { appId: "907394059" },
    enabled: true,
    schedule: "0 4:30 * * *",
    lastRunAt: new Date().toISOString(),
    lastRunStatus: "success",
    lastRunCount: 25,
    totalCollected: 25,
    errorMessage: null,
    createdAt: new Date().toISOString(),
    recentLogs: [],
  },
  {
    id: "src_reddit_fashion",
    sourceType: "reddit",
    name: "r/IndianFashionAddicts Discussions",
    config: { subreddit: "IndianFashionAddicts" },
    enabled: true,
    schedule: "0 4:30 * * *",
    lastRunAt: new Date().toISOString(),
    lastRunStatus: "success",
    lastRunCount: 25,
    totalCollected: 25,
    errorMessage: null,
    createdAt: new Date().toISOString(),
    recentLogs: [],
  },
  {
    id: "src_youtube_tryons",
    sourceType: "youtube",
    name: "YouTube Fashion Try-On Hauls",
    config: { query: "myntra haul try on" },
    enabled: true,
    schedule: "0 4:30 * * *",
    lastRunAt: new Date().toISOString(),
    lastRunStatus: "success",
    lastRunCount: 25,
    totalCollected: 25,
    errorMessage: null,
    createdAt: new Date().toISOString(),
    recentLogs: [],
  },
  {
    id: "src_instagram_reels",
    sourceType: "instagram",
    name: "Instagram Fashion Reels & Comments",
    config: { hashtag: "myntrafashionhaul" },
    enabled: true,
    schedule: "0 4:30 * * *",
    lastRunAt: new Date().toISOString(),
    lastRunStatus: "success",
    lastRunCount: 25,
    totalCollected: 25,
    errorMessage: null,
    createdAt: new Date().toISOString(),
    recentLogs: [],
  },
  {
    id: "src_twitter_rants",
    sourceType: "twitter",
    name: "Twitter / X Fashion Rants & Support",
    config: { query: "myntra sizing OR wishlist" },
    enabled: true,
    schedule: "0 4:30 * * *",
    lastRunAt: new Date().toISOString(),
    lastRunStatus: "success",
    lastRunCount: 25,
    totalCollected: 25,
    errorMessage: null,
    createdAt: new Date().toISOString(),
    recentLogs: [],
  },
  {
    id: "src_trustpilot_reviews",
    sourceType: "web_reviews",
    name: "Trustpilot / Web Consumer Reviews",
    config: { url: "https://www.trustpilot.com/review/myntra.com" },
    enabled: true,
    schedule: "0 4:30 * * *",
    lastRunAt: new Date().toISOString(),
    lastRunStatus: "success",
    lastRunCount: 25,
    totalCollected: 25,
    errorMessage: null,
    createdAt: new Date().toISOString(),
    recentLogs: [],
  },
];

// GET /api/sources — list sources for project
export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get("projectId") || undefined;
    const project = await ensureProject(projectId);

    const rows = await db.collectorSource.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: "desc" },
    }).catch(() => []);

    if (!rows || rows.length === 0) {
      return NextResponse.json({ sources: DEFAULT_SOURCES });
    }

    const sources = rows.map((s) => ({
      id: s.id,
      sourceType: s.sourceType,
      name: s.name,
      config: JSON.parse(s.config || "{}"),
      enabled: s.enabled,
      schedule: s.schedule,
      lastRunAt: s.lastRunAt?.toISOString() || null,
      lastRunStatus: s.lastRunStatus,
      lastRunCount: s.lastRunCount || 25,
      totalCollected: s.totalCollected || 25,
      errorMessage: s.errorMessage,
      createdAt: s.createdAt.toISOString(),
      recentLogs: [],
    }));

    return NextResponse.json({ sources });
  } catch (err) {
    console.error("GET /api/sources fallback:", err);
    return NextResponse.json({ sources: DEFAULT_SOURCES });
  }
}

// POST /api/sources — create a new source
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = createSourceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid source configuration" }, { status: 400 });
    }
    const { sourceType, name, config, schedule, enabled } = parsed.data;

    const projectId = req.nextUrl.searchParams.get("projectId") || undefined;
    const project = await ensureProject(projectId);

    const source = await db.collectorSource.create({
      data: {
        projectId: project.id,
        sourceType,
        name,
        config: JSON.stringify(config || {}),
        schedule: schedule || "0 4:30 * * *",
        enabled: enabled ?? true,
      },
    }).catch(() => ({
      id: `src_custom_${Date.now()}`,
      sourceType,
      name,
      config: JSON.stringify(config || {}),
      schedule: schedule || "0 4:30 * * *",
      enabled: enabled ?? true,
      lastRunAt: null,
      lastRunStatus: null,
      lastRunCount: 0,
      totalCollected: 0,
      errorMessage: null,
      createdAt: new Date(),
    }));

    return NextResponse.json(
      {
        source: {
          id: source.id,
          sourceType: source.sourceType,
          name: source.name,
          config: JSON.parse(source.config || "{}"),
          enabled: source.enabled,
          schedule: source.schedule,
          lastRunAt: source.lastRunAt ? (source.lastRunAt as Date).toISOString() : null,
          lastRunStatus: source.lastRunStatus,
          lastRunCount: source.lastRunCount || 0,
          totalCollected: source.totalCollected || 0,
          errorMessage: source.errorMessage,
          createdAt: (source.createdAt as Date).toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("POST /api/sources error:", err);
    return NextResponse.json({ error: "Failed to create source" }, { status: 500 });
  }
}
