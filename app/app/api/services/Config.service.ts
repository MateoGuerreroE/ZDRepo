import dotenv from "dotenv";
import { logger } from "../utils/Logger";
import { RedisCredentials } from "../types/app";
import { AppException } from "../types/exceptions";

export type GoogleCredentials = {
  client_email: string;
  private_key: string;
  project_id: string;
  client_id: string;
};
/**
 * Meant for secret management
 */
export class ConfigService {
  constructor() {
    // For dev env use .env.local file. Otherwise secrets would be loaded using doppler
    if (process.env.NODE_ENV !== "production") {
      this.loadEnvVariables();
    }
  }

  private loadEnvVariables() {
    dotenv.config();
  }

  getSpreadsheetId(): string {
    const spreadsheetId = process.env.SPREADSHEET_ID;
    if (!spreadsheetId) {
      throw new Error(
        "SPREADSHEET_ID is not defined in the environment variables."
      );
    }
    return spreadsheetId;
  }

  getDataSource(): string {
    const dataSource = process.env.DATA_SOURCE;
    if (!dataSource) {
      throw new Error(
        "DATA_SOURCE is not defined in the environment variables."
      );
    }
    return dataSource;
  }

  getGoogleCredentials(): GoogleCredentials {
    return {
      client_email: process.env.GOOGLE_CLIENT_EMAIL || "",
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n") || "",
      project_id: process.env.GOOGLE_PROJECT_ID || "",
      client_id: process.env.GOOGLE_CLIENT_ID || "",
    };
  }

  getLLMServiceUrl(): string {
    const llmServiceUrl = process.env.LLM_SERVICE_URL;
    if (!llmServiceUrl) {
      logger.warn(
        "No LLM_SERVICE_URL defined. Using default: http://localhost:8000"
      );
      return "http://localhost:8000";
    }
    return llmServiceUrl;
  }

  getRedisCredentials(): RedisCredentials {
    const host = process.env.REDIS_HOST;
    const port = process.env.REDIS_PORT
      ? parseInt(process.env.REDIS_PORT)
      : 6379;

    const isProduction = process.env.NODE_ENV === "production";

    if (isProduction && (!host || !port)) {
      logger.error("No Redis env vars found");
      throw new AppException("No Redis variables found");
    }

    return {
      host: host || "localhost",
      port,
    };
  }
}

export const configService = new ConfigService();
