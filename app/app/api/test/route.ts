import { ConfigService } from "../services/Config.service";
import { GoogleSpreadSheetService } from "../services/GoogleSpreadSheet.service";
import { SheetDataProcessor } from "../services/SheetDataProcessor.service";

export async function GET() {
  const configService = new ConfigService();
  const googleSpreadSheetService = new GoogleSpreadSheetService(configService);

  const data = await googleSpreadSheetService.getData();
  const processedData = SheetDataProcessor.processData(data);
  return Response.json({ data: processedData });
}
