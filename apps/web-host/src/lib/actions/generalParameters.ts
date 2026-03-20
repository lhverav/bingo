"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/actions/auth";
import {
  getGeneralParameters,
  updateGeneralParameters,
  resetGeneralParameters,
} from "@bingo/game-core";

export async function updateGeneralParametersAction(formData: FormData) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/");
  }

  const selectionTimeSeconds = parseInt(
    formData.get("selectionTimeSeconds") as string
  );
  const freeCardsDelivered = parseInt(
    formData.get("freeCardsDelivered") as string
  );
  const freeCardsToSelect = parseInt(
    formData.get("freeCardsToSelect") as string
  );
  const maxCardsToBuy = parseInt(formData.get("maxCardsToBuy") as string);
  const paidCardsToIssue = parseInt(formData.get("paidCardsToIssue") as string);

  try {
    await updateGeneralParameters({
      selectionTimeSeconds,
      freeCardsDelivered,
      freeCardsToSelect,
      maxCardsToBuy,
      paidCardsToIssue,
    });

    revalidatePath("/host/parametros");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al guardar los parámetros";
    redirect(`/host/parametros?error=${encodeURIComponent(message)}`);
  }

  redirect("/host/parametros?success=1");
}

export async function resetGeneralParametersAction() {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/");
  }

  try {
    await resetGeneralParameters();
    revalidatePath("/host/parametros");
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Error al restablecer los parámetros";
    redirect(`/host/parametros?error=${encodeURIComponent(message)}`);
  }

  redirect("/host/parametros?success=1");
}

export async function getGeneralParametersAction() {
  const session = await getSession();

  if (!session.isLoggedIn) {
    return null;
  }

  return getGeneralParameters();
}
