import { NextRequest, NextResponse } from "next/server";
import { publishGame } from "@bingo/game-core";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await publishGame(params.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result.game);
  } catch (error) {
    console.error("Error publishing game:", error);
    return NextResponse.json(
      { error: "Error al publicar el juego" },
      { status: 500 }
    );
  }
}
