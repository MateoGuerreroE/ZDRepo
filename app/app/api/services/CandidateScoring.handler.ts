import { parse } from "csv-parse/sync";
import { CsvDataProcessor } from "./CsvDataProcessor";
import { NeonDataSource } from "./NeonDataSource";
import { RedisClient } from "../data";
import { Candidate } from "../types";
import { ScoreCandidateService } from "./ScoreCandidate.service";
import { IScoreResult, RawScoring } from "../types/scoring";
import { AppException } from "../types/exceptions";
import { DomainDataProcessor } from "./DomainDataProcessor";
import { hashString, logger } from "../utils";

export class CandidateScoringHandler {
  private static redisClient = new RedisClient();

  static async handleRequest(
    jobDescription: string,
    fileContent?: string,
    saveFromFile: boolean = false
  ): Promise<IScoreResult[] | { jobId: string; candidates: Candidate[] }> {
    await this.redisClient.init();
    let candidateData: Candidate[];
    const dataSource = new NeonDataSource();

    if (fileContent) {
      const records: string[][] = parse(fileContent, {
        skip_empty_lines: true,
        relax_quotes: true,
      });

      candidateData = CsvDataProcessor.processData(records);

      if (saveFromFile) {
        logger.info("Saving candidates to database");
        await dataSource.saveCandidates(candidateData);
      }
    } else {
      candidateData = await dataSource.getCandidates();
    }

    const { candidates: missingCandidates, scores } =
      await this.checkStoredScores(candidateData, jobDescription, dataSource);

    logger.info(
      `Found ${scores.length} candidates stored for this job description`
    );

    const scoringService = new ScoreCandidateService(
      this.redisClient,
      dataSource
    );

    if (missingCandidates.length === 0) {
      return DomainDataProcessor.processScores(candidateData, scores);
    }

    candidateData = missingCandidates;
    logger.info(`Processing ${candidateData.length} candidates`);
    const candidateCopy = [...candidateData];

    const result = await scoringService.scoreCandidates(
      jobDescription,
      candidateData
    );

    return typeof result === "string"
      ? { jobId: result, candidates: candidateCopy }
      : result;
  }

  /** Returns those candidates from the list which are missing to score */
  private static async checkStoredScores(
    candidates: Candidate[],
    jobDescription: string,
    dataSource: NeonDataSource
  ): Promise<{ candidates: Candidate[]; scores: RawScoring[] }> {
    const jobId = hashString(jobDescription);
    const scoredIds: string[] = [];
    const scores: RawScoring[] = [];

    /**
     * This checks candidates scored and saved in either cache (first) or database (second).
     */
    if (this.redisClient.hasClient) {
      const storedResults = await this.redisClient.getJobData(jobId);
      if (storedResults.length) {
        const parsedResults = storedResults.map((string) =>
          JSON.parse(string)
        ) as RawScoring[];

        scoredIds.push(...parsedResults.map((result) => result.candidateId));
        scores.push(...parsedResults);
      }
    }
    // If No scores in cache, check database
    if (scoredIds.length === 0) {
      const savedScores = await dataSource.getScores(jobId);
      if (savedScores) {
        scoredIds.push(
          ...savedScores.scores.map((result) => result.candidateId)
        );
        scores.push(...savedScores.scores);
      }
    }

    const missedCandidates = candidates.filter(
      (candidate) => !scoredIds.includes(candidate.candidateId)
    );

    return {
      candidates: missedCandidates,
      scores,
    };
  }

  static async getJobResponse(
    jobId: string,
    candidates: Candidate[]
  ): Promise<IScoreResult[]> {
    try {
      await this.redisClient.init();
      const jobStatus = await this.redisClient.get(`${jobId}:status`);

      // Finished jobs clean the status key, just keep result on TTL. So this will prevent
      // reprocessing the same job if it was already finished.
      if (!jobStatus) {
        throw new AppException("Job not found");
      }

      if (jobStatus === "failed") {
        await this.redisClient.clearJob(jobId);
        throw new AppException("Job failed");
      }

      if (jobStatus !== "done") {
        throw new AppException("Processing");
      }

      const scoreList = await this.redisClient.getJobData(jobId);

      const scores = scoreList.map((c) => JSON.parse(c)) as RawScoring[];

      const dataSource = new NeonDataSource();
      await dataSource.saveResult(jobId, candidates, scores);
      await this.redisClient.clearJob(jobId);

      return DomainDataProcessor.processScores(candidates, scores);
    } catch (e) {
      if (e instanceof AppException) {
        if (e.message === "Processing") return [];
      }
      throw new AppException((e as Error).message);
    }
  }
}
