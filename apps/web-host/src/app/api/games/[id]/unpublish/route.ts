import { NextRequest, NextResponse } from "next/server";
import { unpublishGame } from "@bingo/game-core";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await unpublishGame(params.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result.game);
  } catch (error) {
    console.error("Error unpublishing game:", error);
    return NextResponse.json(
      { error: "Error al despublicar el juego" },
      { status: 500 }
    );
  }
}
