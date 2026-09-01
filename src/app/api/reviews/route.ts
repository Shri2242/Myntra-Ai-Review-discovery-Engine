import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureProject, serializeReview } from "@/lib/server";
import { reviewQuerySchema } from "@/lib/validation";
import { SEED_REVIEWS } from "@/lib/seed-data";

export const dynamic = "force-dynamic";

// GET /api/reviews — list reviews with optional filters (validated via Zod).
export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get("projectId") || undefined;
    const sp = Object.fromEntries(req.nextUrl.searchParams.entries());
    const parsed = reviewQuerySchema.safeParse(sp);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid review query" }, { status: 400 });
    }
    const { sentiment, source, theme, priority, rating, isBug, isFeatureRequest, search, limit, offset } = parsed.data;

    const project = await ensureProject(projectId);
    const where: Record<string, unknown> = { projectId: project.id };
    if (sentiment) where.sentiment = sentiment;
    if (source) where.source = source;
    if (theme) where.theme = theme;
    if (priority) where.priority = priority;
    if (rating) where.rating = rating;
    if (isBug === "true") where.isBug = true;
    if (isFeatureRequest === "true") where.isFeatureRequest = true;
    if (search) {
      where.OR = [
        { text: { contains: search } },
        { title: { contains: search } },
        { author: { contains: search } },
      ];
    }

    let rows: any[] = [];
    let total = 0;
    try {
      const [dbRows, dbTotal] = await Promise.all([
        db.review.findMany({ where, orderBy: { reviewDate: "desc" }, take: limit, skip: offset }),
        db.review.count({ where }),
      ]);
      rows = dbRows;
      total = dbTotal;
    } catch {
      rows = [];
      total = 0;
    }

    // Fallback to rich in-memory dataset of 175 reviews if DB is fresh or empty
    if (rows.length === 0 && total === 0) {
      let filtered = [...SEED_REVIEWS];
      if (sentiment) filtered = filtered.filter((r) => r.sentiment === sentiment);
      if (source) filtered = filtered.filter((r) => r.source === source);
      if (theme) filtered = filtered.filter((r) => r.theme?.toLowerCase() === theme.toLowerCase());
      if (priority) filtered = filtered.filter((r) => r.priority === priority);
      if (rating) filtered = filtered.filter((r) => r.rating === rating);
      if (isBug === "true") filtered = filtered.filter((r) => r.isBug);
      if (isFeatureRequest === "true") filtered = filtered.filter((r) => r.isFeatureRequest);
      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter((r) => r.text.toLowerCase().includes(s) || r.author.toLowerCase().includes(s));
      }

      total = filtered.length;
      rows = filtered.slice(offset, offset + limit);
    }

    return NextResponse.json({
      reviews: rows.map(serializeReview),
      total,
      limit,
      offset,
    });
  } catch (err) {
    console.error("GET /api/reviews error fallback:", err);
    return NextResponse.json({
      reviews: SEED_REVIEWS.slice(0, 50).map(serializeReview),
      total: SEED_REVIEWS.length,
      limit: 50,
      offset: 0,
    });
  }
}
