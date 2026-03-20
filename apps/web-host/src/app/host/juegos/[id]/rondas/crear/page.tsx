import { getSession } from "@/lib/actions/auth";
import { redirect, notFound } from "next/navigation";
import { getGameById, getPatternsByCardType } from "@bingo/game-core";
import { createGameRoundAction } from "@/lib/actions/gameRounds";
import Link from "next/link";
import { ALL_CURRENCIES, CURRENCY_LABELS } from "@bingo/domain";

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

  // Can only add rounds to scheduled games
  if (game.status !== "scheduled") {
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
            placeholder="Ej: Ronda 1 - Línea"
          />
        </div>

        <div className="form-group">
          <label htmlFor="patternId">Patrón de Victoria</label>
          <select id="patternId" name="patternId" required>
            <option value="">Selecciona un patrón</option>
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

        <fieldset className="form-fieldset">
          <legend>Tipo de Ronda</legend>

          <div className="form-radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="isPaid"
                value="false"
                defaultChecked
              />
              <span>Ronda Gratis</span>
            </label>
            <label className="radio-label">
              <input type="radio" name="isPaid" value="true" />
              <span>Ronda Paga</span>
            </label>
          </div>

          <div className="paid-options" id="paidOptions">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="pricePerCard">Precio por Cartón</label>
                <input
                  type="number"
                  id="pricePerCard"
                  name="pricePerCard"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label htmlFor="currency">Moneda</label>
                <select id="currency" name="currency">
                  {ALL_CURRENCIES.map((curr) => (
                    <option key={curr} value={curr}>
                      {CURRENCY_LABELS[curr]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </fieldset>

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
