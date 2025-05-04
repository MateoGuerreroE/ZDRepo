import { parse } from "csv-parse/sync";
import { CsvDataProcessor } from "./CsvDataProcessor";
import { NeonDataSource } from "./NeonDataSource";
import { RedisClient } from "../data";
import { Candidate } from "../types";
import { ScoreCandidateService } from "./ScoreCandidate.service";
import { IScoreResult, RawScoring } from "../types/scoring";
import { AppException } from "../types/exceptions";
import { DomainDataProcessor } from "./DomainDataProcessor";
import { hashString } from "../utils";

export class CandidateScoringHandler {
  private static redisClient = new RedisClient();

  static async handleRequest(
    jobDescription: string,
    fileContent?: string
  ): Promise<IScoreResult[] | { jobId: string; candidates: Candidate[] }> {
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

    if (this.redisClient.hasClient) {
      const jobId = hashString(jobDescription);
      const cachedScores = await this.redisClient.getJobData(jobId);

      if (cachedScores) {
        const parsedCachedScores = cachedScores.map((cs) =>
          JSON.parse(cs)
        ) as RawScoring[];
        const candidateIdsScores = parsedCachedScores.map(
          (cs) => cs.candidateId
        );
        const leftCandidates = candidateData.filter(
          (c) => !candidateIdsScores.includes(c.candidateId)
        );

        // If no candidates out of the cache, return the cached scores
        if (leftCandidates.length === 0) {
          return DomainDataProcessor.processScores(
            candidateData,
            parsedCachedScores
          );
        }

        candidateData = leftCandidates;
      }
    }

    const scoringService = new ScoreCandidateService(this.redisClient);
    const result = await scoringService.scoreCandidates(
      jobDescription,
      candidateData
    );

    return typeof result === "string"
      ? { jobId: result, candidates: candidateData }
      : result;
  }

  static async getJobResponse(
    jobId: string,
    candidates: Candidate[]
  ): Promise<IScoreResult[]> {
    try {
      await this.redisClient.init();
      console.log(jobId);
      const scoringService = new ScoreCandidateService(this.redisClient);

      const jobResults = await scoringService.getJobResults(jobId);

      return DomainDataProcessor.processScores(candidates, jobResults);
    } catch (e) {
      if (e instanceof AppException) {
        if (e.message === "Processing") return [];
      }
      throw e;
    }
  }
}
