import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/actions/auth";
import { cardBunchJobService } from "@/lib/services/cardBunchJobService";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  // Validate session
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId } = await params;
  console.log("[DEBUG 7] Progress API called for jobId:", jobId);

  // Get progress
  const progress = cardBunchJobService.getProgress(jobId);
  console.log("[DEBUG 8] Job found in Map:", progress);

  if (!progress) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json(progress);
}
