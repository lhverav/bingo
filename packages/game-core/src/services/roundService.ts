import { Round } from '@bingo/domain';
import { roundRepository } from '../repositories';

/**
 * Round service - Business logic for round operations
 * Uses RoundRepository for data access
 *
 * NOTE: Round CRUD operations are handled via roundRepository directly.
 * This service provides additional business logic for round state transitions.
 */

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
 * Validates the number hasn't been drawn before
 */
export async function drawNumber(id: string, number: number): Promise<Round | null> {
  const round = await roundRepository.findById(id);
  if (!round) return null;

  // Business rule: Can only draw numbers if round is in progress
  if (round.status !== 'en_progreso') {
    throw new Error('La ronda no esta en progreso');
  }

  // Business rule: Number cannot be drawn twice
  if (round.drawnNumbers.includes(number)) {
    throw new Error('Este numero ya ha sido sacado');
  }

  return roundRepository.addDrawnNumber(id, number);
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
