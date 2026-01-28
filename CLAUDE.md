# Bingo App

## Overview
A bingo application with two main components:
- **Web Host**: Web application for the game host to manage games, draw numbers, and control game flow
- **Mobile Player**: Mobile app for players to join games, view their cards, and mark numbers

## Architecture

### Monorepo Structure
Uses Turborepo/pnpm workspaces with **Clean Architecture** principles.

```
bingo/
├── apps/
│   ├── web-host/                    # Web app for host (Next.js)
│   │   └── src/
│   │       ├── app/                 # Next.js pages and API routes
│   │       ├── infrastructure/      # Database concerns (schemas, mappers, repositories)
│   │       └── lib/
│   │           ├── services/        # Business logic layer
│   │           └── actions/         # Server actions
│   └── mobile-player/
│       ├── client/                  # Mobile app (Expo/React Native)
│       └── server/                  # Socket.io backend (Express)
├── packages/
│   ├── domain/                      # Pure domain entities and value objects
│   └── shared/                      # Shared utilities (legacy, prefer domain)
├── CLAUDE.md
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

### Clean Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                    packages/domain                              │
│              (Pure entities, NO database concerns)              │
│   - Entities: User, Round, Card, Player                         │
│   - Value Objects: GamePattern, RoundStatus, StartMode          │
│   - Events: GameEvent, GameState (for real-time)                │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ imports
┌─────────────────────────────┴───────────────────────────────────┐
│                    apps/web-host                                │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ src/lib/services/           (Business Logic Layer)       │   │
│  │ - Contains business rules and validation                 │   │
│  │ - Uses repositories for data access                      │   │
│  │ - Returns domain entities                                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ src/infrastructure/repositories/  (Data Access Layer)    │   │
│  │ - Abstracts database operations                          │   │
│  │ - Uses mappers to convert between domain and DB          │   │
│  │ - Returns domain entities                                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ src/infrastructure/database/                              │   │
│  │ ├── schemas/    (Mongoose schemas - DB structure)         │   │
│  │ └── mappers/    (Domain ↔ Database translation)           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Architecture Principles (MUST FOLLOW)

### 1. Domain Layer (`packages/domain`)
- **Pure TypeScript interfaces** - NO Mongoose, NO database annotations
- Defines the shape of business entities
- Can be imported by ALL apps (web-host, mobile-player)
- Contains:
  - `entities/` - Core business objects (User, Round, Card, Player)
  - `value-objects/` - Immutable types (GamePattern, RoundStatus)
  - `events/` - Real-time event types (not persisted)

### 2. Infrastructure Layer (`apps/*/src/infrastructure`)
- **Database-specific code lives here**
- Contains:
  - `database/schemas/` - Mongoose schemas with validation
  - `database/mappers/` - Convert domain ↔ database documents
  - `repositories/` - Data access abstraction

### 3. Services Layer (`apps/*/src/lib/services`)
- **Business logic and rules**
- Uses repositories (never direct Mongoose calls)
- Returns domain entities (never Mongoose documents)

### 4. Key Rules

#### DO:
- Import entities from `@bingo/domain`
- Use repositories in services
- Use mappers in repositories
- Keep domain entities pure (no `_id`, use `id`)
- Use `numberRange: { min, max }` in domain (not `maxNumber`)

#### DON'T:
- Import Mongoose types in pages/components
- Use `_id` or `ObjectId` outside infrastructure layer
- Put business logic in repositories
- Put database logic in services
- Create Mongoose schemas outside `infrastructure/database/schemas/`

## Adding New Features

### Adding a New Entity (e.g., Card)

1. **Domain entity** (`packages/domain/src/entities/card.ts`):
```typescript
export interface Card {
  id: string;           // Always string, never ObjectId
  playerId: string;
  roundId: string;
  cells: CardCell[][];
  createdAt: Date;
}
```

2. **Database schema** (`apps/web-host/src/infrastructure/database/schemas/card.schema.ts`):
```typescript
const CardSchema = new Schema({
  playerId: { type: Schema.Types.ObjectId, ref: 'Player' },
  roundId: { type: Schema.Types.ObjectId, ref: 'Round' },
  cells: [[{ number: Number, marked: Boolean }]],
}, { timestamps: true });
```

3. **Mapper** (`apps/web-host/src/infrastructure/database/mappers/card.mapper.ts`):
```typescript
export class CardMapper {
  static toDomain(doc: CardDocument): Card {
    return {
      id: doc._id.toString(),
      playerId: doc.playerId.toString(),
      // ... convert all fields
    };
  }

