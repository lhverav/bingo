import mongoose from 'mongoose';
import { CARD_TYPE_CONFIG, CardType } from '@bingo/domain';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bingo_dev';

const PatternSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    cardType: { type: String, enum: ['bingo', 'bingote'], required: true },
    cells: { type: [[Boolean]], required: true },
    isPreset: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Unique constraint: pattern name should be unique per card type
PatternSchema.index({ name: 1, cardType: 1 }, { unique: true });

/**
 * Generate preset patterns for a card type
 */
function generatePresetPatterns(cardType: CardType) {
  const config = CARD_TYPE_CONFIG[cardType];
  const { rows, columns } = config;
  const freeRow = config.freeSpacePosition.row;
  const freeCol = config.freeSpacePosition.col;

  const patterns = [];

  // 1. Línea (middle row)
  const linePattern: boolean[][] = Array(rows)
    .fill(null)
    .map(() => Array(columns).fill(false));
  const middleRow = Math.floor(rows / 2);
  for (let col = 0; col < columns; col++) {
    linePattern[middleRow][col] = true;
  }
  patterns.push({
    name: 'Línea',
    cardType,
    cells: linePattern,
    isPreset: true,
  });

  // 2. Columna (middle column)
  const columnPattern: boolean[][] = Array(rows)
    .fill(null)
    .map(() => Array(columns).fill(false));
  const middleCol = Math.floor(columns / 2);
  for (let row = 0; row < rows; row++) {
    columnPattern[row][middleCol] = true;
  }
  patterns.push({
    name: 'Columna',
    cardType,
    cells: columnPattern,
    isPreset: true,
  });

  // 3. Diagonal (both diagonals - X shape for square, adapted for non-square)
  const diagonalPattern: boolean[][] = Array(rows)
    .fill(null)
    .map(() => Array(columns).fill(false));
  // Main diagonal (top-left to bottom-right)
  for (let i = 0; i < Math.min(rows, columns); i++) {
    diagonalPattern[i][i] = true;
  }
  // If non-square, extend to corners
  if (columns > rows) {
    // For BINGOTE (7x5), use corner-to-corner diagonals
    for (let i = 0; i < rows; i++) {
      const col1 = Math.round((i / (rows - 1)) * (columns - 1));
      const col2 = columns - 1 - col1;
      diagonalPattern[i][col1] = true;
      diagonalPattern[i][col2] = true;
    }
  } else {
    // For square grids, anti-diagonal
    for (let i = 0; i < rows; i++) {
      diagonalPattern[i][columns - 1 - i] = true;
    }
  }
  patterns.push({
    name: 'Diagonal',
    cardType,
    cells: diagonalPattern,
    isPreset: true,
  });

  // 4. Esquinas (four corners)
  const cornersPattern: boolean[][] = Array(rows)
    .fill(null)
    .map(() => Array(columns).fill(false));
  cornersPattern[0][0] = true;
  cornersPattern[0][columns - 1] = true;
  cornersPattern[rows - 1][0] = true;
  cornersPattern[rows - 1][columns - 1] = true;
  patterns.push({
    name: 'Esquinas',
    cardType,
    cells: cornersPattern,
    isPreset: true,
  });

  // 5. Cartón Completo (full card)
  const fullPattern: boolean[][] = Array(rows)
    .fill(null)
    .map(() => Array(columns).fill(true));
  patterns.push({
    name: 'Cartón Completo',
    cardType,
    cells: fullPattern,
    isPreset: true,
  });

  return patterns;
}

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);

  const Pattern = mongoose.models.Pattern || mongoose.model('Pattern', PatternSchema);

  // Generate patterns for both card types
  const cardTypes: CardType[] = ['bingo', 'bingote'];

  for (const cardType of cardTypes) {
    console.log(`\nGenerating patterns for ${cardType.toUpperCase()}...`);
    const patterns = generatePresetPatterns(cardType);

    for (const patternData of patterns) {
      await Pattern.findOneAndUpdate(
        { name: patternData.name, cardType: patternData.cardType },
        patternData,
        { upsert: true, new: true }
      );
      console.log(`  ✓ Pattern "${patternData.name}" created/updated`);
    }
  }

  await mongoose.disconnect();
  console.log('\nSeed completed!');
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
