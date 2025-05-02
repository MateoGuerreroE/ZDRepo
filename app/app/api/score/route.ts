import { NextRequest } from "next/server";
import { CandidateScoringService } from "../services/CandidateScoring.service";
import { DataProcessingService } from "../services/DataProcessingService";
import { DataSourceEnum } from "../types";
import { DataSourceConnector } from "../utils/DataSourceConnector";

export async function POST(request: NextRequest) {
  try {
    const { jobDescription } = await request.json();

    if (!jobDescription || jobDescription.length > 200) {
      throw new Error("Invalid job description");
    }

    const dataSource = DataSourceConnector.getDataSource(
      DataSourceEnum.POSTGRES
    );
    const processor = new DataProcessingService(dataSource);
    const scoringService = new CandidateScoringService();

    const candidates = await processor.processCandidates();
    const result = await scoringService.scoreCandidates(
      jobDescription,
      candidates
    );

    return new Response(JSON.stringify({ data: result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = (e as Error).message || "Internal error";
    return new Response(JSON.stringify({ data: message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}
