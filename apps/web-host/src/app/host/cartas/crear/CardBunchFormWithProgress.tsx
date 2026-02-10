"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CardBunchJobProgress } from "@/lib/types/cardBunchJob";

export default function CardBunchFormWithProgress() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState<CardBunchJobProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  // Poll for progress
  useEffect(() => {
    if (!jobId) return;
    console.log("[DEBUG 3] Polling started for jobId:", jobId);

    const poll = async () => {
      try {
        const res = await fetch(`/api/card-bunch/progress/${jobId}`);

        const data: CardBunchJobProgress = await res.json();
        console.log("[DEBUG 4] Poll response:", res.status, data);
        //alert(JSON.stringify(data, null, 2));
        if (res.ok) {
          setProgress(data);

          // Stop polling if job is done
          if (data.status === "completed") {
            stopPolling();
            router.push("/host/cartas");
          } else if (data.status === "cancelled") {
            stopPolling();
            setError("Generación cancelada");
            setJobId(null);
          } else if (data.status === "failed") {
            stopPolling();
            setError(data.error || "Error al generar cartas");
            setJobId(null);
          }
        }
      } catch (err) {
        console.error("Error polling progress:", err);
      }
    };

    // Poll immediately, then every second
    poll();
    pollingInterval.current = setInterval(poll, 1000);

    return () => stopPolling();
  }, [jobId, router]);

  const stopPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      cardSize: parseInt(formData.get("cardSize") as string),
      maxNumber: parseInt(formData.get("maxNumber") as string),
      count: parseInt(formData.get("count") as string),
    };
    console.log("[DEBUG 1] Form submitted, sending to API:", data);

    try {
      const res = await fetch("/api/card-bunch/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const { jobId: newJobId } = await res.json();
        console.log("[DEBUG 2] Received jobId:", newJobId);
        setJobId(newJobId);
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Error al iniciar generación");
        setIsSubmitting(false);
      }
    } catch (err) {
      setError("Error de conexión");
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!jobId || !confirm("¿Cancelar la generación de cartas?")) return;

    try {
      await fetch(`/api/card-bunch/cancel/${jobId}`, { method: "POST" });
    } catch (err) {
      console.error("Error cancelling job:", err);
    }
  };

  // Calculate time remaining
  const getTimeRemaining = (): string => {
    if (!progress || progress.status !== "running" || progress.current === 0) {
      return "";
    }

    const elapsed = Date.now() - progress.startTime;
    const rate = progress.current / elapsed; // cards per ms
    const remaining = progress.total - progress.current;
    const estimatedMs = remaining / rate;
    const seconds = Math.ceil(estimatedMs / 1000);

    if (seconds < 60) {
      return `~${seconds} segundo${seconds !== 1 ? "s" : ""}`;
    } else {
      const minutes = Math.ceil(seconds / 60);
      return `~${minutes} minuto${minutes !== 1 ? "s" : ""}`;
    }
  };

  const percentage = progress
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  return (
    <div>
      {error && <div className="error-message">{error}</div>}

      {progress && progress.status === "running" && (
        <div className="info-message">
          <div style={{ marginBottom: "10px" }}>
            ⏳ Generando cartas: {progress.current.toLocaleString()} /{" "}
            {progress.total.toLocaleString()} ({percentage}%)
          </div>
          <div
            style={{
              width: "100%",
              height: "20px",
              backgroundColor: "#e0e0e0",
              borderRadius: "10px",
              overflow: "hidden",
              marginBottom: "10px",
            }}
          >
            <div
              style={{
                width: `${percentage}%`,
                height: "100%",
                backgroundColor: "#4caf50",
                transition: "width 0.3s ease",
              }}
            />
          </div>
          <div style={{ fontSize: "0.9em", marginBottom: "10px" }}>
            Tiempo restante: {getTimeRemaining()}
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="btn-danger"
            style={{ marginTop: "10px" }}
          >
            Cancelar Generación
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="round-form">
        <div className="form-group">
          <label htmlFor="name">Nombre del Grupo</label>
          <input
            type="text"
            id="name"
            name="name"
            placeholder="Ej: Cartas 5x5 - 75 números"
            required
            disabled={isSubmitting}
          />
          <small>Un nombre descriptivo para este grupo de cartas</small>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="cardSize">Tamaño de la Carta</label>
            <select
              id="cardSize"
              name="cardSize"
              required
              defaultValue="5"
              disabled={isSubmitting}
            >
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
            disabled={isSubmitting}
          />
          <small>
            Cantidad de números disponibles (ej: 75 significa del 1 al 75)
          </small>
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
            disabled={isSubmitting}
          />
          <small>Cuántas cartas únicas se generarán en este grupo</small>
        </div>

        <div className="form-actions">
          <Link href="/host/cartas" className="btn-secondary">
            Cancelar
          </Link>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Generando..." : "Generar Cartas"}
          </button>
        </div>
      </form>
    </div>
  );
}
