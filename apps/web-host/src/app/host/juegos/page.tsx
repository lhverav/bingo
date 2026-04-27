import { getSession } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import { getAllGamesWithRoundCount } from "@bingo/game-core";
import { deleteGameAction, startGameAction, publishGameAction, unpublishGameAction } from "@/lib/actions/games";
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

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function JuegosPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/");
  }

  const games = await getAllGamesWithRoundCount();
  const error = searchParams.error;

  return (
    <main className="page-container">
      <div className="page-header">
        <Link href="/host" className="back-link">
          &larr; Volver al Panel
        </Link>
        <h1>Gestión de Juegos</h1>
      </div>

      {error && <div className="error-message">{decodeURIComponent(error)}</div>}

      <div className="page-actions">
        <Link href="/host/juegos/crear" className="btn-primary">
          + Crear Nuevo Juego
        </Link>
      </div>

      {games.length === 0 ? (
        <div className="empty-state">
          <p>No hay juegos configurados.</p>
          <p>Crea tu primer juego para comenzar.</p>
        </div>
      ) : (
        <div className="games-list">
          <table className="rounds-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo de Cartón</th>
                <th>Fecha Programada</th>
                <th>Rondas</th>
                <th>Estado</th>
                <th>Visible</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {games.map((game) => (
                <tr key={game.id}>
                  <td className="round-name">{game.name}</td>
                  <td>{CARD_TYPE_LABELS[game.cardType]}</td>
                  <td>{formatDate(game.scheduledAt)}</td>
                  <td>{game.roundCount} rondas</td>
                  <td>
                    <span className={`status-badge ${statusColors[game.status]}`}>
                      {statusLabels[game.status]}
                    </span>
                  </td>
                  <td>
                    {game.isPublished ? (
                      <span className="status-badge status-active">Publicado</span>
                    ) : (
                      <span className="status-badge status-configured">No publicado</span>
                    )}
                  </td>
                  <td className="actions-cell">
                    <Link
                      href={`/host/juegos/${game.id}`}
                      className="btn-action btn-view"
                    >
                      Ver
                    </Link>

                    {game.status === "scheduled" && (
                      <>
                        <Link
                          href={`/host/juegos/editar/${game.id}`}
                          className="btn-action btn-edit"
                        >
                          Editar
                        </Link>

                        {!game.isPublished ? (
                          <form action={publishGameAction} style={{ display: "inline" }}>
                            <input type="hidden" name="id" value={game.id} />
                            <button type="submit" className="btn-action btn-publish">
                              Publicar
                            </button>
                          </form>
                        ) : (
                          <form action={unpublishGameAction} style={{ display: "inline" }}>
                            <input type="hidden" name="id" value={game.id} />
                            <button type="submit" className="btn-action btn-unpublish">
                              Despublicar
                            </button>
                          </form>
                        )}

                        <form action={startGameAction} style={{ display: "inline" }}>
                          <input type="hidden" name="id" value={game.id} />
                          <button type="submit" className="btn-action btn-start">
                            Iniciar
                          </button>
                        </form>

                        <form action={deleteGameAction} style={{ display: "inline" }}>
                          <input type="hidden" name="id" value={game.id} />
                          <button type="submit" className="btn-action btn-delete">
                            Eliminar
                          </button>
                        </form>
                      </>
                    )}

                    {game.status === "active" && (
                      <Link
                        href={`/host/juegos/${game.id}`}
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
        </div>
      )}
    </main>
  );
}
