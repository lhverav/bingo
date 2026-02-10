import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/actions/auth";
import { cardBunchJobService } from "@/lib/services/cardBunchJobService";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  // Validate session
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId } = await params;

  // Get job to check if it exists
  const progress = cardBunchJobService.getProgress(jobId);

  if (!progress) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Cancel the job
  cardBunchJobService.cancelJob(jobId);

  return NextResponse.json({ success: true, message: "Job cancelled" });
}
