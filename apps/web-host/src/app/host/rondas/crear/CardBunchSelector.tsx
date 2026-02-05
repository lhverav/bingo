"use client";

import { useEffect, useState } from "react";

interface CardBunch {
  id: string;
  name: string;
  cardSize: number;
  maxNumber: number;
}

interface CardBunchSelectorProps {
  bunches: CardBunch[];
  defaultValue?: string;
}

export default function CardBunchSelector({ bunches, defaultValue }: CardBunchSelectorProps) {
  const [cardSize, setCardSize] = useState<number | null>(null);
  const [maxNumber, setMaxNumber] = useState<number | null>(null);
  const [filteredBunches, setFilteredBunches] = useState<CardBunch[]>([]);

  useEffect(() => {
    // Listen to changes on the cardSize select
    const cardSizeSelect = document.getElementById("cardSize") as HTMLSelectElement;
    const maxNumberInput = document.getElementById("maxNumber") as HTMLInputElement;

    const updateFilters = () => {
      const size = cardSizeSelect?.value ? parseInt(cardSizeSelect.value) : null;
      const max = maxNumberInput?.value ? parseInt(maxNumberInput.value) : null;

      setCardSize(size);
      setMaxNumber(max);

      // Filter bunches if both values are set
      if (size !== null && max !== null) {
        const matches = bunches.filter(
          (bunch) => bunch.cardSize === size && bunch.maxNumber === max
        );
        setFilteredBunches(matches);
      } else {
        setFilteredBunches([]);
      }
    };

    // Initial update
    updateFilters();

    // Add listeners
    cardSizeSelect?.addEventListener("change", updateFilters);
    maxNumberInput?.addEventListener("input", updateFilters);

    // Cleanup
    return () => {
      cardSizeSelect?.removeEventListener("change", updateFilters);
      maxNumberInput?.removeEventListener("input", updateFilters);
    };
  }, [bunches]);

  // Only show if we have both values and matching bunches
  if (cardSize === null || maxNumber === null || filteredBunches.length === 0) {
    return null;
  }

  return (
    <div className="form-group">
      <label htmlFor="cardBunchId">Grupo de Cartas Pre-generadas (opcional)</label>
      <select id="cardBunchId" name="cardBunchId" defaultValue={defaultValue || ""}>
        <option value="">-- No usar grupo --</option>
        {filteredBunches.map((bunch) => (
          <option key={bunch.id} value={bunch.id}>
            {bunch.name} ({bunch.cardSize}x{bunch.cardSize}, 1-{bunch.maxNumber})
          </option>
        ))}
      </select>
      <small>
        Selecciona un grupo de cartas que coincida con las dimensiones de esta ronda
      </small>
    </div>
  );
}
