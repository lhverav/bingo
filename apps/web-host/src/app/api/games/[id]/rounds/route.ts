import { NextRequest, NextResponse } from "next/server";
import { roundRepository, patternRepository, getGameById } from "@bingo/game-core";
import { RoundWithPattern } from "@bingo/domain";

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

    const rounds = await roundRepository.findByGameId(params.id);
    const patterns = await patternRepository.findByCardType(game.cardType);
    const patternMap = new Map(patterns.map((p) => [p.id, p]));

    // Enrich rounds with pattern info
    const roundsWithPattern: RoundWithPattern[] = rounds.map((round) => {
      const pattern = patternMap.get(round.patternId);
      return {
        ...round,
        patternName: pattern?.name,
        patternCells: pattern?.cells,
      };
    });

    return NextResponse.json(roundsWithPattern);
  } catch (error) {
    console.error("Error getting rounds:", error);
    return NextResponse.json(
      { error: "Error al obtener las rondas" },
      { status: 500 }
    );
  }
}
