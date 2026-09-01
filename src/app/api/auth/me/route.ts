import { db } from "@/lib/db";
import { getSession, setSessionCookie } from "@/lib/auth";
import { seedDatabase } from "@/lib/seed-data";
import { errorResponse } from "@/lib/rbac";

export const dynamic = "force-dynamic";

// GET /api/auth/me — return the authenticated user + their projects.
// Auto-initializes with demo Myntra data if the database is empty.
export async function GET() {
  try {
    // 1. Auto-seed if database is completely empty
    const projectCount = await db.project.count().catch(() => 0);
    if (projectCount === 0) {
      try {
        const seedResult = await seedDatabase(db);
        if (seedResult.user) {
          await setSessionCookie({
            sub: seedResult.user.id,
            email: seedResult.user.email,
            name: seedResult.user.name,
          });
          return Response.json({
            user: seedResult.user,
            projects: [
              {
                id: seedResult.project.id,
                name: seedResult.project.name,
                description: seedResult.project.description,
                role: "admin",
              },
            ],
          });
        }
      } catch (e) {
        console.error("Auto-seed error:", e);
      }
    }

    // 2. Fetch session
    const session = await getSession();
    let user: { id: string; email: string; name: string; authProvider?: string } | null = null;

    if (session) {
      user = await db.user.findUnique({
        where: { id: session.sub },
        select: { id: true, email: true, name: true, authProvider: true },
      });
    }

    // If no active session, automatically sign in default admin or first user
    if (!user) {
      user = await db.user.findFirst({
        orderBy: { createdAt: "asc" },
        select: { id: true, email: true, name: true, authProvider: true },
      });
      if (user) {
        await setSessionCookie({ sub: user.id, email: user.email, name: user.name });
      }
    }

    // 3. Self-healing project rename if needed
    const oldProjects = await db.project.findMany({
      where: {
        OR: [
          { name: "Blinkit Review Discovery Enginer" },
          { name: "Blinkit Review Discovery Engine" },
        ],
      },
    });
    for (const p of oldProjects) {
      await db.project.update({
        where: { id: p.id },
        data: {
          name: "Myntra Fashion Discovery Engine",
          description: "Growth & product team initiative: analyze user feedback, wishlist patterns, and purchase friction on Myntra.",
        },
      });
    }

    // 4. Fetch projects
    const allProjects = await db.project.findMany({
      orderBy: { createdAt: "asc" },
    });

    return Response.json({
      user: user || { id: "default_pm", email: "pm@reviewpulse.dev", name: "Growth PM" },
      projects: allProjects.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        role: "admin",
      })),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
