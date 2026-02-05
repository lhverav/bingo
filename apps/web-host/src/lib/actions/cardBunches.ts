"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/actions/auth";
import {
  createCardBunch,
  getCardBunches,
  deleteCardBunch,
} from "@bingo/game-core";

export async function createCardBunchAction(formData: FormData) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/");
  }

  const name = formData.get("name") as string;
  const cardSize = parseInt(formData.get("cardSize") as string);
  const maxNumber = parseInt(formData.get("maxNumber") as string);
  const count = parseInt(formData.get("count") as string);

  try {
    await createCardBunch({
      name,
      cardSize,
      maxNumber,
      count,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al crear el grupo de cartas";
    redirect(`/host/cartas/crear?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/host/cartas");
  redirect("/host/cartas");
}

export async function deleteCardBunchAction(formData: FormData) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/");
  }

  const id = formData.get("id") as string;

  try {
    await deleteCardBunch(id);
    revalidatePath("/host/cartas");
  } catch (error) {
    console.error("Error deleting card bunch:", error);
  }

  redirect("/host/cartas");
}

export async function getAllCardBunchesAction() {
  const session = await getSession();

  if (!session.isLoggedIn) {
    return [];
  }

  return getCardBunches();
}
