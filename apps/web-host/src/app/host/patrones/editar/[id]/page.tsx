"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pattern, CARD_TYPE_LABELS } from "@bingo/domain";
import PatternEditor from "../../PatternEditor";

export default function EditarPatronPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [pattern, setPattern] = useState<Pattern | null>(null);
  const [cells, setCells] = useState<boolean[][]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchPattern = async () => {
      try {
        const response = await fetch(`/api/patterns/${params.id}`);
        if (!response.ok) {
          throw new Error("Patrón no encontrado");
        }
        const data = await response.json();
        setPattern(data);
        setCells(data.cells);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al cargar el patrón"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchPattern();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch(`/api/patterns/${params.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: formData.get("name"),
          cells,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al actualizar el patrón");
      }

      router.push("/host/patrones");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al actualizar el patrón"
      );
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="page-container">
        <p>Cargando...</p>
      </main>
    );
  }

  if (!pattern) {
    return (
      <main className="page-container">
        <div className="error-message">{error || "Patrón no encontrado"}</div>
        <Link href="/host/patrones" className="btn-secondary">
          Volver a Patrones
        </Link>
      </main>
    );
  }

  if (pattern.isPreset) {
    return (
      <main className="page-container">
        <div className="error-message">
          Los patrones predefinidos no pueden ser editados.
        </div>
        <Link href="/host/patrones" className="btn-secondary">
          Volver a Patrones
        </Link>
      </main>
    );
  }

  return (
    <main className="page-container">
      <div className="page-header">
        <Link href="/host/patrones" className="back-link">
          &larr; Volver a Patrones
        </Link>
        <h1>Editar Patrón</h1>
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
            defaultValue={pattern.name}
          />
        </div>

        <div className="form-group">
          <label>Tipo de Cartón</label>
          <input
            type="text"
            value={CARD_TYPE_LABELS[pattern.cardType]}
            disabled
          />
          <small className="form-help">
            El tipo de cartón no puede ser modificado.
          </small>
        </div>

        <div className="form-group">
          <label>Diseño del Patrón</label>
          <p className="form-help">
            Haz clic en las celdas para marcar las posiciones que deben
            completarse para ganar.
          </p>
          <PatternEditor
            cardType={pattern.cardType}
            initialCells={pattern.cells}
            onChange={setCells}
          />
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Guardando..." : "Guardar Cambios"}
          </button>
          <Link href="/host/patrones" className="btn-secondary">
            Cancelar
          </Link>
        </div>
      </form>
    </main>
  );
}
