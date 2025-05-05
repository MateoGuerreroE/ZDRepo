import { describe } from "node:test";
import {
  calculateTimePeriod,
  cleanDate,
  extractDate,
  extractTitleAndInstitution,
  normalizeHeaders,
} from "./CsvUtils";
import { logger } from "./Logger";
import * as crypto from "crypto";
import {
  getNextBatch,
  hashString,
  safeFetch,
  splitInBatches,
} from "./DomainUtils";
import { AppException } from "../types/exceptions";

describe("logger", () => {
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;
  const originalDebug = console.debug;

  beforeEach(() => {
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
    console.debug = jest.fn();
  });

  afterEach(() => {
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;
    console.debug = originalDebug;
  });

  it("should log info messages", () => {
    logger.info("Test info");
    expect(console.log).toHaveBeenCalledWith("[INFO]: Test info");
  });

  it("should log warning messages", () => {
    logger.warn("Test warning");
    expect(console.warn).toHaveBeenCalledWith("[WARN]: Test warning");
  });

  it("should log error messages", () => {
    logger.error("Test error");
    expect(console.error).toHaveBeenCalledWith("[ERROR]: Test error");
  });

  it("should log debug messages", () => {
    logger.debug("Test debug");
    expect(console.debug).toHaveBeenCalledWith("[DEBUG]: Test debug");
  });
});

describe("CsvUtils", () => {
  it("should normalize headers correctly", () => {
    const headers = ["First Name", "Last Name", "Email Address"];
    const normalizedHeaders = normalizeHeaders<unknown>(headers);
    expect(normalizedHeaders).toEqual([
      "firstName",
      "lastName",
      "emailAddress",
    ]);
  });

  it("should extract date correctly", () => {
    const dateString = "Software Engineer (Jan 2020 to Dec 2021)";
    const { startDate, endDate, output } = extractDate(dateString);
    expect(startDate).toEqual("Jan 2020");
    expect(endDate).toEqual("Dec 2021");
    expect(output).toEqual("Software Engineer");
  });

  it("should calculate time period correctly", () => {
    const startDate = "June 2023";
    const endDate = "Dec 2023";
    const { months, totalExperience } = calculateTimePeriod(startDate, endDate);
    expect(months).toEqual(6);
    expect(totalExperience).toEqual("0 years 6 months");
  });

  it("should cleanDate", () => {
    const dateString1 = "N/A";
    const dateString2 = " ";

    const cleanedDate1 = cleanDate(dateString1);
    const cleanedDate2 = cleanDate(dateString2);

    expect(cleanedDate1).toBeNull();
    expect(cleanedDate2).toBeNull();
  });

  it("should extractTitleAndInstitution", () => {
    const input = "Software Engineer at XYZ Corp";
    const { title, institution } = extractTitleAndInstitution(input);
    expect(title).toEqual("Software Engineer");
    expect(institution).toEqual("XYZ Corp");
  });

  it('should extractTitleAndInstitution with starting "at"', () => {
    const input = "at XYZ Corp";
    const { title, institution } = extractTitleAndInstitution(input);
    expect(title).toEqual(null);
    expect(institution).toEqual("XYZ Corp");
  });

  it('should extractTitleAndInstitution with ending "at"', () => {
    const input = "Software Engineer at";
    const { title, institution } = extractTitleAndInstitution(input);
    expect(title).toEqual("Software Engineer");
    expect(institution).toEqual(null);
  });
});

describe("DomainUtils", () => {
  describe("hashString", () => {
    it("should return md5 hash of the input string", () => {
      const result = hashString("test-input");
      const expected = crypto
        .createHash("md5")
        .update("test-input", "utf8")
        .digest("hex");
      expect(result).toBe(expected);
    });
  });

  describe("getNextBatch", () => {
    it("should return first N elements and mutate the array", () => {
      const arr = [1, 2, 3, 4, 5];
      const batch = getNextBatch(arr, 2);
      expect(batch).toEqual([1, 2]);
      expect(arr).toEqual([3, 4, 5]);
    });

    it("should return all elements if batchSize is larger than array", () => {
      const arr = [1, 2];
      const batch = getNextBatch(arr, 5);
      expect(batch).toEqual([1, 2]);
      expect(arr).toEqual([]);
    });

    it("should return empty array if input is empty", () => {
      const arr: number[] = [];
      const batch = getNextBatch(arr, 3);
      expect(batch).toEqual([]);
      expect(arr).toEqual([]);
    });
  });

  describe("splitInBatches", () => {
    it("should split array into multiple batches", () => {
      const arr = [1, 2, 3, 4, 5];
      const batches = splitInBatches(arr, 2);
      expect(batches).toEqual([[1, 2], [3, 4], [5]]);
    });

    it("should return single batch if batchSize >= array length", () => {
      const arr = [1, 2, 3];
      const batches = splitInBatches(arr, 5);
      expect(batches).toEqual([[1, 2, 3]]);
    });

    it("should return empty array if input is empty", () => {
      const arr: number[] = [];
      const batches = splitInBatches(arr, 3);
      expect(batches).toEqual([]);
    });
  });

  describe("safeFetch", () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
      jest.useFakeTimers();
      global.fetch = jest.fn();
    });

    afterEach(() => {
      jest.useRealTimers();
      global.fetch = originalFetch;
    });

    it("should resolve if fetch is fast enough", async () => {
      const mockResponse = new Response(JSON.stringify({ data: "ok" }), {
        status: 200,
      });
      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await safeFetch("http://test.com");
      expect(result.status).toBe(200);
    });

    it("should timeout and throw AppException", async () => {
      (fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // never resolves

      const promise = safeFetch("http://slow.com", {}, 1000);
      jest.advanceTimersByTime(1000);

      await expect(promise).rejects.toThrow(AppException);
    });
  });
});
