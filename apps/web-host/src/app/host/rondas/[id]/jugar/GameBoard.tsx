"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RoundPlayer } from "@bingo/domain";

interface GameBoardProps {
  roundId: string;
  allNumbers: number[];
  drawnNumbers: number[];
  isFinished: boolean;
  maxNumber: number;
  initialPlayers: RoundPlayer[];
}

export default function GameBoard({
  roundId,
  allNumbers,
  drawnNumbers: initialDrawnNumbers,
  isFinished: initialIsFinished,
  maxNumber,
  initialPlayers,
}: GameBoardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>(initialDrawnNumbers);
  const [lastDrawn, setLastDrawn] = useState<number | null>(
    initialDrawnNumbers.length > 0 ? initialDrawnNumbers[initialDrawnNumbers.length - 1] : null
  );
  const [isFinished, setIsFinished] = useState(initialIsFinished);
  const [error, setError] = useState<string | null>(null);
  const [players, setPlayers] = useState<RoundPlayer[]>(initialPlayers);

  // Poll for players updates every 3 seconds
  useEffect(() => {
    if (isFinished) return;

    const fetchPlayers = async () => {
      try {
        const response = await fetch(`/api/round/${roundId}/players`);
        if (response.ok) {
          const data = await response.json();
          setPlayers(data.players);
        }
      } catch (err) {
        console.error("Error fetching players:", err);
      }
    };

    const interval = setInterval(fetchPlayers, 3000);
    return () => clearInterval(interval);
  }, [roundId, isFinished]);

  const playersSelecting = players.filter(p => p.status === "selecting").length;
  const playersReady = players.filter(p => p.status === "ready").length;

  const availableNumbers = allNumbers.filter((n) => !drawnNumbers.includes(n));

  const drawRandomNumber = async () => {
    if (availableNumbers.length === 0 || isFinished) return;

    const randomIndex = Math.floor(Math.random() * availableNumbers.length);
    const number = availableNumbers[randomIndex];

    try {
      const response = await fetch(`/api/rounds/${roundId}/draw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al sacar número");
      }

      setDrawnNumbers([...drawnNumbers, number]);
      setLastDrawn(number);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const endRound = async () => {
    try {
      const response = await fetch(`/api/rounds/${roundId}/end`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al finalizar ronda");
      }

      setIsFinished(true);
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  return (
    <div className="game-board">
      {error && <div className="error-message">{error}</div>}

      <div className="last-drawn-section">
        <h2>Último Número</h2>
        {lastDrawn ? (
          <div className="last-drawn-number">{lastDrawn}</div>
        ) : (
          <div className="last-drawn-placeholder">-</div>
        )}
      </div>

      <div className="game-controls">
        {!isFinished && (
          <>
            <button
              onClick={drawRandomNumber}
              disabled={availableNumbers.length === 0 || isPending}
              className="btn-draw"
            >
              {isPending ? "Sacando..." : "Sacar Número"}
            </button>
            <button onClick={endRound} disabled={isPending} className="btn-end">
              Finalizar Ronda
            </button>
          </>
        )}
      </div>

      <div className="game-stats">
        <span>Sacados: {drawnNumbers.length}</span>
        <span>Restantes: {availableNumbers.length}</span>
      </div>

      {/* Players Section */}
      <div className="players-section">
        <h3>Jugadores ({players.length})</h3>
        <div className="players-stats">
          <span className="stat-selecting">Seleccionando: {playersSelecting}</span>
          <span className="stat-ready">Listos: {playersReady}</span>
        </div>
        {players.length === 0 ? (
          <p className="no-players">No hay jugadores conectados</p>
        ) : (
          <div className="players-list">
            {players.map((player) => (
              <div
                key={player.id}
                className={`player-card ${player.status === "ready" ? "ready" : "selecting"}`}
              >
                <span className="player-code">{player.playerCode}</span>
                <span className="player-status">
                  {player.status === "ready"
                    ? `✓ ${player.selectedCardIds.length} cartones`
                    : "Seleccionando..."}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="numbers-board">
        <h3>Tablero de Números (1 - {maxNumber})</h3>
        <div className="numbers-grid">
          {allNumbers.map((number) => (
            <div
              key={number}
              className={`number-cell ${drawnNumbers.includes(number) ? "drawn" : ""} ${
                number === lastDrawn ? "last" : ""
              }`}
            >
              {number}
            </div>
          ))}
        </div>
      </div>

      <div className="drawn-history">
        <h3>Historial ({drawnNumbers.length} números)</h3>
        <div className="history-numbers">
          {drawnNumbers.length === 0 ? (
            <p className="no-numbers">No se han sacado números</p>
          ) : (
            drawnNumbers.map((num, index) => (
              <span key={index} className="history-number">
                {num}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
