import { getSession } from "@/lib/actions/auth";
import { redirect, notFound } from "next/navigation";
import { getGameById, getPatternsByCardType, roundRepository } from "@bingo/game-core";
import { updateGameRoundAction, deleteGameRoundAction } from "@/lib/actions/gameRounds";
import Link from "next/link";
import { ALL_CURRENCIES, CURRENCY_LABELS } from "@bingo/domain";

export default async function EditarRondaPage({
  params,
  searchParams,
}: {
  params: { id: string; roundId: string };
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

  const round = await roundRepository.findById(params.roundId);
  if (!round) {
    notFound();
  }

  // Can only edit configured rounds
  if (round.status !== "configurada") {
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
        <h1>Editar Ronda</h1>
        <p className="subtitle">Juego: {game.name}</p>
      </div>

      {error && <div className="error-message">{decodeURIComponent(error)}</div>}

      <form action={updateGameRoundAction} className="form-container">
        <input type="hidden" name="gameId" value={params.id} />
        <input type="hidden" name="roundId" value={params.roundId} />

        <div className="form-group">
          <label htmlFor="name">Nombre de la Ronda</label>
          <input
            type="text"
            id="name"
            name="name"
            required
            defaultValue={round.name}
          />
        </div>

        <div className="form-group">
          <label htmlFor="patternId">Patrón de Victoria</label>
          <select
            id="patternId"
            name="patternId"
            required
            defaultValue={round.patternId}
          >
            <option value="">Selecciona un patrón</option>
            {patterns.map((pattern) => (
              <option key={pattern.id} value={pattern.id}>
                {pattern.name} {pattern.isPreset && "(Predefinido)"}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="form-fieldset">
          <legend>Tipo de Ronda</legend>

          <div className="form-radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="isPaid"
                value="false"
                defaultChecked={!round.isPaid}
              />
              <span>Ronda Gratis</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="isPaid"
                value="true"
                defaultChecked={round.isPaid}
              />
              <span>Ronda Paga</span>
            </label>
          </div>

          <div className="paid-options">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="pricePerCard">Precio por Cartón</label>
                <input
                  type="number"
                  id="pricePerCard"
                  name="pricePerCard"
                  min="0"
                  step="0.01"
                  defaultValue={round.pricePerCard}
                />
              </div>

              <div className="form-group">
                <label htmlFor="currency">Moneda</label>
                <select
                  id="currency"
                  name="currency"
                  defaultValue={round.currency}
                >
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
            Guardar Cambios
          </button>
          <Link href={`/host/juegos/${params.id}`} className="btn-secondary">
            Cancelar
          </Link>
        </div>
      </form>

      <div className="danger-zone">
        <h3>Zona de Peligro</h3>
        <form action={deleteGameRoundAction}>
          <input type="hidden" name="gameId" value={params.id} />
          <input type="hidden" name="roundId" value={params.roundId} />
          <button type="submit" className="btn-danger">
            Eliminar Ronda
          </button>
        </form>
      </div>
    </main>
  );
}
