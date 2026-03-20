import { NextResponse } from "next/server";
import { getAllGamesWithRoundCount, getUpcomingGames } from "@bingo/game-core";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const upcoming = searchParams.get("upcoming") === "true";

    if (upcoming) {
      const games = await getUpcomingGames();
      return NextResponse.json(games);
    }

    const games = await getAllGamesWithRoundCount();
    return NextResponse.json(games);
  } catch (error) {
    console.error("Error getting games:", error);
    return NextResponse.json(
      { error: "Error al obtener juegos" },
      { status: 500 }
    );
  }
}
