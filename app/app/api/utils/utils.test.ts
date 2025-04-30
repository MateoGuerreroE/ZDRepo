import { describe } from "node:test";
import {
  calculateTimePeriod,
  cleanDate,
  extractDate,
  extractTitleAndInstitution,
  normalizeHeaders,
} from "./SheetUtils";

describe("SheetUtils", () => {
  it("should normalize headers correctly", () => {
    const headers = ["First Name", "Last Name", "Email Address"];
    const normalizedHeaders = normalizeHeaders<unknown>(headers);
    expect(normalizedHeaders).toEqual([
      "firstName",
      "lastName",
      "emailAddress",
    ]);
  });

  it("should extract date correctly", () => {
    const dateString = "Software Engineer (Jan 2020 to Dec 2021)";
    const { startDate, endDate, output } = extractDate(dateString);
    expect(startDate).toEqual("Jan 2020");
    expect(endDate).toEqual("Dec 2021");
    expect(output).toEqual("Software Engineer");
  });

  it("should calculate time period correctly", () => {
    const startDate = "June 2023";
    const endDate = "Dec 2023";
    const { months, totalExperience } = calculateTimePeriod(startDate, endDate);
    expect(months).toEqual(6);
    expect(totalExperience).toEqual("0 years 6 months");
  });

  it("should cleanDate", () => {
    const dateString1 = "N/A";
    const dateString2 = " ";

    const cleanedDate1 = cleanDate(dateString1);
    const cleanedDate2 = cleanDate(dateString2);

    expect(cleanedDate1).toBeNull();
    expect(cleanedDate2).toBeNull();
  });

  it("should extractTitleAndInstitution", () => {
    const input = "Software Engineer at XYZ Corp";
    const { title, institution } = extractTitleAndInstitution(input);
    expect(title).toEqual("Software Engineer");
    expect(institution).toEqual("XYZ Corp");
  });

  it('should extractTitleAndInstitution with starting "at"', () => {
    const input = "at XYZ Corp";
    const { title, institution } = extractTitleAndInstitution(input);
    expect(title).toEqual(null);
    expect(institution).toEqual("XYZ Corp");
  });

  it('should extractTitleAndInstitution with ending "at"', () => {
    const input = "Software Engineer at";
    const { title, institution } = extractTitleAndInstitution(input);
    expect(title).toEqual("Software Engineer");
    expect(institution).toEqual(null);
  });
});
