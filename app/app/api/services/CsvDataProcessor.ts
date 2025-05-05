import {
  calculateTimePeriod,
  extractDate,
  extractTitleAndInstitution,
  normalizeHeaders,
} from "../utils";
import {
  IEducationData,
  IExperienceData,
  IQuestionData,
  IRawCandidateData,
} from "../types";
import { hashString } from "../utils/DomainUtils";
import { Candidate } from "../types";

export class CsvDataProcessor {
  private static parseToRawJson(
    spreadSheetsData: string[][]
  ): IRawCandidateData[] {
    const headers = normalizeHeaders<IRawCandidateData>(spreadSheetsData[0]);
    const rows = spreadSheetsData.slice(1);

    return rows.map((row) => {
      const rowData: Record<string, string | null> = {};
      headers.forEach((header, index) => {
        rowData[header] = row[index] || null;
      });
      // Force casting
      return rowData;
    }) as IRawCandidateData[];
  }

  static processData(data: string[][]): Candidate[] {
    const jsonData = this.parseToRawJson(data);

    return jsonData.map((row) => {
      const {
        educations,
        experiences,
        skills,
        name,
        disqualified,
        creationTime,
      } = row;
      return {
        candidateId: hashString(name + row.creationTime),
        candidateName: name,
        appliedAt: creationTime,
        skills: skills ? skills.split("|").map((s) => s.trim()) : [],
        education: this.parseEducationData(educations),
        experience: this.parseExperienceData(experiences),
        disqualified: disqualified === "Yes",
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
      const { startDate, endDate, output } = extractDate(entry);
      const { title, institution } = extractTitleAndInstitution(output);
      const { totalExperience, months } = calculateTimePeriod(
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
      const { startDate, endDate, output } = extractDate(entry);
      const { title, institution } = extractTitleAndInstitution(output);

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
