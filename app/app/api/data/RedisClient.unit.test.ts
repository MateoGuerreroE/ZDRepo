import { RedisClient } from "./RedisClient";
import { mock } from "jest-mock-extended";
import Redis from "ioredis";
import { AppException } from "../types/exceptions";
import { configService } from "../services/Config.service";

jest.mock("ioredis");
jest.mock("../utils/logger");
jest.mock("../services/Config.service");

describe("RedisClient", () => {
  const mockRedis = mock<Redis>();
  new Redis() as unknown as jest.Mocked<Redis>;
  (configService.getRedisCredentials as jest.Mock).mockReturnValue({
    host: "localhost",
    port: 6379,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (Redis as unknown as jest.Mock).mockImplementation(() => mockRedis);
    mockRedis.connect.mockResolvedValue(undefined);
  });

  it("should initialize client and set hasClient to true", async () => {
    const redisClient = new RedisClient();
    await redisClient.init();

    expect(mockRedis.connect).toHaveBeenCalled();
    expect(redisClient["hasClient"]).toBe(true);
    expect(redisClient["client"]).toBeDefined();
  });

  it("should return null on get if client is not ready", async () => {
    const redisClient = new RedisClient();
    const result = await redisClient.get("key");
    expect(result).toBeNull();
  });

  it("should call get when client is ready", async () => {
    const redisClient = new RedisClient();
    redisClient["client"] = mockRedis;
    redisClient["hasClient"] = true;

    mockRedis.get.mockResolvedValue("value");

    const result = await redisClient.get("myKey");
    expect(result).toBe("value");
    expect(mockRedis.get).toHaveBeenCalledWith("myKey");
  });

  it("should call set with ttl", async () => {
    const redisClient = new RedisClient();
    redisClient["client"] = mockRedis;
    redisClient["hasClient"] = true;

    await redisClient.set("key", "value", 30);
    expect(mockRedis.set).toHaveBeenCalledWith("key", "value", "EX", 30);
  });

  it("should call set without ttl", async () => {
    const redisClient = new RedisClient();
    redisClient["client"] = mockRedis;
    redisClient["hasClient"] = true;

    await redisClient.set("key", "value");
    expect(mockRedis.set).toHaveBeenCalledWith("key", "value");
  });

  it("should call del on clear", async () => {
    const redisClient = new RedisClient();
    redisClient["client"] = mockRedis;
    redisClient["hasClient"] = true;

    await redisClient.clear("someKey");
    expect(mockRedis.del).toHaveBeenCalledWith("someKey");
  });

  it("should throw when createJob is called without client", async () => {
    const redisClient = new RedisClient();
    await expect(redisClient.createJob("test")).rejects.toThrow(AppException);
  });

  it("should call flushall and quit when disconnect(true)", async () => {
    const redisClient = new RedisClient();
    redisClient["client"] = mockRedis;
    redisClient["hasClient"] = true;

    await redisClient.disconnect(true);

    expect(mockRedis.flushall).toHaveBeenCalled();
    expect(mockRedis.quit).toHaveBeenCalled();
  });

  it("should only quit if disconnect(false)", async () => {
    const redisClient = new RedisClient();
    redisClient["client"] = mockRedis;
    redisClient["hasClient"] = true;

    await redisClient.disconnect(false);

    expect(mockRedis.flushall).not.toHaveBeenCalled();
    expect(mockRedis.quit).toHaveBeenCalled();
  });
});
