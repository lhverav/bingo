import { getSession } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import { getRoundById } from "@/lib/services/roundService";
import { startRoundAction, deleteRoundAction } from "@/lib/actions/rounds";
import Link from "next/link";
import { notFound } from "next/navigation";

const patternLabels: Record<string, string> = {
  linea: "Línea (horizontal)",
  columna: "Columna (vertical)",
  diagonal: "Diagonal",
  completo: "Completo (cartón lleno)",
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

export default async function VerRondaPage({
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

  return (
    <main className="page-container">
      <div className="page-header">
        <Link href="/host/rondas" className="back-link">
          &larr; Volver a Rondas
        </Link>
        <h1>Detalles de Ronda</h1>
      </div>

      <div className="round-details">
        <div className="detail-header">
          <h2>{round.name}</h2>
          <span className={`status-badge ${statusColors[round.status]}`}>
            {statusLabels[round.status]}
          </span>
        </div>

        <div className="details-grid">
          <div className="detail-item">
            <label>Tamaño de Carta</label>
            <span>{round.cardSize}x{round.cardSize}</span>
          </div>

          <div className="detail-item">
            <label>Números Disponibles</label>
            <span>1 - {round.maxNumber}</span>
          </div>

          <div className="detail-item">
            <label>Patrón de Juego</label>
            <span>{patternLabels[round.gamePattern]}</span>
          </div>

          <div className="detail-item">
            <label>Modo de Inicio</label>
            <span>
              {round.startMode === "manual"
                ? "Manual"
                : `Automático (${round.autoStartDelay} segundos)`}
            </span>
          </div>

          <div className="detail-item">
            <label>Fecha de Creación</label>
            <span>{new Date(round.createdAt).toLocaleDateString("es-ES", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}</span>
          </div>

          {round.drawnNumbers.length > 0 && (
            <div className="detail-item full-width">
              <label>Números Sacados ({round.drawnNumbers.length})</label>
              <div className="drawn-numbers">
                {round.drawnNumbers.map((num, index) => (
                  <span key={index} className="drawn-number">{num}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="detail-actions">
          {round.status === "configurada" && (
            <>
              <Link href={`/host/rondas/editar/${round._id}`} className="btn-secondary">
                Editar
              </Link>

              <form action={startRoundAction} style={{ display: "inline" }}>
                <input type="hidden" name="id" value={round._id.toString()} />
                <button type="submit" className="btn-primary">
                  Iniciar Ronda
                </button>
              </form>

              <form action={deleteRoundAction} style={{ display: "inline" }}>
                <input type="hidden" name="id" value={round._id.toString()} />
                <button type="submit" className="btn-danger">
                  Eliminar
                </button>
              </form>
            </>
          )}

          {round.status === "en_progreso" && (
            <Link href={`/host/rondas/${round._id}/jugar`} className="btn-primary">
              Continuar Jugando
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
