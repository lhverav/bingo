import { getSession } from "@/lib/actions/auth";
import { redirect, notFound } from "next/navigation";
import { getGameById } from "@bingo/game-core";
import { updateGameAction } from "@/lib/actions/games";
import Link from "next/link";
import { ALL_CARD_TYPES, CARD_TYPE_LABELS } from "@bingo/domain";

function formatDateForInput(date: Date): string {
  const d = new Date(date);
  // Format: YYYY-MM-DDTHH:mm
  return d.toISOString().slice(0, 16);
}

export default async function EditarJuegoPage({
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

  // Can only edit scheduled games
  if (game.status !== "scheduled") {
    redirect(`/host/juegos/${params.id}`);
  }

  const error = searchParams.error;

  return (
    <main className="page-container">
      <div className="page-header">
        <Link href={`/host/juegos/${params.id}`} className="back-link">
          &larr; Volver al Juego
        </Link>
        <h1>Editar Juego</h1>
      </div>

      {error && <div className="error-message">{decodeURIComponent(error)}</div>}

      <form action={updateGameAction} className="form-container">
        <input type="hidden" name="id" value={game.id} />

        <div className="form-group">
          <label htmlFor="name">Nombre del Juego</label>
          <input
            type="text"
            id="name"
            name="name"
            required
            defaultValue={game.name}
          />
        </div>

        <div className="form-group">
          <label htmlFor="cardType">Tipo de Cartón</label>
          <select id="cardType" name="cardType" required defaultValue={game.cardType}>
            {ALL_CARD_TYPES.map((type) => (
              <option key={type} value={type}>
                {CARD_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
          <small className="form-help">
            BINGO: 5x5 (números 1-75) | BINGOTE: 7x5 (números 1-103)
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="scheduledAt">Fecha y Hora Programada</label>
          <input
            type="datetime-local"
            id="scheduledAt"
            name="scheduledAt"
            required
            defaultValue={formatDateForInput(game.scheduledAt)}
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            Guardar Cambios
          </button>
          <Link href={`/host/juegos/${params.id}`} className="btn-secondary">
            Cancelar
          </Link>
        </div>
      </form>
    </main>
  );
}
