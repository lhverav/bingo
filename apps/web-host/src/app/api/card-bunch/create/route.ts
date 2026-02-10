import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/actions/auth";
import { cardBunchJobService } from "@/lib/services/cardBunchJobService";
import { CreateCardBunchJobInput } from "@/lib/types/cardBunchJob";
import { generateAndSaveCardsInChunks, cardBunchRepository } from "@bingo/game-core";

export async function POST(request: NextRequest) {
  // Validate session
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse request body
  const body = await request.json();
  const { name, cardSize, maxNumber, count } = body as CreateCardBunchJobInput;

  // Validate input
  if (!name || !cardSize || !maxNumber || !count) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Create job for progress tracking
  const jobId = cardBunchJobService.createJob({ name, cardSize, maxNumber, count });

  // Start background task (don't await)
  generateCardsBackgroundTask(jobId, name, cardSize, maxNumber, count);

  // Return jobId immediately
  return NextResponse.json({ jobId });
}

async function generateCardsBackgroundTask(
  jobId: string,
  name: string,
  cardSize: number,
  maxNumber: number,
  count: number
) {
  try {
    // Step 1: Create CardBunch (metadata only, cards stored separately)
    const bunch = await cardBunchRepository.create({
      name,
      cardSize,
      maxNumber,
      cards: [], // Empty - cards stored in BunchCard collection
    });

    // Step 2: Generate and save cards in chunks
    await generateAndSaveCardsInChunks({
      bunchId: bunch.id,
      cardSize,
      maxNumber,
      count,
      onProgress: (current, total) => {
        cardBunchJobService.updateProgress(jobId, current);
      },
      shouldCancel: () => {
        return cardBunchJobService.shouldCancel(jobId);
      },
    });

    // Mark as completed
    cardBunchJobService.completeJob(jobId);
  } catch (error) {
    // Mark as failed or cancelled
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("cancelled")) {
      cardBunchJobService.cancelJob(jobId);
    } else {
      cardBunchJobService.failJob(jobId, message);
    }
  }
}
