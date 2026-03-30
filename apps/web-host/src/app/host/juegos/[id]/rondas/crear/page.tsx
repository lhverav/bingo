import { getSession } from "@/lib/actions/auth";
import { redirect, notFound } from "next/navigation";
import { getGameById, getPatternsByCardType } from "@bingo/game-core";
import { createGameRoundAction } from "@/lib/actions/gameRounds";
import Link from "next/link";

export default async function CrearRondaPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/");
  }

  const game = await getGameById(params.id);

  if (!game) {
    notFound();
  }

  // Can only add rounds to scheduled or active games
  if (game.status !== "scheduled" && game.status !== "active") {
    redirect(`/host/juegos/${params.id}`);
  }

  const patterns = await getPatternsByCardType(game.cardType);
  const error = searchParams.error;

  return (
    <main className="page-container">
      <div className="page-header">
        <Link href={`/host/juegos/${params.id}`} className="back-link">
          &larr; Volver al Juego
        </Link>
        <h1>Agregar Ronda</h1>
        <p className="subtitle">Juego: {game.name}</p>
      </div>

      {error && <div className="error-message">{decodeURIComponent(error)}</div>}

      <form action={createGameRoundAction} className="form-container">
        <input type="hidden" name="gameId" value={params.id} />

        <div className="form-group">
          <label htmlFor="name">Nombre de la Ronda</label>
          <input
            type="text"
            id="name"
            name="name"
            required
            placeholder="Ej: Ronda 1 - Linea"
          />
        </div>

        <div className="form-group">
          <label htmlFor="patternId">Patron de Victoria</label>
          <select id="patternId" name="patternId" required>
            <option value="">Selecciona un patron</option>
            {patterns.map((pattern) => (
              <option key={pattern.id} value={pattern.id}>
                {pattern.name} {pattern.isPreset && "(Predefinido)"}
              </option>
            ))}
          </select>
          {patterns.length === 0 && (
            <small className="form-warning">
              No hay patrones disponibles. Ejecuta el seed o crea patrones primero.
            </small>
          )}
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            Crear Ronda
          </button>
          <Link href={`/host/juegos/${params.id}`} className="btn-secondary">
            Cancelar
          </Link>
        </div>
      </form>
    </main>
  );
}
