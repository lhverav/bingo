"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/actions/auth";
import {
  getCardBunches,
  deleteCardBunch,
} from "@bingo/game-core";

// Note: Card bunch creation is handled via API route with background job
// See: /api/card-bunch/create/route.ts

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
