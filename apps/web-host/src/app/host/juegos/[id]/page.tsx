import { getSession } from "@/lib/actions/auth";
import { redirect, notFound } from "next/navigation";
import { getGameById } from "@bingo/game-core";
import { roundRepository, patternRepository } from "@bingo/game-core";
import {
  startGameAction,
  finishGameAction,
  cancelGameAction,
} from "@/lib/actions/games";
import { startGameRoundAction } from "@/lib/actions/gameRounds";
import Link from "next/link";
import { CARD_TYPE_LABELS } from "@bingo/domain";

const statusLabels: Record<string, string> = {
  scheduled: "Programado",
  active: "Activo",
  finished: "Finalizado",
  cancelled: "Cancelado",
};

const statusColors: Record<string, string> = {
  scheduled: "status-configured",
  active: "status-active",
  finished: "status-finished",
  cancelled: "status-cancelled",
};

const roundStatusLabels: Record<string, string> = {
  configurada: "Configurada",
  en_progreso: "En Progreso",
  finalizada: "Finalizada",
  cancelada: "Cancelada",
};

const roundStatusColors: Record<string, string> = {
  configurada: "status-configured",
  en_progreso: "status-active",
  finalizada: "status-finished",
  cancelada: "status-cancelled",
};

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function VerJuegoPage({
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

  const rounds = await roundRepository.findByGameId(params.id);
  const patterns = await patternRepository.findByCardType(game.cardType);
  const patternMap = new Map(patterns.map((p) => [p.id, p.name]));

  const error = searchParams.error;

  return (
    <main className="page-container">
      <div className="page-header">
        <Link href="/host/juegos" className="back-link">
          &larr; Volver a Juegos
        </Link>
        <h1>{game.name}</h1>
      </div>

      {error && <div className="error-message">{decodeURIComponent(error)}</div>}

      <div className="game-details">
        <div className="detail-card">
          <h3>Información del Juego</h3>
          <dl>
            <dt>Tipo de Cartón</dt>
            <dd>{CARD_TYPE_LABELS[game.cardType]}</dd>

            <dt>Fecha Programada</dt>
            <dd>{formatDate(game.scheduledAt)}</dd>

            <dt>Estado</dt>
            <dd>
              <span className={`status-badge ${statusColors[game.status]}`}>
                {statusLabels[game.status]}
              </span>
            </dd>
          </dl>

          <div className="detail-actions">
            {game.status === "scheduled" && (
              <>
                <Link
                  href={`/host/juegos/editar/${game.id}`}
                  className="btn-secondary"
                >
                  Editar Juego
                </Link>

                <form action={startGameAction} style={{ display: "inline" }}>
                  <input type="hidden" name="id" value={game.id} />
                  <button type="submit" className="btn-primary">
                    Iniciar Juego
                  </button>
                </form>
              </>
            )}

            {game.status === "active" && (
              <form action={finishGameAction} style={{ display: "inline" }}>
                <input type="hidden" name="id" value={game.id} />
                <button type="submit" className="btn-primary">
                  Finalizar Juego
                </button>
              </form>
            )}

            {(game.status === "scheduled" || game.status === "active") && (
              <form action={cancelGameAction} style={{ display: "inline" }}>
                <input type="hidden" name="id" value={game.id} />
                <button type="submit" className="btn-danger">
                  Cancelar Juego
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <section className="rounds-section">
        <div className="section-header">
          <h2>Rondas del Juego</h2>
          {game.status === "scheduled" && (
            <Link
              href={`/host/juegos/${game.id}/rondas/crear`}
              className="btn-primary"
            >
              + Agregar Ronda
            </Link>
          )}
        </div>

        {rounds.length === 0 ? (
          <div className="empty-state">
            <p>No hay rondas configuradas para este juego.</p>
            {game.status === "scheduled" && (
              <p>Agrega rondas antes de iniciar el juego.</p>
            )}
          </div>
        ) : (
          <table className="rounds-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Patrón</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rounds.map((round) => (
                <tr key={round.id}>
                  <td>{round.order}</td>
                  <td className="round-name">{round.name}</td>
                  <td>{patternMap.get(round.patternId) || "Desconocido"}</td>
                  <td>
                    {round.isPaid ? (
                      <span className="paid-badge">
                        Pago ({round.pricePerCard} {round.currency})
                      </span>
                    ) : (
                      <span className="free-badge">Gratis</span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`status-badge ${roundStatusColors[round.status]}`}
                    >
                      {roundStatusLabels[round.status]}
                    </span>
                  </td>
                  <td className="actions-cell">
                    {game.status === "scheduled" &&
                      round.status === "configurada" && (
                        <>
                          <Link
                            href={`/host/juegos/${game.id}/rondas/editar/${round.id}`}
                            className="btn-action btn-edit"
                          >
                            Editar
                          </Link>
                        </>
                      )}

                    {game.status === "active" &&
                      round.status === "configurada" && (
                        <form action={startGameRoundAction} style={{ display: "inline" }}>
                          <input type="hidden" name="gameId" value={game.id} />
                          <input type="hidden" name="roundId" value={round.id} />
                          <button type="submit" className="btn-action btn-start">
                            Iniciar
                          </button>
                        </form>
                      )}

                    {round.status === "en_progreso" && (
                      <Link
                        href={`/host/juegos/${game.id}/rondas/${round.id}/jugar`}
                        className="btn-action btn-play"
                      >
                        Continuar
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
