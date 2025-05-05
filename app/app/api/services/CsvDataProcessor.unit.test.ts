import { IRawCandidateData } from "../types";
import { CsvDataProcessor } from "./CsvDataProcessor";

jest.mock("../utils", () => ({
  ...jest.requireActual("../utils"),
  extractDate: jest.fn().mockReturnValue({
    startDate: "2020-01-01",
    endDate: null,
    output: "Software Engineer at Company X",
  }),
  extractTitleAndInstitution: jest.fn().mockReturnValue({
    title: "Software Engineer",
    institution: "Company X",
  }),
  calculateTimePeriod: jest.fn().mockReturnValue({
    totalExperience: "3 years",
    months: 36,
  }),
  normalizeHeaders: jest.fn((headers) =>
    headers.map((h: string) => h.toLowerCase())
  ),
}));

jest.mock("../utils/DomainUtils", () => ({
  hashString: jest.fn().mockReturnValue("hashed-id"),
}));

describe("CsvDataProcessor", () => {
  const sampleHeaders = [
    "name",
    "creationTime",
    "skills",
    "educations",
    "experiences",
    "disqualified",
    "question1",
    "answer1",
  ];

  const sampleRow = [
    "John Doe",
    "2024-01-01",
    "JavaScript | TypeScript",
    "BSc Computer Science | MSc AI",
    "Software Engineer at X (2020-01 - present) | Developer at Y (2018 - 2020)",
    "Yes",
    "Why do you want this job?",
    "Because it's cool",
  ];

  describe("processData", () => {
    it("should parse and return processed candidate data", () => {
      const data = [sampleHeaders, sampleRow];
      const result = CsvDataProcessor.processData(data);

      expect(result.length).toBe(1);
      const candidate = result[0];

      expect(candidate.candidateId).toBe("hashed-id");
      expect(candidate.candidateName).toBe("John Doe");
      expect(candidate.skills).toEqual(["JavaScript", "TypeScript"]);
      expect(candidate.disqualified).toBe(true);
      expect(candidate.questions).toEqual([
        {
          question: "Why do you want this job?",
          answer: "Because it's cool",
        },
      ]);
      expect(candidate.education.length).toBeGreaterThan(0);
      expect(candidate.experience.length).toBeGreaterThan(0);
    });
  });

  describe("parseExperienceData", () => {
    it("should return parsed experience objects", () => {
      const input = "Software Engineer at X (2020 - now)";
      const result = CsvDataProcessor.parseExperienceData(input);

      expect(result).toEqual([
        {
          institution: "Company X",
          title: "Software Engineer",
          startDate: "2020-01-01",
          endDate: null,
          totalExperience: "3 years",
          totalMonths: 36,
        },
      ]);
    });
  });

  describe("parseEducationData", () => {
    it("should return parsed education objects", () => {
      const input = "BSc CS at XYZ (2010 - 2014)";
      const result = CsvDataProcessor.parseEducationData(input);

      expect(result).toEqual([
        {
          institution: "Company X",
          title: "Software Engineer",
          startDate: "2020-01-01",
          endDate: null,
        },
      ]);
    });
  });

  describe("parseQuestionData", () => {
    it("should extract question and answer pairs", () => {
      const row = {
        question1: "What is your strength?",
        answer1: "Problem solving",
        question2: null,
        answer2: null,
      };

      const result = CsvDataProcessor.parseQuestionData(
        row as IRawCandidateData
      );
      expect(result).toEqual([
        {
          question: "What is your strength?",
          answer: "Problem solving",
        },
      ]);
    });
  });

  describe("cleanNullExperienceData", () => {
    it("should retain only one experience with null endDate", () => {
      const input = [
        {
          institution: "A",
          title: "Engineer",
          startDate: "2020-01-01",
          endDate: null,
          totalExperience: "2 years",
          totalMonths: 24,
        },
        {
          institution: "B",
          title: "Senior Engineer",
          startDate: "2021-01-01",
          endDate: null,
          totalExperience: "3 years",
          totalMonths: 36,
        },
      ];

      const result = CsvDataProcessor["cleanNullExperienceData"](input);
      expect(result.length).toBe(1);
      expect(result[0].institution).toBe("B");
    });

    it("should not alter data if one or zero null endDates", () => {
      const input = [
        {
          institution: "A",
          title: "Engineer",
          startDate: "2020-01-01",
          endDate: null,
          totalExperience: "2 years",
          totalMonths: 24,
        },
      ];

      const result = CsvDataProcessor["cleanNullExperienceData"](input);
      expect(result).toEqual(input);
    });
  });
});
