import { cleanDate, normalizeHeaders } from "../utils";
import { IEducationData } from "./types/sheets";

export class SheetDataProcessor {
  static parseToRawJson(
    spreadSheetsData: string[][]
  ): Record<string, string | null>[] {
    const headers = normalizeHeaders(spreadSheetsData[0]);
    const rows = spreadSheetsData.slice(1);

    return rows.map((row) => {
      const rowData: Record<string, string | null> = {};
      headers.forEach((header, index) => {
        rowData[header] = row[index] || null;
      });
      return rowData;
    });
  }

  static processData(
    data: Record<string, string | null>[]
  ): Record<string, string | null>[] {
    return data.map((row) => {
      const educationString = row.educations;
      row.educations = this.parseEducationData(educationString) as any;
      return row;
    });
  }

  static parseEducationData(educationString: string | null): IEducationData[] {
    if (!educationString) {
      return [];
    }

    const entries = educationString.trim().split("|");
    const result: IEducationData[] = [];
    for (const entry of entries) {
      const { startDate, endDate, output } = this.extractDate(entry);
      const { title, institution } = this.extractTitleAndInstitution(output);

      result.push({
        institution: institution,
        degree: title,
        startDate,
        endDate,
      });
    }
    return result;
  }

  private static extractDate(input: string): {
    startDate: string | null;
    endDate: string | null;
    output: string;
  } {
    const matches = [...input.matchAll(/\(([^)]+)\)/g)];
    if (matches.length) {
      const lastMatch = matches[matches.length - 1];
      return {
        startDate: cleanDate(lastMatch[1].split(" to ")[0] || " "),
        endDate: cleanDate(lastMatch[1].split(" to ")[1] || " "),
        output: input.replace(lastMatch[0], "").trim(),
      };
    }
    return {
      startDate: null,
      endDate: null,
      output: input.trim(),
    };
  }

  private static extractTitleAndInstitution(baseString: string): {
    title: string | null;
    institution: string | null;
  } {
    const match = baseString.match(/\b(at)\b/i);
    if (!match || match.index === undefined) {
      return { title: null, institution: null };
    }

    const title = baseString.slice(0, match.index).trim();
    const institution = baseString.slice(match.index + match[0].length).trim();

    return {
      title: title.length ? title : null,
      institution: institution.length ? institution : null,
    };
  }

  private calculateTimePeriod();
}
