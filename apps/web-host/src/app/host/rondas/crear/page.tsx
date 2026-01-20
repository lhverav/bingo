import { getSession } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import { createRoundAction } from "@/lib/actions/rounds";
import Link from "next/link";

export default async function CrearRondaPage({
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
        <Link href="/host/rondas" className="back-link">
          &larr; Volver a Rondas
        </Link>
        <h1>Crear Nueva Ronda</h1>
      </div>

      {error && <div className="error-message">{decodeURIComponent(error)}</div>}

      <form action={createRoundAction} className="round-form">
        <div className="form-group">
          <label htmlFor="name">Nombre de la Ronda</label>
          <input
            type="text"
            id="name"
            name="name"
            placeholder="Ej: Ronda 1 - Premio Mayor"
            required
          />
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
          <small>Cantidad de números disponibles para sacar (ej: 75 significa del 1 al 75)</small>
        </div>

        <div className="form-group">
          <label htmlFor="gamePattern">Patrón de Juego</label>
          <select id="gamePattern" name="gamePattern" required>
            <option value="linea">Línea (horizontal)</option>
            <option value="columna">Columna (vertical)</option>
            <option value="diagonal">Diagonal</option>
            <option value="completo">Completo (cartón lleno)</option>
            <option value="figura_especial">Figura Especial</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="startMode">Modo de Inicio</label>
          <select id="startMode" name="startMode" required defaultValue="manual">
            <option value="manual">Manual</option>
            <option value="automatico">Automático</option>
          </select>
        </div>

        <div className="form-group" id="autoStartDelayGroup">
          <label htmlFor="autoStartDelay">
            Tiempo de Inicio Automático (segundos)
          </label>
          <input
            type="number"
            id="autoStartDelay"
            name="autoStartDelay"
            min="1"
            defaultValue="60"
            placeholder="Segundos antes de iniciar"
          />
          <small>Solo aplica si el modo de inicio es automático</small>
        </div>

        <div className="form-actions">
          <Link href="/host/rondas" className="btn-secondary">
            Cancelar
          </Link>
          <button type="submit">Crear Ronda</button>
        </div>
      </form>
    </main>
  );
}
