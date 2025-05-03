import { drizzle, NeonHttpDatabase } from "drizzle-orm/neon-http";
import { configService } from "../services/Config.service";

export class NeonDataClient {
  readonly client: NeonHttpDatabase;
  constructor() {
    const dataSource = configService.getDataSource();
    this.client = drizzle(dataSource);
  }

  get db() {
    return this.client;
  }
}