  static toDatabase(data: CreateCardData): Record<string, unknown> {
    return { /* ... */ };
  }
}
```

4. **Repository** (`apps/web-host/src/infrastructure/repositories/card.repository.ts`):
```typescript
export class CardRepository {
  async findById(id: string): Promise<Card | null> {
    const doc = await CardModel.findById(id);
    return doc ? CardMapper.toDomain(doc) : null;
  }
}
```

5. **Service** (`apps/web-host/src/lib/services/cardService.ts`):
```typescript
export async function createCard(data: CreateCardInput): Promise<Card> {
  // Business logic here
  return cardRepository.create(data);
}
```

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Web Host | Next.js 14.2 |
| Mobile Client | Expo 54 / React Native 0.81 |
| Mobile Server | Express + Socket.io |
| Database | MongoDB + Mongoose |
| Authentication | iron-session + bcryptjs |
| Monorepo | Turborepo + pnpm |

## Database

- **Connection**: MongoDB local (`mongodb://127.0.0.1:27017/bingo_dev`)
- **Collections**: users, rounds (cards, players to be added)

### Test Users (from seed)
| Email | Password | Role |
|-------|----------|------|
| host@bingo.com | 123456 | host |
| admin@bingo.com | admin123 | admin |

## Microservices Preparation

This architecture is designed for future microservices migration:

- `packages/domain` → Becomes shared API contracts/DTOs
- Each service gets its own `infrastructure/` layer
- Each service can have its own database
- Services communicate via API + events (not shared DB)

**When migrating**: Domain entities stay shared, infrastructure is duplicated per service.

## Commands

```bash
# Install dependencies
pnpm install

# Development
pnpm dev           # All apps
pnpm dev:web       # Only web-host (port 3000)
pnpm dev:mobile    # Only mobile

# Build
pnpm build

# Seed database
pnpm seed          # From web-host directory

# Type check
pnpm lint
```

## File Naming Conventions

| Type | Location | Naming |
|------|----------|--------|
| Domain entity | `packages/domain/src/entities/` | `{entity}.ts` |
| Value object | `packages/domain/src/value-objects/` | `{name}.ts` |
| Mongoose schema | `apps/*/src/infrastructure/database/schemas/` | `{entity}.schema.ts` |
| Mapper | `apps/*/src/infrastructure/database/mappers/` | `{entity}.mapper.ts` |
| Repository | `apps/*/src/infrastructure/repositories/` | `{entity}.repository.ts` |
| Service | `apps/*/src/lib/services/` | `{entity}Service.ts` |

## Requirements (from casos de uso.pdf)

### Use Cases - Host (Web)

#### 1. Crear Ronda (Create Round)
Host configures a new round with:
- **Card size**: Configurable grid size (3-10)
- **Number range**: Configurable min/max numbers
- **Game pattern**: Line, column, diagonal, full, special figures
- **Start mode**: Manual or automatic (with timer delay)
- **Round name**: Identifier for the round

#### 2. Rondas (Rounds Management)
- List all configured rounds
- Actions per round: Edit, Start, Delete, View

### Game Rules & Logic
- **Card size**: Configurable (not fixed 5x5)
- **Number range**: Configurable (not fixed 1-75)
- **Win patterns**: linea, columna, diagonal, completo, figura_especial
- **Start modes**: Manual trigger or automatic with countdown timer

## Current Status
- [x] Initial monorepo setup
- [x] Clean architecture implementation
- [x] Web host MVP (rounds CRUD, game board)
- [x] Mobile app base structure
- [x] Real-time notification (round start)
- [ ] Card generation and distribution
- [ ] Player joining games
- [ ] Bingo claim verification
- [ ] Complete real-time game sync

## References
- Requirements document: `D:\bingo\requerimientos\casos de uso.pdf`
