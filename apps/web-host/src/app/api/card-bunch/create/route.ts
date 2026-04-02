import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/actions/auth";
import { cardBunchJobService } from "@/lib/services/cardBunchJobService";
import { CreateCardBunchJobInput } from "@/lib/types/cardBunchJob";
import { generateAndSaveCardsInChunks, cardBunchRepository } from "@bingo/game-core";
import { CardType } from "@bingo/domain";

export async function POST(request: NextRequest) {
  // Validate session
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse request body
  const body = await request.json();
  const { name, cardType, count } = body as CreateCardBunchJobInput;

  // Validate input
  if (!name || !cardType || !count) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Validate cardType is valid
  if (cardType !== 'bingo' && cardType !== 'bingote') {
    return NextResponse.json({ error: "Invalid card type. Must be 'bingo' or 'bingote'" }, { status: 400 });
  }

  // Create job for progress tracking
  const jobId = cardBunchJobService.createJob({ name, cardType, count });

  // Start background task (don't await)
  generateCardsBackgroundTask(jobId, name, cardType as CardType, count);

  // Return jobId immediately
  return NextResponse.json({ jobId });
}

async function generateCardsBackgroundTask(
  jobId: string,
  name: string,
  cardType: CardType,
  count: number
) {
  try {
    // Step 1: Create CardBunch (metadata only, cards stored separately)
    const bunch = await cardBunchRepository.create({
      name,
      cardType,
    });

    // Step 2: Generate and save cards in chunks
    await generateAndSaveCardsInChunks({
      bunchId: bunch.id,
      cardType,
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
