import { NextRequest, NextResponse } from "next/server";
import { CandidateScoringHandler } from "../services/CandidateScoring.handler";

export async function POST(req: NextRequest) {
  try {
    const params = await req.json();

    const jobId = params.jobId || undefined;
    const candidates = params.candidates || undefined;
    if (!jobId || !candidates) {
      return NextResponse.json("Missing required information", { status: 400 });
    }

    const results = await CandidateScoringHandler.getJobResponse(
      jobId,
      candidates
    );
    if (results.length === 0) {
      return NextResponse.json("Job is still processing", { status: 202 });
    }

    return NextResponse.json({ data: results });
  } catch (err) {
    return NextResponse.json(
      { message: (err as Error).message },
      { status: 500 }
    );
  }
}
