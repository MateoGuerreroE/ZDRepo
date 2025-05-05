import { POST } from "./route";
import { CandidateScoringHandler } from "../services/CandidateScoring.handler";
import { NextRequest, NextResponse } from "next/server";

jest.mock("../services/CandidateScoring.handler");

describe("POST handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (NextResponse.json as jest.Mock) = jest.fn();
  });

  const createMockRequest = (body: unknown): NextRequest =>
    ({
      json: jest.fn().mockResolvedValue(body),
    } as unknown as NextRequest);

  it("should return 400 if jobId or candidates are missing", async () => {
    const req = createMockRequest({ jobId: "123" }); // no candidates
    await POST(req);
    expect(NextResponse.json).toHaveBeenCalledWith(
      "Missing required information",
      { status: 400 }
    );
  });

  it("should return 202 if job is still processing", async () => {
    (CandidateScoringHandler.getJobResponse as jest.Mock).mockResolvedValue([]);

    const req = createMockRequest({
      jobId: "job-xyz",
      candidates: [{ candidateId: "1" }],
    });

    await POST(req);

    expect(CandidateScoringHandler.getJobResponse).toHaveBeenCalledWith(
      "job-xyz",
      [{ candidateId: "1" }]
    );
    expect(NextResponse.json).toHaveBeenCalledWith("Job is still processing", {
      status: 202,
    });
  });

  it("should return results with 200 when job is complete", async () => {
    const fakeResults = [{ candidateId: "1", score: 95 }];
    (CandidateScoringHandler.getJobResponse as jest.Mock).mockResolvedValue(
      fakeResults
    );

    const req = createMockRequest({
      jobId: "job-abc",
      candidates: [{ candidateId: "1" }],
    });

    await POST(req);

    expect(NextResponse.json).toHaveBeenCalledWith({ data: fakeResults });
  });

  it("should return 500 on unexpected error", async () => {
    const req = createMockRequest({});
    (req.json as jest.Mock).mockRejectedValue(new Error("JSON parse failed"));

    await POST(req);

    expect(NextResponse.json).toHaveBeenCalledWith(
      { message: "JSON parse failed" },
      { status: 500 }
    );
  });
});
