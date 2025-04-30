import { ConfigService } from "./Config.service";
import { Auth, google } from "googleapis";
import { DataSource } from "./types/abstract/DataSource";
import { SheetDataProcessor } from "./SheetDataProcessor.service";

export class GoogleSpreadSheetService extends DataSource {
  private auth: Auth.GoogleAuth;
  private spreadSheetId: string;

  constructor(private configService: ConfigService) {
    super();
    const googleCredentials = this.configService.getGoogleCredentials();
    this.spreadSheetId = this.configService.getDataSource();

    this.auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: googleCredentials.client_email,
        private_key: googleCredentials.private_key,
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
  }

  async getData(): Promise<Record<string, string | null>[]> {
    const sheets = google.sheets({ version: "v4", auth: this.auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadSheetId,
      range: "Sheet1!A1:AH200",
    });

    const rawData = SheetDataProcessor.parseToRawJson(
      response.data.values || []
    );
    return SheetDataProcessor.processData(rawData);
  }
}
