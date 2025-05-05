import dotenv from "dotenv";
import { ConfigService } from "./Config.service";
import { AppException } from "../types/exceptions";
import { logger } from "../utils/Logger";

jest.mock("dotenv");
jest.mock("../utils/Logger");

describe("ConfigService", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it("should load env variables in non-production", () => {
    const env = { ...process.env, NODE_ENV: "development" };
    process.env = env as NodeJS.ProcessEnv;

    new ConfigService();
    expect(dotenv.config).toHaveBeenCalled();
  });

  it("should not load env variables in production", () => {
    const env = { ...process.env, NODE_ENV: "production" };
    process.env = env as NodeJS.ProcessEnv;

    new ConfigService();

    expect(dotenv.config).not.toHaveBeenCalled();
  });

  it("should return spreadsheet ID", () => {
    process.env.SPREADSHEET_ID = "abc123";

    const config = new ConfigService();
    expect(config.getSpreadsheetId()).toBe("abc123");
  });

  it("should throw if SPREADSHEET_ID is missing", () => {
    delete process.env.SPREADSHEET_ID;

    const config = new ConfigService();
    expect(() => config.getSpreadsheetId()).toThrow(
      "SPREADSHEET_ID is not defined in the environment variables."
    );
  });

  it("should return data source", () => {
    process.env.DATA_SOURCE = "db";

    const config = new ConfigService();
    expect(config.getDataSource()).toBe("db");
  });

  it("should throw if DATA_SOURCE is missing", () => {
    delete process.env.DATA_SOURCE;

    const config = new ConfigService();
    expect(() => config.getDataSource()).toThrow(
      "DATA_SOURCE is not defined in the environment variables."
    );
  });

  it("should return Google credentials", () => {
    process.env.GOOGLE_CLIENT_EMAIL = "email@test.com";
    process.env.GOOGLE_PRIVATE_KEY = "line1\\nline2";
    process.env.GOOGLE_PROJECT_ID = "test-project";
    process.env.GOOGLE_CLIENT_ID = "client-id";

    const config = new ConfigService();
    const creds = config.getGoogleCredentials();

    expect(creds).toEqual({
      client_email: "email@test.com",
      private_key: "line1\nline2",
      project_id: "test-project",
      client_id: "client-id",
    });
  });

  it("should return LLM service URL if defined", () => {
    process.env.LLM_SERVICE_URL = "http://my-service";

    const config = new ConfigService();
    expect(config.getLLMServiceUrl()).toBe("http://my-service");
  });

  it("should return default LLM URL and log warning if not defined", () => {
    delete process.env.LLM_SERVICE_URL;

    const config = new ConfigService();
    const url = config.getLLMServiceUrl();

    expect(logger.warn).toHaveBeenCalledWith(
      "No LLM_SERVICE_URL defined. Using default: http://localhost:8000"
    );
    expect(url).toBe("http://localhost:8000");
  });

  it("should return Redis credentials in dev", () => {
    const env = { ...process.env, NODE_ENV: "development" };
    process.env = env as NodeJS.ProcessEnv;
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_PORT;

    const config = new ConfigService();
    expect(config.getRedisCredentials()).toEqual({
      host: "localhost",
      port: 6379,
    });
  });

  it("should throw in production if Redis env vars are missing", () => {
    const env = { ...process.env, NODE_ENV: "production" };
    process.env = env as NodeJS.ProcessEnv;
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_PORT;

    const config = new ConfigService();
    expect(() => config.getRedisCredentials()).toThrow(AppException);
    expect(logger.error).toHaveBeenCalledWith("No Redis env vars found");
  });

  it("should parse port number from string", () => {
    process.env.REDIS_PORT = "6380";

    const config = new ConfigService();
    expect(config.getRedisCredentials().port).toBe(6380);
  });
});
