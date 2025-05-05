import { POST } from "./route";
import { CandidateScoringHandler } from "../services/CandidateScoring.handler";
import { logger } from "../utils";
import { AppException } from "../types/exceptions";
import { NextRequest, NextResponse } from "next/server";

jest.mock("../services/CandidateScoring.handler");
jest.mock("../utils/logger");

describe("POST handler", () => {
  const mockJson = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (NextResponse.json as jest.Mock) = mockJson;
  });

  it("should process JSON body and call handler correctly", async () => {
    const mockReq = {
      headers: { get: () => "application/json" },
      json: jest.fn().mockResolvedValue({ jobDescription: "A developer role" }),
      nextUrl: {
        searchParams: new URLSearchParams("saveCandidates=true"),
      },
    } as unknown as NextRequest;

    (CandidateScoringHandler.handleRequest as jest.Mock).mockResolvedValue([
      { id: 1 },
    ]);

    await POST(mockReq);
    expect(CandidateScoringHandler.handleRequest).toHaveBeenCalledWith(
      "A developer role",
      undefined,
      true
    );
    expect(mockJson).toHaveBeenCalledWith({ data: [{ id: 1 }] });
  });

  it("should return 400 if jobDescription is too long", async () => {
    const mockReq = {
      headers: { get: () => "application/json" },
      json: jest.fn().mockResolvedValue({ jobDescription: "x".repeat(201) }),
      nextUrl: {
        searchParams: new URLSearchParams(),
      },
    } as unknown as NextRequest;

    await POST(mockReq);
    expect(mockJson).toHaveBeenCalledWith(
      { message: "Invalid job description" },
      { status: 400 }
    );
  });

  it("should handle multipart/form-data and parse file", async () => {
    const fileMock = {
      arrayBuffer: jest.fn().mockResolvedValue(Buffer.from("file content")),
    };

    const formData = new Map<string, string | File>([
      ["jobDescription", "Frontend dev"],
      ["file", fileMock as unknown as File],
    ]);

    const mockReq = {
      headers: { get: () => "multipart/form-data" },
      formData: jest.fn().mockResolvedValue(formData),
      nextUrl: {
        searchParams: new URLSearchParams(),
      },
    } as unknown as NextRequest;

    (CandidateScoringHandler.handleRequest as jest.Mock).mockResolvedValue(
      "parsed result"
    );

    await POST(mockReq);
    expect(fileMock.arrayBuffer).toHaveBeenCalled();
    expect(CandidateScoringHandler.handleRequest).toHaveBeenCalledWith(
      "Frontend dev",
      "file content",
      false
    );
  });

  it("should handle unexpected errors and return 500", async () => {
    const mockReq = {
      headers: { get: () => "application/json" },
      json: jest.fn().mockRejectedValue(new Error("Something went wrong")),
      nextUrl: {
        searchParams: new URLSearchParams(),
      },
    } as unknown as NextRequest;

    await POST(mockReq);
    expect(logger.error).toHaveBeenCalledWith("Something went wrong");
    expect(mockJson).toHaveBeenCalledWith(
      { message: "Something went wrong" },
      { status: 500 }
    );
  });

  it("should return 400 if AppException is thrown", async () => {
    const mockReq = {
      headers: { get: () => "application/json" },
      json: jest.fn().mockRejectedValue(new AppException("Bad Request")),
      nextUrl: {
        searchParams: new URLSearchParams(),
      },
    } as unknown as NextRequest;

    await POST(mockReq);
    expect(mockJson).toHaveBeenCalledWith(
      { message: "Bad Request" },
      { status: 400 }
    );
  });
});
