import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/actions/auth";
import { getPlayersByRound } from "@bingo/game-core";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const players = await getPlayersByRound(params.id);
    return NextResponse.json({ players });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener jugadores";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
