import { configService } from "../services/Config.service";
import { GoogleSpreadSheetService } from "../services/GoogleSpreadSheet.service";
import { PostgresDataService } from "../services/PostgresData.service";
import { DataSourceEnum } from "../types";
import { DataSource } from "../types/abstract";

export class DataSourceConnector {
  static getDataSource(dataSource: DataSourceEnum): DataSource {
    switch (dataSource) {
      case DataSourceEnum.SPREADSHEET:
        return new GoogleSpreadSheetService(configService);
      case DataSourceEnum.POSTGRES:
        return new PostgresDataService(configService);
      default:
        throw new Error(`Unsupported data source: ${dataSource}`);
    }
  }
}
