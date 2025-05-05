import { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { candidatesTable, NeonDataClient, scoreTable } from "../data";
import { Candidate } from "../types";
import { RawScoring } from "../types/scoring";
import { eq } from "drizzle-orm";

export class NeonDataSource {
  private readonly connection: NeonHttpDatabase;

  constructor() {
    const client = new NeonDataClient();
    this.connection = client.db;
  }

  async getCandidates(): Promise<Candidate[]> {
    return this.connection.select().from(candidatesTable);
  }

  async saveResult(
    jobId: string,
    candidates: Candidate[],
    scores: RawScoring[]
  ): Promise<void> {
    await this.connection.insert(scoreTable).values({
      jobId,
      candidates,
      scores,
    });
  }

  async getScores(jobId: string) {
    const result = await this.connection
      .select()
      .from(scoreTable)
      .where(eq(scoreTable.jobId, jobId));

    if (result.length === 0) {
      return null;
    }
    return result[0];
  }

  async saveCandidates(candidates: Candidate[]): Promise<void> {
    await this.connection.insert(candidatesTable).values(candidates);
  }
}
