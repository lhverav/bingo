import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/actions/auth";
import { drawNumber } from "@bingo/game-core";

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

    return NextResponse.json({ success: true, drawnNumbers: round.drawnNumbers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
