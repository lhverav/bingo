import { NextResponse } from "next/server";
import { getGeneralParameters } from "@bingo/game-core";

export async function GET() {
  try {
    const params = await getGeneralParameters();
    return NextResponse.json(params);
  } catch (error) {
    console.error("Error getting general parameters:", error);
    return NextResponse.json(
      { error: "Error al obtener parámetros generales" },
      { status: 500 }
    );
  }
}
