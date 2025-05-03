import { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { candidatesTable, NeonDataClient } from "../data";
import { Candidate } from "../types";

export class NeonDataSource {
  private readonly connection: NeonHttpDatabase;

  constructor() {
    const client = new NeonDataClient();
    this.connection = client.db;
  }

  async getCandidates(): Promise<Candidate[]> {
    return this.connection.select().from(candidatesTable);
  }
}
