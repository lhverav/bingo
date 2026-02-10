import { randomUUID } from "crypto";
import {
  CardBunchJobProgress,
  CreateCardBunchJobInput,
  JobStatus,
} from "@/lib/types/cardBunchJob";

// Use globalThis to persist jobs across hot reloads and module instances in Next.js
const globalJobs = globalThis as typeof globalThis & {
  __cardBunchJobs?: Map<string, CardBunchJobProgress>;
};

if (!globalJobs.__cardBunchJobs) {
  globalJobs.__cardBunchJobs = new Map();
}

class CardBunchJobService {
  private get jobs(): Map<string, CardBunchJobProgress> {
    return globalJobs.__cardBunchJobs!;
  }

  createJob(input: CreateCardBunchJobInput): string {
    const jobId = randomUUID();
    const job: CardBunchJobProgress = {
      jobId,
      status: "running",
      current: 0,
      total: input.count,
      startTime: Date.now(),
    };
    this.jobs.set(jobId, job);
    console.log("[DEBUG 6b] Job stored in Map. Map size:", this.jobs.size, "Keys:", Array.from(this.jobs.keys()));
    return jobId;
  }

  getProgress(jobId: string): CardBunchJobProgress | null {
    console.log("[DEBUG 8b] getProgress called. Map size:", this.jobs.size, "Looking for:", jobId);
    console.log("[DEBUG 8c] Map keys:", Array.from(this.jobs.keys()));
    return this.jobs.get(jobId) || null;
  }

  updateProgress(jobId: string, current: number): void {
    const job = this.jobs.get(jobId);
    if (job && job.status === "running") {
      job.current = current;
    }
  }

  setStatus(jobId: string, status: JobStatus, error?: string): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = status;
      job.endTime = Date.now();
      if (error) {
        job.error = error;
      }
    }
  }

  shouldCancel(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    return job?.status === "cancelled";
  }

  cancelJob(jobId: string): void {
    this.setStatus(jobId, "cancelled");
  }

  completeJob(jobId: string): void {
    this.setStatus(jobId, "completed");
  }

  failJob(jobId: string, error: string): void {
    this.setStatus(jobId, "failed", error);
  }

  // Cleanup old jobs (optional, can be called periodically)
  cleanupOldJobs(maxAgeMs: number = 3600000): void {
    const now = Date.now();
    for (const [jobId, job] of this.jobs.entries()) {
      if (job.endTime && now - job.endTime > maxAgeMs) {
        this.jobs.delete(jobId);
      }
    }
  }
}

// Singleton instance
export const cardBunchJobService = new CardBunchJobService();
