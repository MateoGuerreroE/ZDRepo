import { parse } from "csv-parse/sync";
import { CsvDataProcessor } from "./CsvDataProcessor";
import { NeonDataSource } from "./NeonDataSource";
import { RedisClient } from "../data";
import { Candidate } from "../types";
import { ScoreCandidateService } from "./ScoreCandidate.service";
import { IScoreResult } from "../types/scoring";

export class CandidateScoringHandler {
  private static redisClient = new RedisClient();

  static async handleRequest(
    jobDescription: string,
    fileContent?: string
  ): Promise<IScoreResult[] | string> {
    await this.redisClient.init();
    let candidateData: Candidate[];

    if (fileContent) {
      const records: string[][] = parse(fileContent, {
        skip_empty_lines: true,
        relax_quotes: true,
      });

      candidateData = CsvDataProcessor.processData(records);
    } else {
      const dataSource = new NeonDataSource();
      candidateData = await dataSource.getCandidates();
    }

    const scoringService = new ScoreCandidateService(this.redisClient);
    const result = await scoringService.scoreCandidates(
      jobDescription,
      candidateData
    );

    return result;
  }
}
