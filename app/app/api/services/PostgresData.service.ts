import { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { DataClient } from "../data";
import { DataSource } from "../types/abstract";
import { ConfigService } from "./Config.service";
import { NormalizedSourceData } from "../types/dataSource";
import { candidatesTable } from "../data/schema";
import { GoogleSpreadSheetService } from "./GoogleSpreadSheet.service";
import { nanoid } from "nanoid";

export class PostgresDataService extends DataSource {
  private readonly connection: NeonHttpDatabase;
  constructor(readonly configService: ConfigService) {
    super();
    const dataClient = new DataClient(configService);
    this.connection = dataClient.db;
  }

  async getData(): Promise<NormalizedSourceData[]> {
    const results = await this.connection.select().from(candidatesTable);
    if (results.length === 0) {
      await this.loadFromSheet();
      return this.connection.select().from(candidatesTable);
    }
    return results;
  }

  private async loadFromSheet(): Promise<void> {
    const sheetService = new GoogleSpreadSheetService(this.configService);
    const data = await sheetService.getData();
    const candidates: NormalizedSourceData[] = data.map((candidate) => ({
      candidateId: nanoid(),
      ...candidate,
    }));
    await this.connection.insert(candidatesTable).values(candidates);
  }
}
