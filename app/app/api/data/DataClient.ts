import { drizzle, NeonHttpDatabase } from "drizzle-orm/neon-http";
import { ConfigService } from "../services/Config.service";

export class DataClient {
  readonly client: NeonHttpDatabase;
  constructor(readonly configService: ConfigService) {
    const dataSource = configService.getDataSource();
    this.client = drizzle(dataSource);
  }

  get db() {
    return this.client;
  }
}
