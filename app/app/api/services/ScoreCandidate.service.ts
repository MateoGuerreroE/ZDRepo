import { RedisClient } from "../data";
import { Candidate } from "../types";
import { AppException } from "../types/exceptions";
import { IScoreResult, RawScoring } from "../types/scoring";
import { getNextBatch, hashString, splitInBatches } from "../utils/DomainUtils";
import { logger } from "../utils/Logger";
import { configService } from "./Config.service";
import { DomainDataProcessor } from "./DomainDataProcessor";

export class ScoreCandidateService {
  private llmUrl: string = configService.getLLMServiceUrl();
  constructor(private readonly redisClient: RedisClient) {}

  async scoreCandidates(
    jobDescription: string,
    candidates: Candidate[]
  ): Promise<IScoreResult[] | string> {
    let scoreData: RawScoring[] | string;

    if (this.redisClient.hasClient) {
      return this.jobProcessing(jobDescription, candidates);
    } else {
      scoreData = await this.rawProcessing(jobDescription, candidates);
      return DomainDataProcessor.processScores(candidates, scoreData);
    }
  }

  /** This processing awaits for whole response, may keep waiting endpoint result for a while.
   * Will be called when no Redis client is available.
   */
  private async rawProcessing(
    jd: string,
    candidates: Candidate[]
  ): Promise<RawScoring[]> {
    const candidateScores: RawScoring[] = [];
    logger.info(
      `Processing ${candidates.length} candidates in raw mode. Note this may take a while and timeout`
    );

    while (candidates.length > 0) {
      const batch = getNextBatch(candidates, 10); // Process in batches of 10

      const request = await fetch(this.llmUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          job: "",
          jobDescription: jd,
          candidates: batch,
        }),
      });

      const { result: requestResult } = await request.json();
      candidateScores.push(...requestResult.candidates);
    }
    return candidateScores;
  }

  private async jobProcessing(
    jd: string,
    candidates: Candidate[]
  ): Promise<string> {
    const hashJd = hashString(jd);
    const jobExists = await this.redisClient.get(`${hashJd}:status`);
    if (jobExists && jobExists !== "done") {
      throw new AppException("Job already exists and is still processing");
    }
    const jobId = jobExists ? hashJd : await this.redisClient.createJob(jd);
    const batches = splitInBatches(candidates, 10);

    await this.redisClient.setJobStatus(jobId, "processing");
    await this.redisClient.setTotalBatches(jobId, batches.length);
    await this.redisClient.setFinishedBatches(jobId, 0);

    for (const batch of batches) {
      this.processBatchAsync(jd, batch, jobId);
    }

    return jobId;
  }

  private async processBatchAsync(
    jd: string,
    batch: Candidate[],
    jobId: string
  ) {
    try {
      const response = await fetch(this.llmUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job: "",
          jobDescription: jd,
          candidates: batch,
        }),
      });

      const { result } = await response.json();

      if (!result || !Array.isArray(result.candidates)) {
        throw new Error("Invalid response format from LLM service");
      }

      await this.redisClient.appendJobResults(jobId, result.candidates);

      const finished = await this.redisClient.incrementFinishedBatches(jobId);
      const total = await this.redisClient.get(`${jobId}:total`);

      if (finished >= Number(total)) {
        await this.redisClient.setJobStatus(jobId, "done");
      }
    } catch (err) {
      logger.error(`Batch processing error ${err}`);
      await this.redisClient.setJobStatus(jobId, "failed");
    }
  }

  async getJobResults(jobId: string): Promise<RawScoring[]> {
    const jobStatus = await this.redisClient.get(`${jobId}:status`);

    if (!jobStatus) {
      throw new AppException("Job not found");
    }
    if (jobStatus !== "done") {
      throw new AppException("Processing");
    }

    const candidates = await this.redisClient.getJobData(jobId);
    return candidates.map((c) => JSON.parse(c)) as RawScoring[];
  }
}
