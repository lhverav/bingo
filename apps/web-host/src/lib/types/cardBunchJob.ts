import { CardType } from '@bingo/domain';

export type JobStatus = 'running' | 'completed' | 'cancelled' | 'failed';

export interface CardBunchJobProgress {
  jobId: string;
  status: JobStatus;
  current: number;
  total: number;
  startTime: number;
  endTime?: number;
  error?: string;
}

export interface CreateCardBunchJobInput {
  name: string;
  cardType: CardType;
  count: number;
}
