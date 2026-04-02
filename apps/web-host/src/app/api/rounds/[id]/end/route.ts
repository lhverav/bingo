import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/actions/auth";
import { endRound, checkForWinners, countPlayersInRound } from "@bingo/game-core";

const MOBILE_SERVER_URL = process.env.MOBILE_SERVER_URL || "http://localhost:3001";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Get winners before ending the round
    const winnerResult = await checkForWinners(params.id);
    const totalPlayers = await countPlayersInRound(params.id);

    const round = await endRound(params.id);

    if (!round) {
      return NextResponse.json(
        { error: "Ronda no encontrada" },
        { status: 404 }
      );
    }

    // Notify mobile server about the round ending with summary
    try {
      await fetch(`${MOBILE_SERVER_URL}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ROUND_ENDED",
          data: {
            roundId: params.id,
            winners: winnerResult.winners,
            patternName: winnerResult.patternName,
            totalPlayers,
            numbersDrawn: round.drawnNumbers?.length || 0,
          },
        }),
      });
    } catch (notifyError) {
      // Log but don't fail the request if notification fails
      console.error("Failed to notify mobile server:", notifyError);
    }

    return NextResponse.json({ success: true, status: round.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
