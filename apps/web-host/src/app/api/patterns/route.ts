import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/actions/auth";
import { createPattern, getAllPatterns } from "@bingo/game-core";
import { CardType } from "@bingo/domain";

export async function GET() {
  try {
    const session = await getSession();

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const patterns = await getAllPatterns();
    return NextResponse.json(patterns);
  } catch (error) {
    console.error("Error getting patterns:", error);
    return NextResponse.json(
      { error: "Error al obtener patrones" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { name, cardType, cells } = body as {
      name: string;
      cardType: CardType;
      cells: boolean[][];
    };

    if (!name || !cardType || !cells) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    const pattern = await createPattern({
      name,
      cardType,
      cells,
      isPreset: false,
      createdBy: session.userId,
    });

    return NextResponse.json(pattern, { status: 201 });
  } catch (error) {
    console.error("Error creating pattern:", error);
    const message =
      error instanceof Error ? error.message : "Error al crear el patrón";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
