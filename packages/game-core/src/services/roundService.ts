import {
  LegacyRound,
  LegacyCreateRoundData,
  LegacyUpdateRoundData,
  GamePattern,
  StartMode,
  CardDeliveryConfig,
  Round,
} from '@bingo/domain';
import { roundRepository } from '../repositories';
import { RoundModel } from '../database/schemas';
import { connectToDatabase } from '../database/connection';
import { RoundMapper } from '../database/mappers';

/**
 * Round service - Business logic for round operations
 * Uses RoundRepository for data access
 *
 * NOTE: This service supports LEGACY round operations.
 * For new Game-based rounds, use the repository directly.
 */

/**
 * Data required to create a round (service layer interface)
 * @deprecated Use CreateRoundData with gameId for new rounds
 */
export interface CreateRoundInput {
  name: string;
  cardSize: number;
  maxNumber: number;
  minNumber?: number;
  gamePattern: GamePattern;
  startMode: StartMode;
  autoStartDelay?: number;
  createdBy: string;
  cardBunchId?: string;
  cardDelivery?: CardDeliveryConfig;
}

/**
 * Data allowed when updating a round (service layer interface)
 * @deprecated Use UpdateRoundData for new rounds
 */
export interface UpdateRoundInput {
  name?: string;
  cardSize?: number;
  maxNumber?: number;
  minNumber?: number;
  gamePattern?: GamePattern;
  startMode?: StartMode;
  autoStartDelay?: number;
  cardBunchId?: string;
  cardDelivery?: CardDeliveryConfig;
}

/**
 * Create a new round (legacy)
 * @deprecated Use roundRepository.create with gameId for new rounds
 */
export async function createRound(data: CreateRoundInput): Promise<LegacyRound> {
  const createData: LegacyCreateRoundData = {
    name: data.name,
    cardSize: data.cardSize,
    numberRange: {
      min: data.minNumber ?? 1,
      max: data.maxNumber,
    },
    gamePattern: data.gamePattern,
    startMode: data.startMode,
    autoStartDelay: data.autoStartDelay,
    createdBy: data.createdBy,
    cardBunchId: data.cardBunchId,
    cardDelivery: data.cardDelivery,
  };

  await connectToDatabase();
  const dbData = RoundMapper.toLegacyDatabase(createData);
  const doc = await RoundModel.create(dbData);
  return RoundMapper.toLegacyDomain(doc);
}

/**
 * Get all rounds by user ID (legacy)
 * @deprecated
 */
export async function getRoundsByUser(userId: string): Promise<LegacyRound[]> {
  await connectToDatabase();
  const docs = await RoundModel.find({ createdBy: userId }).sort({ createdAt: -1 });
  return docs.map(RoundMapper.toLegacyDomain);
}

/**
 * Get all rounds (legacy)
 * @deprecated
 */
export async function getAllRounds(): Promise<LegacyRound[]> {
  await connectToDatabase();
  const docs = await RoundModel.find().sort({ createdAt: -1 });
  return docs.map(RoundMapper.toLegacyDomain);
}

/**
 * Get a round by ID (legacy)
 * @deprecated
 */
export async function getRoundById(id: string): Promise<LegacyRound | null> {
  await connectToDatabase();
  const doc = await RoundModel.findById(id);
  return doc ? RoundMapper.toLegacyDomain(doc) : null;
}

/**
 * Update a round (only if status is 'configurada') (legacy)
 * @deprecated
 */
export async function updateRound(
  id: string,
  data: UpdateRoundInput
): Promise<LegacyRound | null> {
  await connectToDatabase();
  const doc = await RoundModel.findById(id);
  if (!doc) return null;

  const round = RoundMapper.toLegacyDomain(doc);

  // Business rule: Only allow editing if round is in 'configurada' status
  if (round.status !== 'configurada') {
    throw new Error('Solo se pueden editar rondas que no han iniciado');
  }

  const updateData: LegacyUpdateRoundData = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.cardSize !== undefined) updateData.cardSize = data.cardSize;
  if (data.maxNumber !== undefined || data.minNumber !== undefined) {
    updateData.numberRange = {
      min: data.minNumber ?? round.numberRange.min,
      max: data.maxNumber ?? round.numberRange.max,
    };
  }
  if (data.gamePattern !== undefined) updateData.gamePattern = data.gamePattern;
  if (data.startMode !== undefined) updateData.startMode = data.startMode;
  if (data.autoStartDelay !== undefined) updateData.autoStartDelay = data.autoStartDelay;
  if (data.cardBunchId !== undefined) updateData.cardBunchId = data.cardBunchId;
  if (data.cardDelivery !== undefined) updateData.cardDelivery = data.cardDelivery;

  const dbData = RoundMapper.toLegacyUpdateDatabase(updateData);
  const updatedDoc = await RoundModel.findByIdAndUpdate(id, dbData, {
    new: true,
    runValidators: true,
  });
  return updatedDoc ? RoundMapper.toLegacyDomain(updatedDoc) : null;
}

/**
 * Delete a round (only if status is 'configurada')
 */
export async function deleteRound(id: string): Promise<boolean> {
  const round = await getRoundById(id);
  if (!round) return false;

  // Business rule: Only allow deleting if round is in 'configurada' status
  if (round.status !== 'configurada') {
    throw new Error('Solo se pueden eliminar rondas que no han iniciado');
  }

  return roundRepository.delete(id);
}

/**
 * Start a round (change status to 'en_progreso')
 */
export async function startRound(id: string): Promise<Round | null> {
  const round = await roundRepository.findById(id);
  if (!round) return null;

  // Business rule: Can only start if status is 'configurada'
  if (round.status !== 'configurada') {
    throw new Error('Esta ronda ya ha sido iniciada o finalizada');
  }

  return roundRepository.updateStatus(id, 'en_progreso');
}

/**
 * End a round (change status to 'finalizada')
 */
export async function endRound(id: string): Promise<Round | null> {
  return roundRepository.updateStatus(id, 'finalizada');
}

/**
 * Draw a number in a round (legacy - validates against stored numberRange)
 */
export async function drawNumber(id: string, number: number): Promise<Round | null> {
  await connectToDatabase();
  const doc = await RoundModel.findById(id);
  if (!doc) return null;

  const round = RoundMapper.toLegacyDomain(doc);

  // Business rule: Can only draw numbers if round is in progress
  if (round.status !== 'en_progreso') {
    throw new Error('La ronda no esta en progreso');
  }

  // Business rule: Number must be within range (for legacy rounds with numberRange)
  if (doc.minNumber !== undefined && doc.maxNumber !== undefined) {
    if (number < doc.minNumber || number > doc.maxNumber) {
      throw new Error('El numero esta fuera del rango permitido');
    }
  }

  // Business rule: Number cannot be drawn twice
  if (round.drawnNumbers.includes(number)) {
    throw new Error('Este numero ya ha sido sacado');
  }

  return roundRepository.addDrawnNumber(id, number);
}
