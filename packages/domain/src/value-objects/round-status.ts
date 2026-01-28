/**
 * Estado de una ronda de bingo
 */
export type RoundStatus =
  | 'configurada'  // Created, not started
  | 'en_progreso'  // In progress
  | 'finalizada'   // Completed
  | 'cancelada';   // Cancelled

export const ROUND_STATUS_LABELS: Record<RoundStatus, string> = {
  configurada: 'Configurada',
  en_progreso: 'En Progreso',
  finalizada: 'Finalizada',
  cancelada: 'Cancelada',
};

export const ALL_ROUND_STATUSES: RoundStatus[] = [
  'configurada',
  'en_progreso',
  'finalizada',
  'cancelada',
];
