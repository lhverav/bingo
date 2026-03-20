import mongoose from 'mongoose';
import { DEFAULT_GENERAL_PARAMETERS } from '@bingo/domain';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bingo_dev';

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

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);

  const GeneralParameters =
    mongoose.models.GeneralParameters ||
    mongoose.model('GeneralParameters', GeneralParametersSchema);

  // Check if parameters exist
  const existing = await GeneralParameters.findOne();

  if (existing) {
    console.log('General parameters already exist. Skipping seed.');
    console.log('Current values:', {
      selectionTimeSeconds: existing.selectionTimeSeconds,
      freeCardsDelivered: existing.freeCardsDelivered,
      freeCardsToSelect: existing.freeCardsToSelect,
      maxCardsToBuy: existing.maxCardsToBuy,
      paidCardsToIssue: existing.paidCardsToIssue,
    });
  } else {
    await GeneralParameters.create(DEFAULT_GENERAL_PARAMETERS);
    console.log('General parameters created with defaults:', DEFAULT_GENERAL_PARAMETERS);
  }

  await mongoose.disconnect();
  console.log('\nSeed completed!');
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
