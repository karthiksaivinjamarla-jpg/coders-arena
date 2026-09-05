export type SubmissionJob = {
  submissionId: string;
  contestId: string;
  problemId: string;
  languageId: string;
};

export interface SubmissionQueue {
  enqueue(job: SubmissionJob): Promise<void>;
  consume(handler: (job: SubmissionJob) => Promise<void>): Promise<void>;
}

/**
 * Small Redis REST adapter. It intentionally uses RPOP polling instead of a
 * blocking Redis connection so the worker can run on simple container hosts.
 * For production, use a managed Redis/Upstash instance and keep the token
 * server-side only.
 */
export class RedisRestQueue implements SubmissionQueue {
  constructor(
    private readonly url: string,
    private readonly token: string,
    private readonly queueName: string,
    private readonly pollMs = 1000,
  ) {}

  private async command(command: string[]) {
    const response = await fetch(this.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
    });

    if (!response.ok) {
      throw new Error(`Redis request failed: ${response.status}`);
    }

    const body = (await response.json()) as { result?: unknown; error?: string };
    if (body.error) throw new Error(`Redis error: ${body.error}`);
    return body.result;
  }

  async enqueue(job: SubmissionJob) {
    await this.command(["LPUSH", this.queueName, JSON.stringify(job)]);
  }

  async consume(handler: (job: SubmissionJob) => Promise<void>) {
    for (;;) {
      const value = await this.command(["RPOP", this.queueName]);
      if (!value) {
        await new Promise((resolve) => setTimeout(resolve, this.pollMs));
        continue;
      }

      let job: SubmissionJob;
      try {
        job = JSON.parse(String(value)) as SubmissionJob;
      } catch {
        console.error("[judge] discarded malformed queue item");
        continue;
      }

      try {
        await handler(job);
      } catch (error) {
        console.error(`[judge] job ${job.submissionId} failed`, error);
      }
    }
  }
}

export function createQueue(): SubmissionQueue {
  const url = process.env.REDIS_REST_URL;
  const token = process.env.REDIS_REST_TOKEN;
  const queueName = process.env.JUDGE_QUEUE_NAME ?? "coders-arena-submissions";

  if (!url || !token) {
    throw new Error("REDIS_REST_URL and REDIS_REST_TOKEN are required for the judge worker");
  }

  return new RedisRestQueue(url, token, queueName);
}
