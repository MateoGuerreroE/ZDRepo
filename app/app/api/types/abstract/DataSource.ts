import { redisInstance } from "../../data/redis";
import { logger } from "../../utils/Logger";
import { NormalizedCandidateData } from "../sheets";

/**
 * getData shout return a list of objects, defined by the type param.
 * It can be a record, a class, or any other type.
 * The type param is used to define the shape of the data returned by the getData method.
 */
export abstract class DataSource<
  T extends NormalizedCandidateData = NormalizedCandidateData
> {
  private readonly redisKey = "candidates:cache";
  private readonly candidateTTL = 60 * 60 * 24; // 1 day

  /**
   * Do not use this method directly If you want to leverage caching.
   * Use getDataWithCache instead.
   */
  abstract getData(): Promise<T[]>;

  async getDataWithCache(opts?: { debug?: boolean }): Promise<T[]> {
    const loggingEnabled = opts?.debug ?? false;
    const redis = await redisInstance.getRedis(!loggingEnabled);
    if (redis) {
      if (loggingEnabled) {
        logger.info("Redis is available, checking cache...");
      }
      const cachedData = await redis.get(this.redisKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
    }
    if (loggingEnabled) {
      logger.info(
        "Redis cache is empty or Redis is not available. Fetching data..."
      );
    }
    const results = await this.getData();
    if (redis) {
      logger.info("Caching data in Redis...");
      await redis.set(
        this.redisKey,
        JSON.stringify(results),
        "EX",
        this.candidateTTL
      );
    }

    return results;
  }
}
