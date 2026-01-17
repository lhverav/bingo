# Bingo App

## Overview
A bingo application with two main components:
- **Web Host**: Web application for the game host to manage games, draw numbers, and control game flow
- **Mobile Player**: Mobile app for players to join games, view their cards, and mark numbers

## Architecture
Monorepo structure using Turborepo/pnpm workspaces.

```
bingo/
├── apps/
│   ├── web-host/          # Web app for host (Next.js)
│   └── mobile-player/     # Mobile app for players (React Native/Expo)
├── packages/
│   └── shared/            # Shared game logic, types, utilities
├── CLAUDE.md
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## Tech Stack (To Be Decided)

| Component | Options Under Consideration |
|-----------|----------------------------|
| Web Host | Next.js, React + Vite |
| Mobile Player | React Native, Expo |
| Backend | Supabase, Firebase, Node.js + WebSockets |
| Real-time | Supabase Realtime, Socket.io, Firebase Realtime DB |
| Database | Supabase (Postgres), Firebase Firestore |

## Requirements (from casos de uso.pdf)

### Use Cases - Host (Web)

#### 1. Crear Ronda (Create Round)
Host configures a new round with:
- **Card size**: Configurable grid size
- **Number range**: Configurable min/max numbers
- **Game pattern**: Line, column, diagonal, full, special figures
- **Start mode**: Manual or automatic (with timer delay)
- **Round name**: Identifier for the round

System saves configuration and prepares cards.

#### 2. Rondas (Rounds Management)
Precondition: One or more rounds configured.
- List all configured rounds
- Actions per round: Edit, Start, Delete, View

#### 2.1 Editar Ronda (Edit Round)
- Modify any round configuration field
- Cancel option available

#### TODO: Additional Use Cases (pending documentation)
- Iniciar Ronda (Start Round)
- Ver Ronda (View Round)
- Eliminar Ronda (Delete Round)
- Player use cases (join, mark numbers, claim bingo)

### Game Rules & Logic (Shared)
- **Card size**: Configurable (not fixed 5x5)
- **Number range**: Configurable (not fixed 1-75)
- **Win patterns**:
  - Línea (horizontal line)
  - Columna (vertical line)
  - Diagonal
  - Completo (full card)
  - Figuras especiales (special figures/patterns)
- **Start modes**: Manual trigger or automatic with countdown timer

## Key Decisions Log
- [x] Repository strategy: Monorepo
- [x] Card size: Configurable
- [x] Number range: Configurable
- [x] Win patterns: Multiple options (line, column, diagonal, full, special)
- [ ] Tech stack selection
- [ ] Backend/real-time solution
- [ ] Authentication method

## Current Status
- [x] Initial monorepo setup (root config files)
- [ ] Create web-host app structure
- [ ] Create mobile-player app structure
- [ ] Define shared types and game logic
- [ ] Web host MVP
- [ ] Mobile player MVP
- [ ] Real-time integration
- [ ] Testing & deployment

## References
- Requirements document: `D:\bingo\requerimientos\casos de uso.pdf`

## Development Notes
<!-- Add notes, gotchas, and learnings here as the project evolves -->
