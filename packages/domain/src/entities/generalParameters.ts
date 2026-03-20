/**
 * General Parameters Entity
 * Global configuration for game settings
 */

export interface GeneralParameters {
  id: string;
  selectionTimeSeconds: number;
  freeCardsDelivered: number;
  freeCardsToSelect: number;
  maxCardsToBuy: number;
  paidCardsToIssue: number;
  updatedAt: Date;
}

export interface UpdateGeneralParametersData {
  selectionTimeSeconds?: number;
  freeCardsDelivered?: number;
  freeCardsToSelect?: number;
  maxCardsToBuy?: number;
  paidCardsToIssue?: number;
}

export const DEFAULT_GENERAL_PARAMETERS: Omit<GeneralParameters, 'id' | 'updatedAt'> = {
  selectionTimeSeconds: 60,
  freeCardsDelivered: 5,
  freeCardsToSelect: 2,
  maxCardsToBuy: 10,
  paidCardsToIssue: 5,
};

export const GENERAL_PARAMETERS_LABELS: Record<keyof Omit<GeneralParameters, 'id' | 'updatedAt'>, string> = {
  selectionTimeSeconds: 'Tiempo para seleccionar (segundos)',
  freeCardsDelivered: 'Cartones a entregar (gratis)',
  freeCardsToSelect: 'Cartones a seleccionar (gratis)',
  maxCardsToBuy: 'Máximo cartones a comprar',
  paidCardsToIssue: 'Cartones a entregar (pago)',
};
