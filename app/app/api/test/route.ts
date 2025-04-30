import { DataSourceEnum } from "../types";
import { DataSourceConnector } from "../utils/DataSourceConnector";

export async function GET() {
  const dataSource = DataSourceConnector.getDataSource(DataSourceEnum.POSTGRES);
  const data = await dataSource.getCandidates(true);

  return Response.json({ data });
}
