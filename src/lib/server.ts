import "server-only";
import { db } from "@/lib/db";
import { seedDatabase } from "@/lib/seed-data";

export interface ProjectRecord {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const FALLBACK_PROJECT: ProjectRecord = {
  id: "cmtj76sjw00063nnt9xkr7lxd",
  name: "Myntra Fashion Discovery Engine",
  description: "Growth & product team initiative: analyze user feedback, wishlist patterns, and purchase friction on Myntra.",
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Returns the active project or seeds the default Myntra demo project if none exists.
 */
export async function resolveProject(projectId?: string): Promise<ProjectRecord> {
  try {
    if (projectId) {
      const proj = await db.project.findUnique({ where: { id: projectId } });
      if (proj) return proj as ProjectRecord;
    }
    let project = await db.project.findFirst({ orderBy: { createdAt: "asc" } });
    if (!project) {
      const seeded = await seedDatabase(db);
      project = seeded.project as any;
    }
    return (project as ProjectRecord) || FALLBACK_PROJECT;
  } catch (err) {
    console.error("resolveProject error:", err);
    return FALLBACK_PROJECT;
  }
}

/**
 * Ensures a project exists. Automatically seeds database if empty so it never crashes.
 */
export async function ensureProject(projectId?: string): Promise<ProjectRecord> {
  try {
    if (projectId) {
      const proj = await db.project.findUnique({ where: { id: projectId } });
      if (proj) return proj as ProjectRecord;
    }
    let project = await db.project.findFirst({ orderBy: { createdAt: "asc" } });
    if (!project) {
      const seeded = await seedDatabase(db);
      project = seeded.project as any;
    }
    return (project as ProjectRecord) || FALLBACK_PROJECT;
  } catch (err) {
    console.error("ensureProject error, using fallback demo project:", err);
    return FALLBACK_PROJECT;
  }
}

export function parseKeyPhrases(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function serializeReview(r: any) {
  return {
    ...r,
    reviewDate: r.reviewDate?.toISOString?.() ?? r.reviewDate ?? new Date().toISOString(),
    createdAt: r.createdAt?.toISOString?.() ?? r.createdAt ?? new Date().toISOString(),
    processedAt: r.processedAt?.toISOString?.() ?? r.processedAt ?? null,
    keyPhrases: parseKeyPhrases(r.keyPhrases),
  };
}
