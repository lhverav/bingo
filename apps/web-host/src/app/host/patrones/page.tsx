import { getSession } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import { getAllPatterns } from "@bingo/game-core";
import { deletePatternAction } from "@/lib/actions/patterns";
import Link from "next/link";
import { CARD_TYPE_LABELS } from "@bingo/domain";

export default async function PatronesPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/");
  }

  const patterns = await getAllPatterns();
  const error = searchParams.error;

  // Group patterns by card type
  const bingoPatterns = patterns.filter((p) => p.cardType === "bingo");
  const bingotePatterns = patterns.filter((p) => p.cardType === "bingote");

  return (
    <main className="page-container">
      <div className="page-header">
        <Link href="/host" className="back-link">
          &larr; Volver al Panel
        </Link>
        <h1>Gestión de Patrones</h1>
      </div>

      {error && <div className="error-message">{decodeURIComponent(error)}</div>}

      <div className="page-actions">
        <Link href="/host/patrones/crear" className="btn-primary">
          + Crear Nuevo Patrón
        </Link>
      </div>

      {patterns.length === 0 ? (
        <div className="empty-state">
          <p>No hay patrones configurados.</p>
          <p>Ejecuta el seed para crear los patrones predefinidos.</p>
        </div>
      ) : (
        <>
          <section className="pattern-section">
            <h2>{CARD_TYPE_LABELS.bingo} (5×5)</h2>
            {bingoPatterns.length === 0 ? (
              <p className="empty-state-inline">No hay patrones para BINGO</p>
            ) : (
              <div className="patterns-grid">
                {bingoPatterns.map((pattern) => (
                  <div key={pattern.id} className="pattern-card">
                    <div className="pattern-preview">
                      <div
                        className="pattern-grid"
                        style={{
                          gridTemplateColumns: `repeat(5, 1fr)`,
                        }}
                      >
                        {pattern.cells.flatMap((row, rowIdx) =>
                          row.map((cell, colIdx) => (
                            <div
                              key={`${rowIdx}-${colIdx}`}
                              className={`pattern-cell ${cell ? "active" : ""}`}
                            />
                          ))
                        )}
                      </div>
                    </div>
                    <div className="pattern-info">
                      <h3>{pattern.name}</h3>
                      {pattern.isPreset && (
                        <span className="preset-badge">Predefinido</span>
                      )}
                    </div>
                    <div className="pattern-actions">
                      {!pattern.isPreset && (
                        <>
                          <Link
                            href={`/host/patrones/editar/${pattern.id}`}
                            className="btn-action btn-edit"
                          >
                            Editar
                          </Link>
                          <form
                            action={deletePatternAction}
                            style={{ display: "inline" }}
                          >
                            <input type="hidden" name="id" value={pattern.id} />
                            <button type="submit" className="btn-action btn-delete">
                              Eliminar
                            </button>
                          </form>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="pattern-section">
            <h2>{CARD_TYPE_LABELS.bingote} (7×5)</h2>
            {bingotePatterns.length === 0 ? (
              <p className="empty-state-inline">No hay patrones para BINGOTE</p>
            ) : (
              <div className="patterns-grid">
                {bingotePatterns.map((pattern) => (
                  <div key={pattern.id} className="pattern-card">
                    <div className="pattern-preview">
                      <div
                        className="pattern-grid"
                        style={{
                          gridTemplateColumns: `repeat(7, 1fr)`,
                        }}
                      >
                        {pattern.cells.flatMap((row, rowIdx) =>
                          row.map((cell, colIdx) => (
                            <div
                              key={`${rowIdx}-${colIdx}`}
                              className={`pattern-cell ${cell ? "active" : ""}`}
                            />
                          ))
                        )}
                      </div>
                    </div>
                    <div className="pattern-info">
                      <h3>{pattern.name}</h3>
                      {pattern.isPreset && (
                        <span className="preset-badge">Predefinido</span>
                      )}
                    </div>
                    <div className="pattern-actions">
                      {!pattern.isPreset && (
                        <>
                          <Link
                            href={`/host/patrones/editar/${pattern.id}`}
                            className="btn-action btn-edit"
                          >
                            Editar
                          </Link>
                          <form
                            action={deletePatternAction}
                            style={{ display: "inline" }}
                          >
                            <input type="hidden" name="id" value={pattern.id} />
                            <button type="submit" className="btn-action btn-delete">
                              Eliminar
                            </button>
                          </form>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
