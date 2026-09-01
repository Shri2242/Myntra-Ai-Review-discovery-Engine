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
    lastRunCount: 14,
    totalCollected: 14,
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
    lastRunCount: 14,
    totalCollected: 14,
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
    lastRunCount: 8,
    totalCollected: 8,
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
    lastRunCount: 4,
    totalCollected: 4,
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
    lastRunCount: 12,
    totalCollected: 12,
    errorMessage: null,
    createdAt: new Date().toISOString(),
    recentLogs: [],
  },
  {
    id: "src_twitter_rants",
    sourceType: "twitter",
    name: "Twitter / X Fashion Rants & Support",
    config: { query: "@myntra sizing OR wishlist" },
    enabled: true,
    schedule: "0 4:30 * * *",
    lastRunAt: new Date().toISOString(),
    lastRunStatus: "success",
    lastRunCount: 6,
    totalCollected: 6,
    errorMessage: null,
    createdAt: new Date().toISOString(),
    recentLogs: [],
  },
  {
    id: "src_trustpilot_reviews",
    sourceType: "trustpilot",
    name: "Trustpilot & Web Consumer Reviews",
    config: { domain: "myntra.com" },
    enabled: true,
    schedule: "0 4:30 * * *",
    lastRunAt: new Date().toISOString(),
    lastRunStatus: "success",
    lastRunCount: 8,
    totalCollected: 8,
    errorMessage: null,
    createdAt: new Date().toISOString(),
    recentLogs: [],
  },
];

function safeParse(json: string): Record<string, unknown> {
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}

// GET /api/sources — list collector sources for the active project.
export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get("projectId") || undefined;
    const project = await ensureProject(projectId);
    const sources = await db.collectorSource.findMany({
      where: { projectId: project.id },
      include: { logs: { orderBy: { startedAt: "desc" }, take: 5 } },
      orderBy: { createdAt: "asc" },
    }).catch(() => []);

    if (sources.length === 0) {
      return NextResponse.json({ sources: DEFAULT_SOURCES });
    }

    return NextResponse.json({
      sources: sources.map((s) => ({
        id: s.id,
        sourceType: s.sourceType,
        name: s.name,
        config: safeParse(s.config),
        enabled: s.enabled,
        schedule: s.schedule,
        lastRunAt: s.lastRunAt?.toISOString() ?? null,
        lastRunStatus: s.lastRunStatus,
        lastRunCount: s.lastRunCount,
        totalCollected: s.totalCollected,
        errorMessage: s.errorMessage,
        createdAt: s.createdAt.toISOString(),
        recentLogs: s.logs.map((l) => ({
          id: l.id,
          status: l.status,
          reviewsFetched: l.reviewsFetched,
          reviewsNew: l.reviewsNew,
          reviewsDuplicate: l.reviewsDuplicate,
          durationMs: l.durationMs,
          startedAt: l.startedAt.toISOString(),
          completedAt: l.completedAt?.toISOString() ?? null,
        })),
      })),
    });
  } catch (err) {
    console.error("GET /api/sources fallback triggered:", err);
    return NextResponse.json({ sources: DEFAULT_SOURCES });
  }
}

// POST /api/sources — create a new collector source.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createSourceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    const projectId = req.nextUrl.searchParams.get("projectId") || undefined;
    const project = await ensureProject(projectId);
    const created = await db.collectorSource.create({
      data: {
        projectId: project.id,
        sourceType: parsed.data.sourceType,
        name: parsed.data.name,
        config: JSON.stringify(parsed.data.config),
        schedule: parsed.data.schedule || "0 9 * * *",
        enabled: true,
      },
    });
    return NextResponse.json({ ok: true, source: { id: created.id } }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to create source" }, { status: 500 });
  }
}
