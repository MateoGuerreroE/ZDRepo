import { DataClient } from "../data";
import { redisInstance } from "../data/redis";
import { scoreTable } from "../data/schema";
import { Candidate } from "../types";
import { IScoreResult, ScoringInfo } from "../types/scoring";
import { getNextBatch, hashJobDescription } from "../utils/DomainUtils";
import { logger } from "../utils/Logger";
import { ConfigService } from "./Config.service";
import { DomainDataProcessor } from "./DomainDataProcessor";
import { inArray, and, eq } from "drizzle-orm";

export class CandidateScoringService {
  private readonly configService: ConfigService;
  private readonly dataClient: DataClient;

  constructor() {
    this.configService = new ConfigService();
    this.dataClient = new DataClient(this.configService);
  }

  async scoreCandidates(
    jobDescription: string,
    candidates: Candidate[]
  ): Promise<IScoreResult[]> {
    const jdHash = hashJobDescription(jobDescription);

    const cachedCandidateIds: string[] = [];
    const result: ScoringInfo[] = [];

    const redis = await redisInstance.getRedis();

    if (redis) {
      // Check cached candidates
      for (const candidate of candidates) {
        const candidateCache = await redis.get(
          `${jdHash}:${candidate.candidateId}`
        );
        if (candidateCache) {
          const score = JSON.parse(candidateCache) as ScoringInfo;
          result.push(score);
          cachedCandidateIds.push(candidate.candidateId);
          continue;
        }
      }
    }
    // Do not DB search those cached results
    const uncached = candidates.filter(
      (c) => !cachedCandidateIds.includes(c.candidateId)
    );
    const candidateIds = uncached.map((c) => c.candidateId);
    const storedScores = await this.matchScores(jdHash, candidateIds);

    for (const storedScore of storedScores) {
      cachedCandidateIds.push(storedScore.candidateId);
      result.push(storedScore);
    }

    logger.debug(
      `Found ${cachedCandidateIds.length} results stored or cached.`
    );

    const unprocessedCandidates = candidates.filter(
      (c) => !cachedCandidateIds.includes(c.candidateId)
    );

    // DO a DB search.

    while (unprocessedCandidates.length) {
      const nextBatch = getNextBatch(unprocessedCandidates, 10);

      const data = {
        job: "",
        jobDescription,
        candidates: nextBatch,
      };

      const api = await fetch("http://localhost:8000/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const { result: apiResult } = await api.json();

      const { candidates: candidateScores } = apiResult;

      const scores = DomainDataProcessor.getScoringInfo(
        jdHash,
        candidateScores
      );

      // TODO Possible issue: Stored uncached candidates do not get set to cache
      if (redis) {
        for (const score of scores) {
          const cacheKey = `${jdHash}:${score.candidateId}`;
          redis.set(cacheKey, JSON.stringify(score));
        }
      }
      result.push(...scores);
    }

    try {
      await this.saveResults(jdHash, result);
    } catch {
      logger.debug("Unable to store on database");
    }
    const topCandidates = DomainDataProcessor.getTopCandidates(result);

    return this.mapCandidate(candidates, topCandidates);
  }

  // TODO This should be in a data source service -> Refactor
  private async matchScores(
    jdHash: string,
    candidateIds: string[]
  ): Promise<ScoringInfo[]> {
    const result = await this.dataClient.db
      .select()
      .from(scoreTable)
      .where(
        and(
          inArray(scoreTable.candidateId, candidateIds),
          eq(scoreTable.jobHash, jdHash)
        )
      );
    return result;
  }

  private async saveResults(
    jdHash: string,
    results: ScoringInfo[]
  ): Promise<void> {
    const allJdScores = await this.dataClient.db
      .select()
      .from(scoreTable)
      .where(eq(scoreTable.jobHash, jdHash));

    const existentIds = allJdScores.map((s) => s.candidateId);
    const resultsToSave = results.filter(
      (c) => !existentIds.includes(c.candidateId)
    );

    if (!resultsToSave.length) return;
    await this.dataClient.db.insert(scoreTable).values(resultsToSave);
  }

  private mapCandidate(
    candidates: Candidate[],
    scores: ScoringInfo[]
  ): IScoreResult[] {
    return scores.map((score) => ({
      ...score,
      candidate: candidates.find(
        (candidate) => candidate.candidateId === score.candidateId
      )!,
    }));
  }
}
