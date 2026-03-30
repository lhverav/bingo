"use client";

import { useState } from "react";
import { ALL_CURRENCIES, CURRENCY_LABELS } from "@bingo/domain";

interface PaymentFieldsProps {
  defaultIsPaid?: boolean;
  defaultPricePerCard?: number;
  defaultCurrency?: string;
}

export default function PaymentFields({
  defaultIsPaid = false,
  defaultPricePerCard,
  defaultCurrency = "COP",
}: PaymentFieldsProps) {
  const [isPaid, setIsPaid] = useState(defaultIsPaid);

  return (
    <>
      {/* Payment toggle */}
      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="isPaidCheckbox"
            checked={isPaid}
            onChange={(e) => setIsPaid(e.target.checked)}
          />
          <span style={{ marginLeft: "0.5rem" }}>Juego de pago</span>
        </label>
        <input type="hidden" name="isPaid" value={isPaid ? "true" : "false"} />
        <small className="form-help">
          Si esta activado, los jugadores deberan pagar para obtener cartones
        </small>
      </div>

      {/* Conditional payment fields */}
      {isPaid && (
        <fieldset className="form-fieldset">
          <legend>Configuracion de Pago</legend>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="pricePerCard">Precio por Carton</label>
              <input
                type="number"
                id="pricePerCard"
                name="pricePerCard"
                required={isPaid}
                min={0}
                step="0.01"
                defaultValue={defaultPricePerCard}
                placeholder="Ej: 5000"
              />
            </div>

            <div className="form-group">
              <label htmlFor="currency">Moneda</label>
              <select
                id="currency"
                name="currency"
                required={isPaid}
                defaultValue={defaultCurrency}
              >
                {ALL_CURRENCIES.map((curr) => (
                  <option key={curr} value={curr}>
                    {CURRENCY_LABELS[curr]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>
      )}
    </>
  );
}
