import { mock, MockProxy } from "jest-mock-extended";
import { ConfigService } from "./Config.service";
import { GoogleSpreadSheetService } from "./GoogleSpreadSheet.service";

jest.mock("googleapis", () => {
  const sheetMock = {
    spreadsheets: {
      values: {
        get: jest.fn().mockResolvedValue({
          data: {
            values: [
              ["Name", "Age"],
              ["John Doe", "30"],
            ],
          },
        }),
      },
    },
  };

  return {
    google: {
      sheets: jest.fn(() => sheetMock),
      auth: {
        GoogleAuth: jest.fn(),
      },
    },
  };
});

describe("GoogleSpreadSheetService", () => {
  const configService: MockProxy<ConfigService> = mock<ConfigService>();
  configService.getGoogleCredentials.mockReturnValue({
    client_email: "test@email.com",
    private_key: "fake-private-key",
    project_id: "test-project-id",
    client_id: "test-client-id",
  });

  configService.getDataSource.mockReturnValue("test-spreadsheet-id");

  const instance = new GoogleSpreadSheetService(configService);

  it("should getData", async () => {
    const result = await instance.getData();
    expect(result).toStrictEqual([
      {
        name: "John Doe",
        age: "30",
      },
    ]);
  });
});
