import Redis from "ioredis";
import { logger } from "../utils/Logger";
import "dotenv/config";

/**
 * Having redis will enable caching, but won't stop the app from working if redis is not available.
 */
// This is local caching only, you must have an instance of redis running locally for this to work.
class RedisClient {
  private instance: Redis | null = null;
  private alreadyAttemptedConnection: boolean = false;

  async getRedis(silent: boolean = false): Promise<Redis | null> {
    if (this.alreadyAttemptedConnection) {
      if (!this.instance || this.instance.status !== "ready") return null;
      return this.instance;
    }

    try {
      const redisClient = new Redis({
        retryStrategy: () => {
          return null;
        },
      });

      redisClient.on("end", () => {
        if (!silent) {
          logger.warn("Caching capabilities disabled");
        }
        this.instance = null;
      });

      redisClient.on("error", () => {
        if (!silent) {
          logger.warn("Redis failed to connect.");
        }
      });

      await new Promise<void>((resolve) => {
        redisClient.once("ready", resolve);
        redisClient.once("error", resolve);
      });

      this.instance = redisClient;
      this.alreadyAttemptedConnection = true;

      return this.instance.status === "ready" ? this.instance : null;
    } catch {
      this.instance = null;
      return null;
    }
  }
}

export const redisInstance = new RedisClient();
