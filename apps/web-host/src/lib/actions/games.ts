"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/actions/auth";
import {
  createGame,
  updateGame,
  deleteGame,
  startGame,
  finishGame,
  cancelGame,
  getGameById,
  getAllGamesWithRoundCount,
} from "@bingo/game-core";
import { CardType, Currency } from "@bingo/domain";

export async function createGameAction(formData: FormData) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/");
  }

  const name = formData.get("name") as string;
  const cardType = formData.get("cardType") as CardType;
  const cardBunchId = formData.get("cardBunchId") as string | null;
  const scheduledAtStr = formData.get("scheduledAt") as string;
  const scheduledAt = new Date(scheduledAtStr);
  const isPaid = formData.get("isPaid") === "true";
  const pricePerCardStr = formData.get("pricePerCard") as string | null;
  const pricePerCard = pricePerCardStr ? parseFloat(pricePerCardStr) : undefined;
  const currency = (formData.get("currency") as Currency | null) || undefined;

  let gameId: string;

  try {
    const game = await createGame({
      name,
      cardType,
      cardBunchId: cardBunchId || undefined,
      scheduledAt,
      createdBy: session.userId,
      isPaid,
      pricePerCard: isPaid ? pricePerCard : undefined,
      currency: isPaid ? currency : undefined,
    });
    gameId = game.id;

    // Notify mobile players about new game
    try {
      const notifyUrl = `${process.env.MOBILE_SERVER_URL || 'http://localhost:3001'}/notify`;
      console.log(`[games] Sending GAME_CREATED notification to ${notifyUrl}`);
      const notifyResponse = await fetch(notifyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "GAME_CREATED",
          data: {
            gameId: game.id,
            name: game.name,
            cardType: game.cardType,
            scheduledAt: game.scheduledAt,
          },
        }),
      });
      console.log(`[games] GAME_CREATED notification response:`, notifyResponse.status);
    } catch (notifyError) {
      console.error("[games] Error notifying mobile players:", notifyError);
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al crear el juego";
    redirect(`/host/juegos/crear?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/host/juegos");
  redirect(`/host/juegos/${gameId}`);
}

export async function updateGameAction(formData: FormData) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/");
  }

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const cardType = formData.get("cardType") as CardType;
  const cardBunchId = formData.get("cardBunchId") as string | null;
  const scheduledAtStr = formData.get("scheduledAt") as string;
  const scheduledAt = new Date(scheduledAtStr);
  const isPaid = formData.get("isPaid") === "true";
  const pricePerCardStr = formData.get("pricePerCard") as string | null;
  const pricePerCard = pricePerCardStr ? parseFloat(pricePerCardStr) : undefined;
  const currency = (formData.get("currency") as Currency | null) || undefined;

  try {
    await updateGame(id, {
      name,
      cardType,
      cardBunchId: cardBunchId || undefined,
      scheduledAt,
      isPaid,
      pricePerCard: isPaid ? pricePerCard : undefined,
      currency: isPaid ? currency : undefined,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al actualizar el juego";
    redirect(`/host/juegos/editar/${id}?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/host/juegos");
  revalidatePath(`/host/juegos/${id}`);
  redirect(`/host/juegos/${id}`);
}

export async function deleteGameAction(formData: FormData) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/");
  }

  const id = formData.get("id") as string;

  try {
    await deleteGame(id);

    // Notify mobile players about game deletion
    try {
      await fetch(`${process.env.MOBILE_SERVER_URL || 'http://localhost:3001'}/notify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "GAME_DELETED",
          data: {
            gameId: id,
          },
        }),
      });
    } catch (notifyError) {
      console.error("Error notifying mobile players:", notifyError);
    }

    revalidatePath("/host/juegos");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al eliminar el juego";
    redirect(`/host/juegos?error=${encodeURIComponent(message)}`);
  }

  redirect("/host/juegos");
}

export async function startGameAction(formData: FormData) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/");
  }

  const id = formData.get("id") as string;

  try {
    await startGame(id);

    // Notify mobile players
    try {
      await fetch(`${process.env.MOBILE_SERVER_URL || 'http://localhost:3001'}/notify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type: "GAME_STARTED", data: { gameId: id } }),
      });
    } catch (notifyError) {
      console.error("Error notifying mobile players:", notifyError);
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al iniciar el juego";
    redirect(`/host/juegos/${id}?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/host/juegos");
  revalidatePath(`/host/juegos/${id}`);
  redirect(`/host/juegos/${id}`);
}

export async function finishGameAction(formData: FormData) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/");
  }

  const id = formData.get("id") as string;

  try {
    await finishGame(id);

    // Notify mobile players
    try {
      await fetch(`${process.env.MOBILE_SERVER_URL || 'http://localhost:3001'}/notify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type: "GAME_FINISHED", data: { gameId: id } }),
      });
    } catch (notifyError) {
      console.error("Error notifying mobile players:", notifyError);
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al finalizar el juego";
    redirect(`/host/juegos/${id}?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/host/juegos");
  revalidatePath(`/host/juegos/${id}`);
  redirect(`/host/juegos/${id}`);
}

export async function cancelGameAction(formData: FormData) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/");
  }

  const id = formData.get("id") as string;

  try {
    await cancelGame(id);

    // Notify mobile players
    try {
      await fetch(`${process.env.MOBILE_SERVER_URL || 'http://localhost:3001'}/notify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type: "GAME_CANCELLED", data: { gameId: id } }),
      });
    } catch (notifyError) {
      console.error("Error notifying mobile players:", notifyError);
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al cancelar el juego";
    redirect(`/host/juegos/${id}?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/host/juegos");
  revalidatePath(`/host/juegos/${id}`);
  redirect(`/host/juegos/${id}`);
}

export async function getGameAction(id: string) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    return null;
  }

  return getGameById(id);
}

export async function getGamesAction() {
  const session = await getSession();

  if (!session.isLoggedIn) {
    return [];
  }

  return getAllGamesWithRoundCount();
}
