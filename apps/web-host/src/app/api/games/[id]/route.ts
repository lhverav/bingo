import { NextRequest, NextResponse } from "next/server";
import { getGameById } from "@bingo/game-core";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const game = await getGameById(params.id);

    if (!game) {
      return NextResponse.json(
        { error: "Juego no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(game);
  } catch (error) {
    console.error("Error getting game:", error);
    return NextResponse.json(
      { error: "Error al obtener el juego" },
      { status: 500 }
    );
  }
}
