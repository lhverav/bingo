"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/actions/auth";
import { roundRepository, gameRepository } from "@bingo/game-core";
import { CreateRoundData, Currency } from "@bingo/domain";

export interface CreateGameRoundInput {
  gameId: string;
  name: string;
  patternId: string;
  isPaid: boolean;
  pricePerCard?: number;
  currency?: Currency;
}

export interface UpdateGameRoundInput {
  name?: string;
  patternId?: string;
  isPaid?: boolean;
  pricePerCard?: number;
  currency?: Currency;
}

export async function createGameRoundAction(formData: FormData) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/");
  }

  const gameId = formData.get("gameId") as string;
  const name = formData.get("name") as string;
  const patternId = formData.get("patternId") as string;
  const isPaid = formData.get("isPaid") === "true";
  const pricePerCard = isPaid
    ? parseFloat(formData.get("pricePerCard") as string)
    : undefined;
  const currency = isPaid ? (formData.get("currency") as Currency) : undefined;

  // Verify game exists and is scheduled
  const game = await gameRepository.findById(gameId);
  if (!game) {
    redirect(`/host/juegos?error=${encodeURIComponent("Juego no encontrado")}`);
    return;
  }

  if (game.status !== "scheduled") {
    redirect(
      `/host/juegos/${gameId}?error=${encodeURIComponent("Solo se pueden agregar rondas a juegos programados")}`
    );
    return;
  }

  try {
    // Get next order
    const order = await roundRepository.getNextOrder(gameId);

    const createData: CreateRoundData = {
      gameId,
      name,
      order,
      patternId,
      isPaid,
      pricePerCard,
      currency,
    };

    const round = await roundRepository.create(createData);

    // Notify mobile players about new round
    try {
      await fetch(
        `${process.env.MOBILE_SERVER_URL || "http://localhost:3001"}/notify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "ROUND_CREATED",
            data: {
              gameId,
              roundId: round.id,
              name: round.name,
              order: round.order,
              isPaid: round.isPaid,
              pricePerCard: round.pricePerCard,
              currency: round.currency,
            },
          }),
        }
      );
    } catch (notifyError) {
      console.error("Error notifying mobile players:", notifyError);
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al crear la ronda";
    redirect(
      `/host/juegos/${gameId}/rondas/crear?error=${encodeURIComponent(message)}`
    );
  }

  revalidatePath(`/host/juegos/${gameId}`);
  redirect(`/host/juegos/${gameId}`);
}

export async function updateGameRoundAction(formData: FormData) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/");
  }

  const gameId = formData.get("gameId") as string;
  const roundId = formData.get("roundId") as string;
  const name = formData.get("name") as string;
  const patternId = formData.get("patternId") as string;
  const isPaid = formData.get("isPaid") === "true";
  const pricePerCard = isPaid
    ? parseFloat(formData.get("pricePerCard") as string)
    : undefined;
  const currency = isPaid ? (formData.get("currency") as Currency) : undefined;

  // Verify round exists and is configurable
  const round = await roundRepository.findById(roundId);
  if (!round) {
    redirect(
      `/host/juegos/${gameId}?error=${encodeURIComponent("Ronda no encontrada")}`
    );
    return;
  }

  if (round.status !== "configurada") {
    redirect(
      `/host/juegos/${gameId}?error=${encodeURIComponent("Solo se pueden editar rondas configuradas")}`
    );
    return;
  }

  try {
    await roundRepository.update(roundId, {
      name,
      patternId,
      isPaid,
      pricePerCard,
      currency,
    });

    // Notify mobile players about round update
    try {
      await fetch(
        `${process.env.MOBILE_SERVER_URL || "http://localhost:3001"}/notify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "ROUND_UPDATED",
            data: {
              gameId,
              roundId,
              name,
              isPaid,
              pricePerCard,
              currency,
            },
          }),
        }
      );
    } catch (notifyError) {
      console.error("Error notifying mobile players:", notifyError);
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al actualizar la ronda";
    redirect(
      `/host/juegos/${gameId}/rondas/editar/${roundId}?error=${encodeURIComponent(message)}`
    );
  }

  revalidatePath(`/host/juegos/${gameId}`);
  redirect(`/host/juegos/${gameId}`);
}

export async function deleteGameRoundAction(formData: FormData) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/");
  }

  const gameId = formData.get("gameId") as string;
  const roundId = formData.get("roundId") as string;

  // Verify round exists and is configurable
  const round = await roundRepository.findById(roundId);
  if (!round) {
    redirect(
      `/host/juegos/${gameId}?error=${encodeURIComponent("Ronda no encontrada")}`
    );
    return;
  }

  if (round.status !== "configurada") {
    redirect(
      `/host/juegos/${gameId}?error=${encodeURIComponent("Solo se pueden eliminar rondas configuradas")}`
    );
    return;
  }

  try {
    await roundRepository.delete(roundId);

    // Notify mobile players about round deletion
    try {
      await fetch(
        `${process.env.MOBILE_SERVER_URL || "http://localhost:3001"}/notify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "ROUND_DELETED",
            data: { gameId, roundId },
          }),
        }
      );
    } catch (notifyError) {
      console.error("Error notifying mobile players:", notifyError);
    }

    revalidatePath(`/host/juegos/${gameId}`);
  } catch (error) {
    console.error("Error deleting round:", error);
  }

  redirect(`/host/juegos/${gameId}`);
}

export async function startGameRoundAction(formData: FormData) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/");
  }

  const gameId = formData.get("gameId") as string;
  const roundId = formData.get("roundId") as string;

  // Verify game is active
  const game = await gameRepository.findById(gameId);
  if (!game || game.status !== "active") {
    redirect(
      `/host/juegos/${gameId}?error=${encodeURIComponent("El juego debe estar activo para iniciar rondas")}`
    );
    return;
  }

  // Verify round is configurable
  const round = await roundRepository.findById(roundId);
  if (!round || round.status !== "configurada") {
    redirect(
      `/host/juegos/${gameId}?error=${encodeURIComponent("La ronda no puede ser iniciada")}`
    );
    return;
  }

  try {
    await roundRepository.updateStatus(roundId, "en_progreso");

    // Notify mobile players
    try {
      await fetch(
        `${process.env.MOBILE_SERVER_URL || "http://localhost:3001"}/notify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "ROUND_STARTED",
            data: { gameId, roundId },
          }),
        }
      );
    } catch (notifyError) {
      console.error("Error notifying mobile players:", notifyError);
    }

    revalidatePath(`/host/juegos/${gameId}`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al iniciar la ronda";
    redirect(
      `/host/juegos/${gameId}?error=${encodeURIComponent(message)}`
    );
  }

  redirect(`/host/juegos/${gameId}/rondas/${roundId}/jugar`);
}

export async function endGameRoundAction(formData: FormData) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/");
  }

  const gameId = formData.get("gameId") as string;
  const roundId = formData.get("roundId") as string;

  try {
    await roundRepository.updateStatus(roundId, "finalizada");

    // Notify mobile players
    try {
      await fetch(
        `${process.env.MOBILE_SERVER_URL || "http://localhost:3001"}/notify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "ROUND_ENDED",
            data: { gameId, roundId },
          }),
        }
      );
    } catch (notifyError) {
      console.error("Error notifying mobile players:", notifyError);
    }

    revalidatePath(`/host/juegos/${gameId}`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al finalizar la ronda";
    redirect(
      `/host/juegos/${gameId}?error=${encodeURIComponent(message)}`
    );
  }

  redirect(`/host/juegos/${gameId}`);
}
