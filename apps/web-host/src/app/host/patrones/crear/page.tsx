"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ALL_CARD_TYPES, CARD_TYPE_LABELS, CardType } from "@bingo/domain";
import PatternEditor from "../PatternEditor";

export default function CrearPatronPage() {
  const router = useRouter();
  const [cardType, setCardType] = useState<CardType>("bingo");
  const [cells, setCells] = useState<boolean[][]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    formData.set("cells", JSON.stringify(cells));

    try {
      const response = await fetch("/api/patterns", {
        method: "POST",
        body: JSON.stringify({
          name: formData.get("name"),
          cardType: formData.get("cardType"),
          cells,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al crear el patrón");
      }

      router.push("/host/patrones");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el patrón");
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page-container">
      <div className="page-header">
        <Link href="/host/patrones" className="back-link">
          &larr; Volver a Patrones
        </Link>
        <h1>Crear Nuevo Patrón</h1>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="form-container">
        <div className="form-group">
          <label htmlFor="name">Nombre del Patrón</label>
          <input
            type="text"
            id="name"
            name="name"
            required
            placeholder="Ej: Cruz, Letra T, etc."
          />
        </div>

        <div className="form-group">
          <label htmlFor="cardType">Tipo de Cartón</label>
          <select
            id="cardType"
            name="cardType"
            required
            value={cardType}
            onChange={(e) => setCardType(e.target.value as CardType)}
          >
            {ALL_CARD_TYPES.map((type) => (
              <option key={type} value={type}>
                {CARD_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Diseño del Patrón</label>
          <p className="form-help">
            Haz clic en las celdas para marcar las posiciones que deben
            completarse para ganar.
          </p>
          <PatternEditor
            cardType={cardType}
            onChange={setCells}
          />
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creando..." : "Crear Patrón"}
          </button>
          <Link href="/host/patrones" className="btn-secondary">
            Cancelar
          </Link>
        </div>
      </form>
    </main>
  );
}
