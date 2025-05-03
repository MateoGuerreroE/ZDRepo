import { NextRequest, NextResponse } from "next/server";
import { CandidateScoringHandler } from "../services/CandidateScoring.handler";
import { logger } from "../utils";
import { AppException } from "../types/exceptions";

export async function POST(req: NextRequest) {
  let jobDescription: string;
  let fileContent: string | undefined = undefined;

  try {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      jobDescription = formData.get("jobDescription") as string;
      const file = formData.get("file") as File;

      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        fileContent = buffer.toString("utf-8");
      }
    } else {
      const body = await req.json();
      jobDescription = body.jobDescription;
    }

    if (!jobDescription || jobDescription.length > 200) {
      return NextResponse.json(
        { message: "Invalid job description" },
        { status: 400 }
      );
    }

    const result = await CandidateScoringHandler.handleRequest(
      jobDescription,
      fileContent
    );
    return NextResponse.json({ data: result });
  } catch (err) {
    logger.error((err as Error).message);
    return NextResponse.json(
      { message: (err as Error).message },
      { status: err instanceof AppException ? 400 : 500 }
    );
  }
}
