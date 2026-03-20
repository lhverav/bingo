import {
  GeneralParameters,
  UpdateGeneralParametersData,
} from '@bingo/domain';
import { generalParametersRepository } from '../repositories';

/**
 * GeneralParameters service - Business logic for general parameters operations
 * Uses GeneralParametersRepository for data access
 */

/**
 * Get the general parameters (creates defaults if none exist)
 */
export async function getGeneralParameters(): Promise<GeneralParameters> {
  return generalParametersRepository.get();
}

/**
 * Update general parameters
 */
export async function updateGeneralParameters(
  data: UpdateGeneralParametersData
): Promise<GeneralParameters> {
  // Business validations
  if (data.selectionTimeSeconds !== undefined && data.selectionTimeSeconds < 10) {
    throw new Error('El tiempo de selección debe ser al menos 10 segundos');
  }

  if (data.freeCardsDelivered !== undefined && data.freeCardsDelivered < 1) {
    throw new Error('Debe entregar al menos 1 cartón gratis');
  }

  if (data.freeCardsToSelect !== undefined && data.freeCardsToSelect < 1) {
    throw new Error('El jugador debe seleccionar al menos 1 cartón');
  }

  // Cross-field validation
  if (data.freeCardsToSelect !== undefined && data.freeCardsDelivered !== undefined) {
    if (data.freeCardsToSelect > data.freeCardsDelivered) {
      throw new Error('No se pueden seleccionar más cartones de los entregados');
    }
  } else if (data.freeCardsToSelect !== undefined) {
    const current = await generalParametersRepository.get();
    if (data.freeCardsToSelect > current.freeCardsDelivered) {
      throw new Error('No se pueden seleccionar más cartones de los entregados');
    }
  } else if (data.freeCardsDelivered !== undefined) {
    const current = await generalParametersRepository.get();
    if (current.freeCardsToSelect > data.freeCardsDelivered) {
      throw new Error('La cantidad a entregar no puede ser menor que la cantidad a seleccionar actual');
    }
  }

  if (data.maxCardsToBuy !== undefined && data.maxCardsToBuy < 1) {
    throw new Error('El máximo de cartones a comprar debe ser al menos 1');
  }

  if (data.paidCardsToIssue !== undefined && data.paidCardsToIssue < 1) {
    throw new Error('Los cartones a entregar (pago) debe ser al menos 1');
  }

  return generalParametersRepository.update(data);
}

/**
 * Reset general parameters to defaults
 */
export async function resetGeneralParameters(): Promise<GeneralParameters> {
  return generalParametersRepository.reset();
}
