import { configService } from "../services/Config.service";
import Redis from "ioredis";
import { nanoid } from "nanoid";
import { AppException } from "../types/exceptions";
import { logger } from "../utils/Logger";
import { RawScoring } from "../types/scoring";

export class RedisClient {
  private client: Redis | null = null;
  public hasClient: boolean = false;
  private readonly jobTTL: number = 60 * 5; // 5 minutes

  constructor() {}

  async init() {
    const { host, port } = configService.getRedisCredentials();
    const redisUrl = `redis://${host}:${port}`;
    console.log(redisUrl);
    const client = new Redis(redisUrl, {
      retryStrategy: () => null,
      lazyConnect: true,
    });

    try {
      await client.connect();
      this.client = client;
      this.hasClient = true;
    } catch {
      logger.warn("Redis client not available, cache will not be used");
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.hasClient || !this.client) return null;
    return await this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.hasClient || !this.client) return;
    if (ttlSeconds) {
      await this.client.set(key, value, "EX", ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async clear(key: string): Promise<void> {
    if (!this.hasClient || !this.client) return;
    await this.client.del(key);
  }

  async disconnect(clearAll: boolean = false): Promise<void> {
    if (!this.hasClient || !this.client) return;
    if (clearAll) {
      await this.client.flushall();
    }
    await this.client.quit();
  }

  // Job processing system

  async createJob(): Promise<string> {
    const jobKey = nanoid(10);
    if (!this.hasClient || !this.client)
      throw new AppException("Redis client not available");
    await this.client.set(`${jobKey}:status`, "processing", "EX", this.jobTTL);

    return jobKey;
  }

  async addJobData(jobKey: string, jobData: string[]): Promise<void> {
    if (!this.hasClient || !this.client)
      throw new AppException("Redis client not available");

    await this.client.rpush(`${jobKey}:results`, ...jobData);
  }

  async setJobStatus(
    jobKey: string,
    status: "failed" | "done" | "processing"
  ): Promise<void> {
    if (!this.hasClient || !this.client)
      throw new AppException("Redis client not available");
    await this.client.set(`${jobKey}:status`, status);
  }

  async getJobData(jobKey: string): Promise<string[]> {
    if (!this.hasClient || !this.client)
      throw new AppException("Redis client not available");
    const jobData = await this.client.lrange(`${jobKey}:results`, 0, -1);
    return jobData;
  }

  async clearJob(jobKey: string): Promise<void> {
    if (!this.hasClient || !this.client)
      throw new AppException("Redis client not available");
    await this.client.del(jobKey);
  }

  async setTotalBatches(jobKey: string, total: number): Promise<void> {
    if (!this.hasClient || !this.client)
      throw new AppException("Redis client not available");
    await this.client.set(`${jobKey}:total`, total.toString());
  }

  async setFinishedBatches(jobKey: string, finished: number): Promise<void> {
    if (!this.hasClient || !this.client)
      throw new AppException("Redis client not available");
    await this.client.set(`${jobKey}:finished`, finished.toString());
  }

  async appendJobResults(jobId: string, results: RawScoring[]): Promise<void> {
    if (!this.hasClient || !this.client) {
      throw new Error("Redis client not available");
    }

    const key = `${jobId}:results`;

    // Serialize each result to JSON string
    const serialized = results.map((item) => JSON.stringify(item));

    if (serialized.length > 0) {
      await this.client.rpush(key, ...serialized);
    }
  }

  async incrementFinishedBatches(jobId: string): Promise<number> {
    if (!this.hasClient || !this.client) {
      throw new Error("Redis client not available");
    }

    const key = `${jobId}:finished`;

    // Increments the counter and returns the new value
    const newCount = await this.client.incr(key);
    return newCount;
  }
}
