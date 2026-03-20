import { getSession } from "@/lib/actions/auth";
import { redirect, notFound } from "next/navigation";
import { getGameById, getPatternById, getPlayersByRound, roundRepository } from "@bingo/game-core";
import Link from "next/link";
import { CARD_TYPE_CONFIG } from "@bingo/domain";
import GameRoundBoard from "./GameRoundBoard";

export default async function JugarRondaPage({
  params,
}: {
  params: { id: string; roundId: string };
}) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/");
  }

  const game = await getGameById(params.id);
  if (!game) {
    notFound();
  }

  const round = await roundRepository.findById(params.roundId);
  if (!round) {
    notFound();
  }

  if (round.status === "configurada") {
    redirect(
      `/host/juegos/${params.id}?error=${encodeURIComponent("La ronda no ha sido iniciada")}`
    );
  }

  const pattern = await getPatternById(round.patternId);
  const players = await getPlayersByRound(params.roundId);

  // Get number range from card type config
  const cardTypeConfig = CARD_TYPE_CONFIG[game.cardType];
  const maxNumber = cardTypeConfig.totalNumbers;

  // Generate all possible numbers (1 to max)
  const allNumbers: number[] = [];
  for (let i = 1; i <= maxNumber; i++) {
    allNumbers.push(i);
  }

  return (
    <main className="game-container">
      <div className="game-header">
        <Link href={`/host/juegos/${params.id}`} className="back-link">
          &larr; Salir
        </Link>
        <div className="game-info">
          <h1>{round.name}</h1>
          <span className="game-subtitle">{game.name}</span>
          <span className="game-pattern">
            Patrón: {pattern?.name || "Desconocido"}
          </span>
        </div>
        {round.status === "finalizada" && (
          <span className="status-badge status-finished">Finalizada</span>
        )}
      </div>

      <GameRoundBoard
        gameId={params.id}
        roundId={params.roundId}
        allNumbers={allNumbers}
        drawnNumbers={round.drawnNumbers}
        isFinished={round.status === "finalizada"}
        maxNumber={maxNumber}
        initialPlayers={players}
        patternCells={pattern?.cells}
        cardType={game.cardType}
      />
    </main>
  );
}
