import { NextResponse } from "next/server";
import { getPublishedGame } from "@bingo/game-core";

export async function GET() {
  try {
    const game = await getPublishedGame();

    // Return null if no game is published (not an error)
    return NextResponse.json(game);
  } catch (error) {
    console.error("Error getting published game:", error);
    return NextResponse.json(
      { error: "Error al obtener el juego publicado" },
      { status: 500 }
    );
  }
}
