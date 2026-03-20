"use client";

import { useState, useEffect } from "react";
import { CardType, CARD_TYPE_CONFIG } from "@bingo/domain";

interface PatternEditorProps {
  cardType: CardType;
  initialCells?: boolean[][];
  onChange?: (cells: boolean[][]) => void;
}

export default function PatternEditor({
  cardType,
  initialCells,
  onChange,
}: PatternEditorProps) {
  const config = CARD_TYPE_CONFIG[cardType];
  const { rows, columns, letters, freeSpacePosition } = config;

  // Initialize cells
  const [cells, setCells] = useState<boolean[][]>(() => {
    if (initialCells && initialCells.length === rows) {
      return initialCells;
    }
    return Array(rows)
      .fill(null)
      .map(() => Array(columns).fill(false));
  });

  // Reset when card type changes
  useEffect(() => {
    if (!initialCells) {
      setCells(
        Array(rows)
          .fill(null)
          .map(() => Array(columns).fill(false))
      );
    }
  }, [cardType, rows, columns, initialCells]);

  // Notify parent of changes
  useEffect(() => {
    onChange?.(cells);
  }, [cells, onChange]);

  const toggleCell = (row: number, col: number) => {
    setCells((prev) => {
      const newCells = prev.map((r) => [...r]);
      newCells[row][col] = !newCells[row][col];
      return newCells;
    });
  };

  const clearAll = () => {
    setCells(
      Array(rows)
        .fill(null)
        .map(() => Array(columns).fill(false))
    );
  };

  const fillAll = () => {
    setCells(
      Array(rows)
        .fill(null)
        .map(() => Array(columns).fill(true))
    );
  };

  const isFreeSpace = (row: number, col: number) => {
    return row === freeSpacePosition.row && col === freeSpacePosition.col;
  };

  return (
    <div className="pattern-editor">
      <div className="editor-toolbar">
        <button type="button" onClick={clearAll} className="btn-small">
          Limpiar Todo
        </button>
        <button type="button" onClick={fillAll} className="btn-small">
          Llenar Todo
        </button>
      </div>

      <div className="editor-grid-container">
        {/* Header row with letters */}
        <div
          className="editor-header"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {letters.map((letter) => (
            <div key={letter} className="header-cell">
              {letter}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div
          className="editor-grid"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {cells.map((row, rowIdx) =>
            row.map((cell, colIdx) => (
              <button
                key={`${rowIdx}-${colIdx}`}
                type="button"
                className={`editor-cell ${cell ? "active" : ""} ${isFreeSpace(rowIdx, colIdx) ? "free-space" : ""}`}
                onClick={() => toggleCell(rowIdx, colIdx)}
                title={
                  isFreeSpace(rowIdx, colIdx)
                    ? "Espacio Libre (siempre marcado)"
                    : `Fila ${rowIdx + 1}, Columna ${letters[colIdx]}`
                }
              >
                {isFreeSpace(rowIdx, colIdx) && (
                  <span className="free-label">FREE</span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Hidden input to submit cells */}
      <input type="hidden" name="cells" value={JSON.stringify(cells)} />

      <style jsx>{`
        .pattern-editor {
          margin: 1rem 0;
        }

        .editor-toolbar {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .btn-small {
          padding: 0.25rem 0.75rem;
          font-size: 0.875rem;
          border: 1px solid var(--border-color, #ccc);
          border-radius: 4px;
          background: var(--btn-bg, #f0f0f0);
          cursor: pointer;
        }

        .btn-small:hover {
          background: var(--btn-hover-bg, #e0e0e0);
        }

        .editor-grid-container {
          display: inline-block;
          border: 2px solid var(--border-color, #333);
          border-radius: 8px;
          overflow: hidden;
        }

        .editor-header {
          display: grid;
          background: var(--header-bg, #333);
          color: white;
        }

        .header-cell {
          padding: 0.5rem;
          text-align: center;
          font-weight: bold;
          font-size: 1rem;
        }

        .editor-grid {
          display: grid;
          gap: 2px;
          padding: 2px;
          background: var(--grid-bg, #ccc);
        }

        .editor-cell {
          width: 50px;
          height: 50px;
          border: none;
          background: var(--cell-bg, #fff);
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .editor-cell:hover {
          background: var(--cell-hover, #e3f2fd);
        }

        .editor-cell.active {
          background: var(--cell-active, #4caf50);
        }

        .editor-cell.active:hover {
          background: var(--cell-active-hover, #43a047);
        }

        .editor-cell.free-space {
          background: var(--free-space-bg, #ffd700);
        }

        .editor-cell.free-space.active {
          background: var(--free-space-active, #ffc107);
        }

        .free-label {
          font-size: 0.625rem;
          font-weight: bold;
          color: var(--free-space-text, #333);
        }
      `}</style>
    </div>
  );
}
