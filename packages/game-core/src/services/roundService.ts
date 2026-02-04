import {
  Round,
  CreateRoundData as DomainCreateRoundData,
  UpdateRoundData as DomainUpdateRoundData,
  GamePattern,
  StartMode,
} from '@bingo/domain';
import { roundRepository } from '../repositories';

/**
 * Round service - Business logic for round operations
 * Uses RoundRepository for data access
 */

/**
 * Data required to create a round (service layer interface)
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
}

/**
 * Data allowed when updating a round (service layer interface)
 */
export interface UpdateRoundInput {
  name?: string;
  cardSize?: number;
  maxNumber?: number;
  minNumber?: number;
  gamePattern?: GamePattern;
  startMode?: StartMode;
  autoStartDelay?: number;
}

/**
 * Create a new round
 */
export async function createRound(data: CreateRoundInput): Promise<Round> {
  const createData: DomainCreateRoundData = {
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
  };

  return roundRepository.create(createData);
}

/**
 * Get all rounds by user ID
 */
export async function getRoundsByUser(userId: string): Promise<Round[]> {
  return roundRepository.findByUserId(userId);
}

/**
 * Get all rounds
 */
export async function getAllRounds(): Promise<Round[]> {
  return roundRepository.findAll();
}

/**
 * Get a round by ID
 */
export async function getRoundById(id: string): Promise<Round | null> {
  return roundRepository.findById(id);
}

/**
 * Update a round (only if status is 'configurada')
 */
export async function updateRound(
  id: string,
  data: UpdateRoundInput
): Promise<Round | null> {
  const round = await roundRepository.findById(id);
  if (!round) return null;

  // Business rule: Only allow editing if round is in 'configurada' status
  if (round.status !== 'configurada') {
    throw new Error('Solo se pueden editar rondas que no han iniciado');
  }

  const updateData: DomainUpdateRoundData = {};

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

  return roundRepository.update(id, updateData);
}

/**
 * Delete a round (only if status is 'configurada')
 */
export async function deleteRound(id: string): Promise<boolean> {
  const round = await roundRepository.findById(id);
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
 * Draw a number in a round
 */
export async function drawNumber(id: string, number: number): Promise<Round | null> {
  const round = await roundRepository.findById(id);
  if (!round) return null;

  // Business rule: Can only draw numbers if round is in progress
  if (round.status !== 'en_progreso') {
    throw new Error('La ronda no esta en progreso');
  }

  // Business rule: Number must be within range
  if (number < round.numberRange.min || number > round.numberRange.max) {
    throw new Error('El numero esta fuera del rango permitido');
  }

  // Business rule: Number cannot be drawn twice
  if (round.drawnNumbers.includes(number)) {
    throw new Error('Este numero ya ha sido sacado');
  }

  return roundRepository.addDrawnNumber(id, number);
}
