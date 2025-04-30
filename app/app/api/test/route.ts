import { ConfigService } from "../services/Config.service";
import { GoogleSpreadSheetService } from "../services/GoogleSpreadSheet.service";

export async function GET() {
  const configService = new ConfigService();
  const googleSpreadSheetService = new GoogleSpreadSheetService(configService);

  const data = await googleSpreadSheetService.getData();
  return Response.json({ data });
}
