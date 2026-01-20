"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/actions/auth";
import {
  createRound,
  updateRound,
  deleteRound,
  startRound,
  getRoundById,
} from "@/lib/services/roundService";
import { GamePattern, StartMode } from "@/lib/models/round";

export async function createRoundAction(formData: FormData) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/");
  }

  const name = formData.get("name") as string;
  const cardSize = parseInt(formData.get("cardSize") as string);
  const maxNumber = parseInt(formData.get("maxNumber") as string);
  const gamePattern = formData.get("gamePattern") as GamePattern;
  const startMode = formData.get("startMode") as StartMode;
  const autoStartDelay = formData.get("autoStartDelay")
    ? parseInt(formData.get("autoStartDelay") as string)
    : undefined;

  try {
    await createRound({
      name,
      cardSize,
      maxNumber,
      gamePattern,
      startMode,
      autoStartDelay: startMode === "automatico" ? autoStartDelay : undefined,
      createdBy: session.userId,
    });
  } catch (error) {
    console.log("LOG: Llega al error", error);
    const message =
      error instanceof Error ? error.message : "Error al crear la ronda";
    redirect(`/host/rondas/crear?error=${encodeURIComponent(message)}`);
  }
  revalidatePath("/host/rondas");
  redirect("/host/rondas");
}

export async function updateRoundAction(formData: FormData) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/");
  }

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const cardSize = parseInt(formData.get("cardSize") as string);
  const maxNumber = parseInt(formData.get("maxNumber") as string);
  const gamePattern = formData.get("gamePattern") as GamePattern;
  const startMode = formData.get("startMode") as StartMode;
  const autoStartDelay = formData.get("autoStartDelay")
    ? parseInt(formData.get("autoStartDelay") as string)
    : undefined;

  try {
    await updateRound(id, {
      name,
      cardSize,
      maxNumber,
      gamePattern,
      startMode,
      autoStartDelay: startMode === "automatico" ? autoStartDelay : undefined,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al actualizar la ronda";
    redirect(`/host/rondas/editar/${id}?error=${encodeURIComponent(message)}`);
  }
  revalidatePath("/host/rondas");
  redirect("/host/rondas");
}

export async function deleteRoundAction(formData: FormData) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/");
  }

  const id = formData.get("id") as string;

  try {
    await deleteRound(id);
    revalidatePath("/host/rondas");
  } catch (error) {
    console.error("Error deleting round:", error);
  }

  redirect("/host/rondas");
}

export async function startRoundAction(formData: FormData) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/");
  }

  const id = formData.get("id") as string;

  try {
    await startRound(id);
    revalidatePath("/host/rondas");
    redirect(`/host/rondas/${id}/jugar`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al iniciar la ronda";
    redirect(`/host/rondas?error=${encodeURIComponent(message)}`);
  }
}

export async function getRoundAction(id: string) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    return null;
  }

  return getRoundById(id);
}
