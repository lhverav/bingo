import { getSession } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import { createCardBunchAction } from "@/lib/actions/cardBunches";
import Link from "next/link";

export default async function CrearCartasPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/");
  }

  const error = searchParams.error;

  return (
    <main className="page-container">
      <div className="page-header">
        <Link href="/host/cartas" className="back-link">
          &larr; Volver a Grupos de Cartas
        </Link>
        <h1>Crear Grupo de Cartas</h1>
      </div>

      {error && <div className="error-message">{decodeURIComponent(error)}</div>}

      <form action={createCardBunchAction} className="round-form">
        <div className="form-group">
          <label htmlFor="name">Nombre del Grupo</label>
          <input
            type="text"
            id="name"
            name="name"
            placeholder="Ej: Cartas 5x5 - 75 números"
            required
          />
          <small>Un nombre descriptivo para este grupo de cartas</small>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="cardSize">Tamaño de la Carta</label>
            <select id="cardSize" name="cardSize" required defaultValue="5">
              <option value="3">3x3</option>
              <option value="4">4x4</option>
              <option value="5">5x5</option>
              <option value="6">6x6</option>
              <option value="7">7x7</option>
            </select>
            <small>Tamaño de la cuadrícula del cartón</small>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="maxNumber">Números Disponibles (1 hasta)</label>
          <input
            type="number"
            id="maxNumber"
            name="maxNumber"
            min="9"
            defaultValue="75"
            required
          />
          <small>Cantidad de números disponibles (ej: 75 significa del 1 al 75)</small>
        </div>

        <div className="form-group">
          <label htmlFor="count">Cantidad de Cartas a Generar</label>
          <input
            type="number"
            id="count"
            name="count"
            min="1"
            defaultValue="10"
            required
          />
          <small>Cuántas cartas únicas se generarán en este grupo</small>
        </div>

        <div className="form-actions">
          <Link href="/host/cartas" className="btn-secondary">
            Cancelar
          </Link>
          <button type="submit">Generar Cartas</button>
        </div>
      </form>
    </main>
  );
}
