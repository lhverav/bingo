import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/actions/auth";
import { drawNumber, checkForWinners } from "@bingo/game-core";

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

    const body = await request.json();
    const { number } = body;

    if (typeof number !== "number") {
      return NextResponse.json(
        { error: "Número inválido" },
        { status: 400 }
      );
    }

    const round = await drawNumber(params.id, number);

    if (!round) {
      return NextResponse.json(
        { error: "Ronda no encontrada" },
        { status: 404 }
      );
    }

    // Check for winners after drawing the number
    const winnerResult = await checkForWinners(params.id);

    // Notify mobile server about the drawn number and any winners
    try {
      await fetch(`${MOBILE_SERVER_URL}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "NUMBER_DRAWN",
          data: {
            roundId: params.id,
            number,
            winners: winnerResult.winners,
          },
        }),
      });
    } catch (notifyError) {
      // Log but don't fail the request if notification fails
      console.error("Failed to notify mobile server:", notifyError);
    }

    return NextResponse.json({
      success: true,
      drawnNumbers: round.drawnNumbers,
      winners: winnerResult.winners,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
