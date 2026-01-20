import { getSession } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import { getRoundById } from "@/lib/services/roundService";
import Link from "next/link";
import { notFound } from "next/navigation";
import GameBoard from "./GameBoard";

const patternLabels: Record<string, string> = {
  linea: "Línea",
  columna: "Columna",
  diagonal: "Diagonal",
  completo: "Completo",
  figura_especial: "Figura Especial",
};

export default async function JugarRondaPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/");
  }

  const round = await getRoundById(params.id);

  if (!round) {
    notFound();
  }

  if (round.status === "configurada") {
    redirect(`/host/rondas/${params.id}?error=${encodeURIComponent("La ronda no ha sido iniciada")}`);
  }

  // Generate all possible numbers (1 to maxNumber)
  const allNumbers: number[] = [];
  for (let i = 1; i <= round.maxNumber; i++) {
    allNumbers.push(i);
  }

  return (
    <main className="game-container">
      <div className="game-header">
        <Link href="/host/rondas" className="back-link">
          &larr; Salir
        </Link>
        <div className="game-info">
          <h1>{round.name}</h1>
          <span className="game-pattern">Patrón: {patternLabels[round.gamePattern]}</span>
        </div>
        {round.status === "finalizada" && (
          <span className="status-badge status-finished">Finalizada</span>
        )}
      </div>

      <GameBoard
        roundId={params.id}
        allNumbers={allNumbers}
        drawnNumbers={round.drawnNumbers}
        isFinished={round.status === "finalizada"}
        maxNumber={round.maxNumber}
      />
    </main>
  );
}
