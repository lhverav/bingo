import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/actions/auth";
import { getPatternById, updatePattern, deletePattern } from "@bingo/game-core";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const pattern = await getPatternById(params.id);

    if (!pattern) {
      return NextResponse.json(
        { error: "Patrón no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(pattern);
  } catch (error) {
    console.error("Error getting pattern:", error);
    return NextResponse.json(
      { error: "Error al obtener el patrón" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { name, cells } = body as {
      name?: string;
      cells?: boolean[][];
    };

    const pattern = await updatePattern(params.id, { name, cells });

    if (!pattern) {
      return NextResponse.json(
        { error: "Patrón no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(pattern);
  } catch (error) {
    console.error("Error updating pattern:", error);
    const message =
      error instanceof Error ? error.message : "Error al actualizar el patrón";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const deleted = await deletePattern(params.id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Patrón no encontrado o es predefinido" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting pattern:", error);
    const message =
      error instanceof Error ? error.message : "Error al eliminar el patrón";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
