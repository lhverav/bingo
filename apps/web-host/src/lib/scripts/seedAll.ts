import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { CARD_TYPE_CONFIG, CardType, DEFAULT_GENERAL_PARAMETERS } from '@bingo/domain';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bingo_dev';

// ============================================================================
// SCHEMAS
// ============================================================================

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['host', 'admin'], default: 'host' },
  },
  { timestamps: true }
);

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
PatternSchema.index({ name: 1, cardType: 1 }, { unique: true });

const GeneralParametersSchema = new mongoose.Schema(
  {
    selectionTimeSeconds: { type: Number, required: true, default: 60 },
    freeCardsDelivered: { type: Number, required: true, default: 5 },
    freeCardsToSelect: { type: Number, required: true, default: 2 },
    maxCardsToBuy: { type: Number, required: true, default: 10 },
    paidCardsToIssue: { type: Number, required: true, default: 5 },
  },
  { timestamps: true }
);

// ============================================================================
// SEED FUNCTIONS
// ============================================================================

async function seedUsers() {
  console.log('\n📋 Seeding Users...');
  const User = mongoose.models.User || mongoose.model('User', UserSchema);

  const users = [
    {
      email: 'host@bingo.com',
      password: await bcrypt.hash('123456', 12),
      name: 'Host Principal',
      role: 'host',
    },
    {
      email: 'admin@bingo.com',
      password: await bcrypt.hash('admin123', 12),
      name: 'Administrador',
      role: 'admin',
    },
  ];

  for (const userData of users) {
    await User.findOneAndUpdate({ email: userData.email }, userData, {
      upsert: true,
      new: true,
    });
    console.log(`  ✓ User ${userData.email} created/updated`);
  }
}

function generatePresetPatterns(cardType: CardType) {
  const config = CARD_TYPE_CONFIG[cardType];
  const { rows, columns } = config;

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

  // 3. Diagonal (both diagonals)
  const diagonalPattern: boolean[][] = Array(rows)
    .fill(null)
    .map(() => Array(columns).fill(false));
  if (columns > rows) {
    // For non-square (BINGOTE), corner-to-corner diagonals
    for (let i = 0; i < rows; i++) {
      const col1 = Math.round((i / (rows - 1)) * (columns - 1));
      const col2 = columns - 1 - col1;
      diagonalPattern[i][col1] = true;
      diagonalPattern[i][col2] = true;
    }
  } else {
    // For square grids, X shape
    for (let i = 0; i < rows; i++) {
      diagonalPattern[i][i] = true;
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

async function seedPatterns() {
  console.log('\n🎯 Seeding Patterns...');
  const Pattern = mongoose.models.Pattern || mongoose.model('Pattern', PatternSchema);

  const cardTypes: CardType[] = ['bingo', 'bingote'];

  for (const cardType of cardTypes) {
    console.log(`  ${cardType.toUpperCase()}:`);
    const patterns = generatePresetPatterns(cardType);

    for (const patternData of patterns) {
      await Pattern.findOneAndUpdate(
        { name: patternData.name, cardType: patternData.cardType },
        patternData,
        { upsert: true, new: true }
      );
      console.log(`    ✓ ${patternData.name}`);
    }
  }
}

async function seedGeneralParameters() {
  console.log('\n⚙️  Seeding General Parameters...');
  const GeneralParameters =
    mongoose.models.GeneralParameters ||
    mongoose.model('GeneralParameters', GeneralParametersSchema);

  const existing = await GeneralParameters.findOne();

  if (existing) {
    console.log('  ℹ General parameters already exist (not modified)');
  } else {
    await GeneralParameters.create(DEFAULT_GENERAL_PARAMETERS);
    console.log('  ✓ General parameters created with defaults');
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function seed() {
  console.log('🌱 Starting seed process...');
  console.log(`📦 Connecting to: ${MONGODB_URI}`);

  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  await seedUsers();
  await seedPatterns();
  await seedGeneralParameters();

  await mongoose.disconnect();
  console.log('\n🎉 All seeds completed successfully!');
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
