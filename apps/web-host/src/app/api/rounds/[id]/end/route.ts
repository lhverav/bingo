import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/actions/auth";
import { endRound } from "@/lib/services/roundService";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const round = await endRound(params.id);

    if (!round) {
      return NextResponse.json(
        { error: "Ronda no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, status: round.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
