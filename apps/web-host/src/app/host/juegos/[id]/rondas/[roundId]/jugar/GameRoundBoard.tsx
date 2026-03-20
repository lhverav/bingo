"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RoundPlayer, CardType, CARD_TYPE_CONFIG } from "@bingo/domain";

interface WinnerInfo {
  playerId: string;
  playerCode: string;
  cardId: string;
}

interface GameRoundBoardProps {
  gameId: string;
  roundId: string;
  allNumbers: number[];
  drawnNumbers: number[];
  isFinished: boolean;
  maxNumber: number;
  initialPlayers: RoundPlayer[];
  patternCells?: boolean[][];
  cardType: CardType;
}

export default function GameRoundBoard({
  gameId,
  roundId,
  allNumbers,
  drawnNumbers: initialDrawnNumbers,
  isFinished: initialIsFinished,
  maxNumber,
  initialPlayers,
  patternCells,
  cardType,
}: GameRoundBoardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>(initialDrawnNumbers);
  const [lastDrawn, setLastDrawn] = useState<number | null>(
    initialDrawnNumbers.length > 0
      ? initialDrawnNumbers[initialDrawnNumbers.length - 1]
      : null
  );
  const [isFinished, setIsFinished] = useState(initialIsFinished);
  const [error, setError] = useState<string | null>(null);
  const [players, setPlayers] = useState<RoundPlayer[]>(initialPlayers);
  const [winners, setWinners] = useState<WinnerInfo[]>([]);
  const [showPostWinnerWarning, setShowPostWinnerWarning] = useState(false);

  const config = CARD_TYPE_CONFIG[cardType];

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

  const playersSelecting = players.filter((p) => p.status === "selecting").length;
  const playersReady = players.filter((p) => p.status === "ready").length;

  const availableNumbers = allNumbers.filter((n) => !drawnNumbers.includes(n));

  const drawRandomNumber = async () => {
    if (availableNumbers.length === 0 || isFinished) return;

    // If there are winners and warning not yet shown, show warning first
    if (winners.length > 0 && !showPostWinnerWarning) {
      setShowPostWinnerWarning(true);
      return;
    }

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

      const data = await response.json();
      setDrawnNumbers([...drawnNumbers, number]);
      setLastDrawn(number);
      setError(null);

      // Check for new winners
      if (data.winners && data.winners.length > 0) {
        setWinners((prev) => {
          const existingIds = new Set(prev.map((w) => w.cardId));
          const newWinners = data.winners.filter(
            (w: WinnerInfo) => !existingIds.has(w.cardId)
          );
          return [...prev, ...newWinners];
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const handleContinueDrawing = async () => {
    setShowPostWinnerWarning(false);

    const randomIndex = Math.floor(Math.random() * availableNumbers.length);
    const number = availableNumbers[randomIndex];

    try {
      const response = await fetch(`/api/rounds/${roundId}/draw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number }),
      });

      const data = await response.json();
      if (data.success) {
        setDrawnNumbers([...drawnNumbers, number]);
        setLastDrawn(number);
        setError(null);
        if (data.winners && data.winners.length > 0) {
          setWinners((prev) => {
            const existingIds = new Set(prev.map((w) => w.cardId));
            const newWinners = data.winners.filter(
              (w: WinnerInfo) => !existingIds.has(w.cardId)
            );
            return [...prev, ...newWinners];
          });
        }
      }
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

  // Get letter for a number based on card type
  const getLetterForNumber = (num: number): string => {
    for (const range of config.ranges) {
      if (num >= range.min && num <= range.max) {
        return range.letter;
      }
    }
    return "";
  };

  return (
    <div className="game-board">
      {error && <div className="error-message">{error}</div>}

      {/* Post-winner warning modal */}
      {showPostWinnerWarning && (
        <div className="warning-overlay">
          <div className="warning-modal">
            <h3>Ya hay ganador(es)</h3>
            <p>
              Ya existe al menos un ganador. ¿Deseas continuar sacando números?
            </p>
            <div className="warning-buttons">
              <button onClick={handleContinueDrawing} className="btn-continue">
                Sí, continuar
              </button>
              <button
                onClick={() => setShowPostWinnerWarning(false)}
                className="btn-cancel"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="last-drawn-section">
        <h2>Último Número</h2>
        {lastDrawn ? (
          <div className="last-drawn-container">
            <span className="last-drawn-letter">{getLetterForNumber(lastDrawn)}</span>
            <span className="last-drawn-number">{lastDrawn}</span>
          </div>
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
              className={`btn-draw ${winners.length > 0 ? "has-winner" : ""}`}
            >
              {isPending ? "Sacando..." : "Sacar Número"}
              {winners.length > 0 && " (Hay ganador)"}
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

      {/* Pattern Preview */}
      {patternCells && (
        <div className="pattern-preview-section">
          <h3>Patrón a Completar</h3>
          <div
            className="pattern-preview-grid"
            style={{ gridTemplateColumns: `repeat(${config.columns}, 1fr)` }}
          >
            {patternCells.flatMap((row, rowIdx) =>
              row.map((cell, colIdx) => (
                <div
                  key={`${rowIdx}-${colIdx}`}
                  className={`pattern-preview-cell ${cell ? "active" : ""}`}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Winners Section */}
      {winners.length > 0 && (
        <div className="winners-section">
          <h3>Ganadores ({winners.length})</h3>
          <div className="winners-list">
            {winners.map((winner, index) => (
              <div key={index} className="winner-card">
                <span className="winner-code">{winner.playerCode}</span>
                <span className="winner-badge">BINGO!</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
                    ? `${player.selectedCardIds.length} cartones`
                    : "Seleccionando..."}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Numbers Board by Letter */}
      <div className="numbers-board">
        <h3>
          Tablero de Números ({cardType.toUpperCase()} - 1 a {maxNumber})
        </h3>
        <div className="numbers-by-letter">
          {config.letters.map((letter, letterIdx) => {
            const range = config.ranges[letterIdx];
            const letterNumbers: number[] = [];
            for (let i = range.min; i <= range.max; i++) {
              letterNumbers.push(i);
            }

            return (
              <div key={letter} className="letter-column">
                <div className="letter-header">{letter}</div>
                <div className="letter-numbers">
                  {letterNumbers.map((number) => (
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
            );
          })}
        </div>
      </div>

      {/* Drawn History */}
      <div className="drawn-history">
        <h3>Historial ({drawnNumbers.length} números)</h3>
        <div className="history-numbers">
          {drawnNumbers.length === 0 ? (
            <p className="no-numbers">No se han sacado números</p>
          ) : (
            drawnNumbers.map((num, index) => (
              <span key={index} className="history-number">
                {getLetterForNumber(num)}-{num}
              </span>
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        .warning-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .warning-modal {
          background: white;
          padding: 24px;
          border-radius: 12px;
          max-width: 400px;
          text-align: center;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }
        .warning-modal h3 {
          color: #e74c3c;
          margin-bottom: 12px;
        }
        .warning-buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-top: 20px;
        }
        .btn-continue {
          background: #e74c3c;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }
        .btn-cancel {
          background: #95a5a6;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }
        .btn-draw.has-winner {
          background: #f39c12;
        }

        .last-drawn-container {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .last-drawn-letter {
          font-size: 1.5rem;
          font-weight: bold;
          color: var(--primary-color, #333);
        }
        .last-drawn-number {
          font-size: 4rem;
          font-weight: bold;
          color: var(--accent-color, #4caf50);
        }

        .pattern-preview-section {
          margin: 1rem 0;
          text-align: center;
        }
        .pattern-preview-grid {
          display: inline-grid;
          gap: 2px;
          padding: 8px;
          background: #ccc;
          border-radius: 8px;
        }
        .pattern-preview-cell {
          width: 24px;
          height: 24px;
          background: #fff;
          border-radius: 2px;
        }
        .pattern-preview-cell.active {
          background: #4caf50;
        }

        .numbers-by-letter {
          display: flex;
          gap: 4px;
          overflow-x: auto;
        }
        .letter-column {
          display: flex;
          flex-direction: column;
          min-width: 50px;
        }
        .letter-header {
          background: var(--header-bg, #333);
          color: white;
          padding: 8px;
          text-align: center;
          font-weight: bold;
          font-size: 1.25rem;
        }
        .letter-numbers {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .winners-section {
          background: linear-gradient(135deg, #f1c40f 0%, #f39c12 100%);
          padding: 16px;
          border-radius: 12px;
          margin: 16px 0;
        }
        .winners-section h3 {
          color: #333;
          margin-bottom: 12px;
        }
        .winners-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .winner-card {
          background: white;
          padding: 8px 16px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .winner-code {
          font-weight: bold;
          font-size: 16px;
        }
        .winner-badge {
          background: #27ae60;
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
        }

        .history-number {
          display: inline-block;
          background: var(--history-bg, #333);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          margin: 2px;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}
