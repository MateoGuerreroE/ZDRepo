import { DataProcessingService } from "../services/DataProcessingService";
import { DataSourceEnum } from "../types";
import { DataSourceConnector } from "../utils/DataSourceConnector";

export async function GET() {
  const dataSource = DataSourceConnector.getDataSource(DataSourceEnum.POSTGRES);
  const processor = new DataProcessingService(dataSource);
  const data = await processor.processData();

  console.log(data.length);

  return Response.json({ data });
}
