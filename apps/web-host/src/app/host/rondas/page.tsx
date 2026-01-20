import { getSession } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import { getRoundsByUser } from "@/lib/services/roundService";
import { deleteRoundAction, startRoundAction } from "@/lib/actions/rounds";
import Link from "next/link";

const patternLabels: Record<string, string> = {
  linea: "Línea",
  columna: "Columna",
  diagonal: "Diagonal",
  completo: "Completo",
  figura_especial: "Figura Especial",
};

const statusLabels: Record<string, string> = {
  configurada: "Configurada",
  en_progreso: "En Progreso",
  finalizada: "Finalizada",
};

const statusColors: Record<string, string> = {
  configurada: "status-configured",
  en_progreso: "status-active",
  finalizada: "status-finished",
};

export default async function RondasPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/");
  }

  const rounds = await getRoundsByUser(session.userId);
  const error = searchParams.error;

  return (
    <main className="page-container">
      <div className="page-header">
        <Link href="/host" className="back-link">
          &larr; Volver al Panel
        </Link>
        <h1>Gestión de Rondas</h1>
      </div>

      {error && <div className="error-message">{decodeURIComponent(error)}</div>}

      <div className="page-actions">
        <Link href="/host/rondas/crear" className="btn-primary">
          + Crear Nueva Ronda
        </Link>
      </div>

      {rounds.length === 0 ? (
        <div className="empty-state">
          <p>No hay rondas configuradas.</p>
          <p>Crea tu primera ronda para comenzar.</p>
        </div>
      ) : (
        <div className="rounds-list">
          <table className="rounds-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Carta</th>
                <th>Números</th>
                <th>Patrón</th>
                <th>Inicio</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rounds.map((round) => (
                <tr key={round._id.toString()}>
                  <td className="round-name">{round.name}</td>
                  <td>{round.cardSize}x{round.cardSize}</td>
                  <td>1 - {round.maxNumber}</td>
                  <td>{patternLabels[round.gamePattern]}</td>
                  <td>
                    {round.startMode === "manual" ? "Manual" : `Auto (${round.autoStartDelay}s)`}
                  </td>
                  <td>
                    <span className={`status-badge ${statusColors[round.status]}`}>
                      {statusLabels[round.status]}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <Link
                      href={`/host/rondas/${round._id}`}
                      className="btn-action btn-view"
                    >
                      Ver
                    </Link>

                    {round.status === "configurada" && (
                      <>
                        <Link
                          href={`/host/rondas/editar/${round._id}`}
                          className="btn-action btn-edit"
                        >
                          Editar
                        </Link>

                        <form action={startRoundAction} style={{ display: "inline" }}>
                          <input type="hidden" name="id" value={round._id.toString()} />
                          <button type="submit" className="btn-action btn-start">
                            Iniciar
                          </button>
                        </form>

                        <form action={deleteRoundAction} style={{ display: "inline" }}>
                          <input type="hidden" name="id" value={round._id.toString()} />
                          <button type="submit" className="btn-action btn-delete">
                            Eliminar
                          </button>
                        </form>
                      </>
                    )}

                    {round.status === "en_progreso" && (
                      <Link
                        href={`/host/rondas/${round._id}/jugar`}
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
