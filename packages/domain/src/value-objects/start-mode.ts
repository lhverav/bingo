/**
 * Modo de inicio de la ronda
 */
export type StartMode = 'manual' | 'automatico';

export const START_MODE_LABELS: Record<StartMode, string> = {
  manual: 'Manual',
  automatico: 'Automatico',
};

export const ALL_START_MODES: StartMode[] = ['manual', 'automatico'];
