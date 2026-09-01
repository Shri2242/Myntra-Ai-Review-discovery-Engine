import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    app: "Myntra Fashion Discovery Engine",
    timestamp: new Date().toISOString(),
  });
}
