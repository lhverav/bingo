import { getSession } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import { createGameAction } from "@/lib/actions/games";
import Link from "next/link";
import { ALL_CARD_TYPES, CARD_TYPE_LABELS } from "@bingo/domain";
import PaymentFields from "./PaymentFields";

export default async function CrearJuegoPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/");
  }

  const error = searchParams.error;

  // Default scheduled date: tomorrow at 10:00
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  const defaultDateTime = tomorrow.toISOString().slice(0, 16);

  return (
    <main className="page-container">
      <div className="page-header">
        <Link href="/host/juegos" className="back-link">
          &larr; Volver a Juegos
        </Link>
        <h1>Crear Nuevo Juego</h1>
      </div>

      {error && <div className="error-message">{decodeURIComponent(error)}</div>}

      <form action={createGameAction} className="form-container">
        <div className="form-group">
          <label htmlFor="name">Nombre del Juego</label>
          <input
            type="text"
            id="name"
            name="name"
            required
            placeholder="Ej: Bingo Navideno 2024"
          />
        </div>

        <div className="form-group">
          <label htmlFor="cardType">Tipo de Carton</label>
          <select id="cardType" name="cardType" required>
            {ALL_CARD_TYPES.map((type) => (
              <option key={type} value={type}>
                {CARD_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
          <small className="form-help">
            BINGO: 5x5 (numeros 1-75) | BINGOTE: 7x5 (numeros 1-103)
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="scheduledAt">Fecha y Hora Programada</label>
          <input
            type="datetime-local"
            id="scheduledAt"
            name="scheduledAt"
            required
            defaultValue={defaultDateTime}
          />
        </div>

        <PaymentFields />

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            Crear Juego
          </button>
          <Link href="/host/juegos" className="btn-secondary">
            Cancelar
          </Link>
        </div>
      </form>
    </main>
  );
}
