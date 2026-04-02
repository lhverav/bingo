"use client";

import { useState, useEffect } from "react";
import { CardType, getCardTypeConfig } from "@bingo/domain";

interface CardBunch {
  id: string;
  name: string;
  cardType: CardType;
  cardCount: number;
}

interface GameCardBunchSelectorProps {
  bunches: CardBunch[];
  defaultValue?: string;
}

/**
 * CardBunch selector that filters by the selected cardType in the form
 * Listens to changes on the cardType select element
 */
export default function GameCardBunchSelector({
  bunches,
  defaultValue,
}: GameCardBunchSelectorProps) {
  const [cardType, setCardType] = useState<CardType | null>(null);
  const [filteredBunches, setFilteredBunches] = useState<CardBunch[]>([]);

  useEffect(() => {
    const cardTypeSelect = document.getElementById("cardType") as HTMLSelectElement;

    const updateFilter = () => {
      const selectedType = cardTypeSelect?.value as CardType | undefined;

      if (selectedType) {
        setCardType(selectedType);
        const matches = bunches.filter((bunch) => bunch.cardType === selectedType);
        setFilteredBunches(matches);
      } else {
        setCardType(null);
        setFilteredBunches([]);
      }
    };

    // Initial update
    updateFilter();

    // Listen for changes
    cardTypeSelect?.addEventListener("change", updateFilter);

    return () => {
      cardTypeSelect?.removeEventListener("change", updateFilter);
    };
  }, [bunches]);

  // Don't render until we have a cardType selected
  if (!cardType) {
    return null;
  }

  return (
    <div className="form-group">
      <label htmlFor="cardBunchId">Grupo de Cartones</label>
      <select id="cardBunchId" name="cardBunchId" defaultValue={defaultValue || ""}>
        <option value="">-- Sin grupo asignado --</option>
        {filteredBunches.map((bunch) => {
          const config = getCardTypeConfig(bunch.cardType);
          return (
            <option key={bunch.id} value={bunch.id}>
              {bunch.name} ({bunch.cardCount.toLocaleString()} cartones)
            </option>
          );
        })}
      </select>
      {filteredBunches.length === 0 ? (
        <small className="form-warning">
          No hay grupos de cartones disponibles para {cardType.toUpperCase()}.{" "}
          <a href="/host/cartas/crear">Crear grupo</a>
        </small>
      ) : (
        <small className="form-help">
          Selecciona un grupo de cartones pre-generados para este juego
        </small>
      )}
    </div>
  );
}
