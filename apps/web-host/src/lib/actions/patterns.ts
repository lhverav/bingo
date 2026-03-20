"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/actions/auth";
import {
  createPattern,
  updatePattern,
  deletePattern,
  getPatternById,
  getPatternsByCardType,
  getAllPatterns,
} from "@bingo/game-core";
import { CardType } from "@bingo/domain";

export async function createPatternAction(formData: FormData) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/");
  }

  const name = formData.get("name") as string;
  const cardType = formData.get("cardType") as CardType;
  const cellsJson = formData.get("cells") as string;

  let cells: boolean[][];
  try {
    cells = JSON.parse(cellsJson);
  } catch {
    redirect(`/host/patrones/crear?error=${encodeURIComponent("Error en el formato del patrón")}`);
    return;
  }

  try {
    await createPattern({
      name,
      cardType,
      cells,
      isPreset: false,
      createdBy: session.userId,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al crear el patrón";
    redirect(`/host/patrones/crear?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/host/patrones");
  redirect("/host/patrones");
}

export async function updatePatternAction(formData: FormData) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/");
  }

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const cellsJson = formData.get("cells") as string;

  let cells: boolean[][] | undefined;
  if (cellsJson) {
    try {
      cells = JSON.parse(cellsJson);
    } catch {
      redirect(`/host/patrones/editar/${id}?error=${encodeURIComponent("Error en el formato del patrón")}`);
      return;
    }
  }

  try {
    await updatePattern(id, {
      name,
      cells,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al actualizar el patrón";
    redirect(`/host/patrones/editar/${id}?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/host/patrones");
  redirect("/host/patrones");
}

export async function deletePatternAction(formData: FormData) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/");
  }

  const id = formData.get("id") as string;

  try {
    await deletePattern(id);
    revalidatePath("/host/patrones");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al eliminar el patrón";
    redirect(`/host/patrones?error=${encodeURIComponent(message)}`);
  }

  redirect("/host/patrones");
}

export async function getPatternAction(id: string) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    return null;
  }

  return getPatternById(id);
}

export async function getPatternsAction() {
  const session = await getSession();

  if (!session.isLoggedIn) {
    return [];
  }

  return getAllPatterns();
}

export async function getPatternsByCardTypeAction(cardType: CardType) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    return [];
  }

  return getPatternsByCardType(cardType);
}
