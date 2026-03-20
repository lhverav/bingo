import { getSession } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import { getGeneralParameters } from "@bingo/game-core";
import {
  updateGeneralParametersAction,
  resetGeneralParametersAction,
} from "@/lib/actions/generalParameters";
import Link from "next/link";
import { GENERAL_PARAMETERS_LABELS } from "@bingo/domain";

export default async function ParametrosPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/");
  }

  const params = await getGeneralParameters();
  const error = searchParams.error;
  const success = searchParams.success;

  return (
    <main className="page-container">
      <div className="page-header">
        <Link href="/host" className="back-link">
          &larr; Volver al Panel
        </Link>
        <h1>Parámetros Generales</h1>
      </div>

      {error && <div className="error-message">{decodeURIComponent(error)}</div>}
      {success && (
        <div className="success-message">Parámetros guardados exitosamente.</div>
      )}

      <div className="params-description">
        <p>
          Estos parámetros se aplican globalmente a todos los juegos y rondas.
          Configuran los valores por defecto para la entrega y selección de
          cartones.
        </p>
      </div>

      <form action={updateGeneralParametersAction} className="form-container">
        <fieldset className="form-fieldset">
          <legend>Configuración de Cartones Gratis</legend>

          <div className="form-group">
            <label htmlFor="selectionTimeSeconds">
              {GENERAL_PARAMETERS_LABELS.selectionTimeSeconds}
            </label>
            <div className="input-with-suffix">
              <input
                type="number"
                id="selectionTimeSeconds"
                name="selectionTimeSeconds"
                required
                min={10}
                max={300}
                defaultValue={params.selectionTimeSeconds}
              />
              <span className="input-suffix">segundos</span>
            </div>
            <small className="form-help">
              Tiempo que tienen los jugadores para seleccionar sus cartones (10-300
              segundos).
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="freeCardsDelivered">
              {GENERAL_PARAMETERS_LABELS.freeCardsDelivered}
            </label>
            <input
              type="number"
              id="freeCardsDelivered"
              name="freeCardsDelivered"
              required
              min={1}
              max={20}
              defaultValue={params.freeCardsDelivered}
            />
            <small className="form-help">
              Cantidad de cartones que se entregan a cada jugador para que elija
              (1-20).
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="freeCardsToSelect">
              {GENERAL_PARAMETERS_LABELS.freeCardsToSelect}
            </label>
            <input
              type="number"
              id="freeCardsToSelect"
              name="freeCardsToSelect"
              required
              min={1}
              max={10}
              defaultValue={params.freeCardsToSelect}
            />
            <small className="form-help">
              Cantidad de cartones que el jugador puede seleccionar para jugar
              (1-10).
            </small>
          </div>
        </fieldset>

        <fieldset className="form-fieldset">
          <legend>Configuración de Cartones Pagos</legend>

          <div className="form-group">
            <label htmlFor="maxCardsToBuy">
              {GENERAL_PARAMETERS_LABELS.maxCardsToBuy}
            </label>
            <input
              type="number"
              id="maxCardsToBuy"
              name="maxCardsToBuy"
              required
              min={1}
              max={50}
              defaultValue={params.maxCardsToBuy}
            />
            <small className="form-help">
              Máximo de cartones que un jugador puede comprar por ronda (1-50).
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="paidCardsToIssue">
              {GENERAL_PARAMETERS_LABELS.paidCardsToIssue}
            </label>
            <input
              type="number"
              id="paidCardsToIssue"
              name="paidCardsToIssue"
              required
              min={1}
              max={20}
              defaultValue={params.paidCardsToIssue}
            />
            <small className="form-help">
              Cantidad de cartones que se muestran al jugador para comprar (1-20).
            </small>
          </div>
        </fieldset>

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            Guardar Cambios
          </button>
          <form
            action={resetGeneralParametersAction}
            style={{ display: "inline" }}
          >
            <button type="submit" className="btn-secondary">
              Restablecer Valores
            </button>
          </form>
        </div>
      </form>
    </main>
  );
}
