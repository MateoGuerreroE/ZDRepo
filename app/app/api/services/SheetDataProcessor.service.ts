import { cleanDate, normalizeHeaders } from "../utils";
import {
  IEducationData,
  IExperienceData,
  IQuestionData,
  IRawCandidateData,
  NormalizedCandidateData,
} from "./types/sheets";

export class SheetDataProcessor {
  static parseToRawJson(spreadSheetsData: string[][]): IRawCandidateData[] {
    const headers = normalizeHeaders(spreadSheetsData[0]);
    const rows = spreadSheetsData.slice(1);

    return rows.map((row) => {
      const rowData = {} as IRawCandidateData;
      headers.forEach((header, index) => {
        rowData[header] = row[index] || null;
      });
      // Force casting
      return rowData;
    });
  }

  static processData(data: IRawCandidateData[]): NormalizedCandidateData[] {
    return data.map((row) => {
      const educationString = row.educations;
      const experienceString = row.experiences;
      return {
        candidateName: row.name,
        skills: row.skills ? row.skills.split("|").map((s) => s.trim()) : [],
        education: this.parseEducationData(educationString),
        experience: this.parseExperienceData(experienceString),
        disqualified: row.disqualified === "Yes",
        questions: this.parseQuestionData(row),
      };
    });
  }

  static parseExperienceData(
    experienceString: string | null
  ): IExperienceData[] {
    if (!experienceString) {
      return [];
    }

    const entries = experienceString.trim().split("|");
    const result: IExperienceData[] = [];

    for (const entry of entries) {
      const { startDate, endDate, output } = this.extractDate(entry);
      const { title, institution } = this.extractTitleAndInstitution(output);
      const { totalExperience, months } = this.calculateTimePeriod(
        startDate,
        endDate
      );

      result.push({
        institution: institution,
        title,
        startDate,
        endDate,
        totalExperience,
        totalMonths: months,
      });
    }
    return this.cleanNullExperienceData(result);
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
        title,
        startDate,
        endDate,
      });
    }
    return result;
  }

  static parseQuestionData(data: IRawCandidateData): IQuestionData[] {
    const questionData: IQuestionData[] = [];

    for (let i = 1; i <= 7; i++) {
      const questionKey = `question${i}` as keyof IRawCandidateData;
      const answerKey = `answer${i}` as keyof IRawCandidateData;
      const question = data[questionKey];
      if (!question) {
        continue;
      }
      const answer = data[answerKey];

      questionData.push({ question, answer });
    }

    return questionData;
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

  private static calculateTimePeriod(
    fromDate: string | null,
    toDate: string | null
  ): { totalExperience: string | null; months: number | null } {
    if (!fromDate) {
      return {
        totalExperience: null,
        months: null,
      };
    }

    const from = new Date(fromDate + " 1");
    const to = toDate ? new Date(toDate + " 1") : new Date();

    const years = to.getFullYear() - from.getFullYear();
    const months = to.getMonth() - from.getMonth();

    const totalMonths = years * 12 + months;
    if (totalMonths < 0) return { totalExperience: null, months: null };

    const totalYears = Math.floor(totalMonths / 12);

    const remainingMonths = ((totalMonths % 12) + 12) % 12;

    return {
      totalExperience: `${totalYears} years ${remainingMonths} months`,
      months: totalMonths,
    };
  }

  /**
   * There're cases where there are more than 1 experience with null endDate,
   * which is assumed to be the latest experience (null endDate meaning current).
   * In such cases, we need to remove the other experiences with null endDate, and
   * leave the larger one.
   */
  private static cleanNullExperienceData(data: IExperienceData[]) {
    const nullEndDateEntries = data.filter((entry) => entry.endDate === null);

    if (nullEndDateEntries.length > 1) {
      // In case we need to leave the most recent one with null endDate, modify reducer to compare
      const maxExperienceEntry = nullEndDateEntries.reduce((prev, curr) =>
        prev.totalMonths && curr.totalMonths
          ? prev.totalMonths > curr.totalMonths
            ? prev
            : curr
          : prev
      );

      return data.filter(
        (entry) => entry.endDate !== null || entry === maxExperienceEntry
      );
    }

    return data;
  }
}
