import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { fetchLeetCodeStats } from "@/lib/cp-fetch";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json({ error: "Username is required" }, { status: 400 });
  }

  try {
    const stats = await fetchLeetCodeStats(username);
    return NextResponse.json(stats);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch LeetCode data";
    const status = msg.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

