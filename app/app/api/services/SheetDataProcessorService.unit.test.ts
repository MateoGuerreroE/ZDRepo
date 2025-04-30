import { SheetDataProcessor } from "./SheetDataProcessor.service";
import { IRawCandidateData } from "./types/sheets";

describe("SheetDataProcessorService", () => {
  const sampleSheetData = [
    ["Name", "Age", "City", "Residence Country"],
    ["John Doe", "30", "New York", "USA"],
    ["Jane Smith", "25", "London", "UK"],
    ["Alice Johnson", "28", "Sydney", "Australia"],
    ["Bob Brown", "35", "Toronto", "Canada"],
  ];

  const sampleCandidateData: IRawCandidateData = {
    name: "John Doe",
    jobTitle: "Software Engineer",
    jobDepartment: "Engineering",
    jobLocation: "New York",
    headline: null,
    creationTime: "2023-10-01T12:00:00Z",
    stage: "Interview",
    tags: null,
    source: "LinkedIn",
    type: "Full-time",
    summary: null,
    keywords: null,
    educations:
      "Bachelor of Science at XYZ University (Mar 2015 to Oct 2019) | Master of Arts at ABC University (June 2013 to Dec 2015)",
    experiences:
      "Software Engineer at (Jan 2020 to N/A) | Data Scientist at XYZ (Jan 2015 to Dec 2020)",
    skills: "java|kotlin|yaml",
    disqualified: "No",
    disqualifiedAt: null,
    disqualificationCategory: null,
    disqualificationReason: null,
    disqualificationNote: null,
    question1: "Question 1",
    answer1: null,
    question2: null,
    answer2: null,
    question3: null,
    answer3: "Answer 3",
    question4: "Question 4",
    answer4: "Answer 4",
    question5: null,
    answer5: null,
    question6: null,
    answer6: null,
    question7: "Question 7",
    answer7: null,
  };

  describe("Parse to raw JSON", () => {
    it("should parse a sheet to raw JSON", () => {
      const result = SheetDataProcessor.parseToRawJson(sampleSheetData);
      expect(Object.keys(result[0])).toEqual([
        "name",
        "age",
        "city",
        "residenceCountry",
      ]);
      expect(result.length).toBe(4);
      expect(result[result.length - 1]).toStrictEqual({
        name: "Bob Brown",
        age: "35",
        city: "Toronto",
        residenceCountry: "Canada",
      });
    });

    it("should parse sheet to raw JSON with empty values", () => {
      const sampledData = [
        ...sampleSheetData,
        ["Michael Scott", "", "Scranton", ""],
      ];
      const result = SheetDataProcessor.parseToRawJson(sampledData);
      expect(result[result.length - 1]).toStrictEqual({
        name: "Michael Scott",
        age: null,
        city: "Scranton",
        residenceCountry: null,
      });
    });
  });

  describe("Parse experience data", () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-12-01T12:00:00Z").getTime());
    const experienceString1 =
      "Software Engineer at XYZ Company (Jan 2020 to Dec 2022)";
    const experienceString2 =
      "Data Analyst at ABC Corp (Feb 2018 to Nov 2019) | Software Engineer at DEF Inc (Jan 2017 to Jan 2018)";
    const experienceString3 = "Intern at DEF Inc (N/A to Aug 2017)";
    const experienceString4 = "at GHI Ltd (Jan 2015 to Dec 2016)";
    const experienceString5 =
      "Software Engineer at (Jan 2020 to N/A) | Data Scientist at XYZ (Jan 2015 to Dec 2020)";
    // This tests cleanNullExperienceData private function
    const experienceString6 =
      "Software Engineer at XYZ Company (Jan 2020 to N/A) | Data Scientist at XYZ (Jan 2015 to N/A) | Intern at DEF Inc (N/A to N/A) | at GHI Ltd (Jan 2015 to June 2023)";

    test.each([
      [experienceString1, 35, "Software Engineer", "XYZ Company", 1],
      [experienceString2, 21, "Data Analyst", "ABC Corp", 2],
      [experienceString3, null, "Intern", "DEF Inc", 1],
      [experienceString4, 23, null, "GHI Ltd", 1],
      [experienceString5, 59, "Software Engineer", null, 2],
      [experienceString6, 119, "Data Scientist", "XYZ", 2],
    ])(
      "Should parse experience data with string %s",
      (experienceString, months, title, institution, length) => {
        const result = SheetDataProcessor.parseExperienceData(experienceString);
        expect(result.length).toBe(length);
        expect(result[0].totalMonths).toBe(months);
        expect(result[0].title).toBe(title);
        expect(result[0].institution).toBe(institution);
      }
    );
  });

  describe("Parse education data", () => {
    const educationString1 =
      "Bachelor of Science at XYZ University (Mar 2015 to Oct 2019) | Master of Arts at ABC University (June 2013 to Dec 2015)";
    const educationString2 =
      "Master of Science at ABC University (Apr 2016 to Apr 2018) | Bachelor of Arts at DEF College (June 2012 to Dec 2016)";
    const educationString3 = "PhD at GHI University (N/A to Jun 2020)";
    const educationString4 = "at JKL Institute (Apr 2010 to Dec 2014)";

    test.each([
      [educationString1, "Bachelor of Science", "XYZ University", 2],
      [educationString2, "Master of Science", "ABC University", 2],
      [educationString3, "PhD", "GHI University", 1],
      [educationString4, null, "JKL Institute", 1],
    ])(
      "Should parse education data with string %s",
      (educationString, title, institution, length) => {
        const result = SheetDataProcessor.parseEducationData(educationString);
        expect(result.length).toBe(length);
        expect(result[0].title).toBe(title);
        expect(result[0].institution).toBe(institution);
      }
    );
  });

  it("should parse question data", () => {
    const result = SheetDataProcessor.parseQuestionData(sampleCandidateData);
    expect(result.length).toBe(3);
    expect(result[0]).toStrictEqual({
      question: "Question 1",
      answer: null,
    });
    expect(result[1]).toStrictEqual({
      question: "Question 4",
      answer: "Answer 4",
    });

    expect(result[2]).toStrictEqual({
      question: "Question 7",
      answer: null,
    });
  });

  it("should correctly process data", () => {
    const processedData = SheetDataProcessor.processData([sampleCandidateData]);

    expect(processedData).toHaveLength(1);
    expect(processedData[0]).toStrictEqual({
      candidateName: "John Doe",
      experience: [
        {
          institution: null,
          title: "Software Engineer",
          startDate: "Jan 2020",
          endDate: null,
          totalExperience: "4 years 11 months",
          totalMonths: 59,
        },
        {
          institution: "XYZ",
          title: "Data Scientist",
          startDate: "Jan 2015",
          endDate: "Dec 2020",
          totalExperience: "5 years 11 months",
          totalMonths: 71,
        },
      ],
      questions: [
        {
          question: "Question 1",
          answer: null,
        },
        {
          question: "Question 4",
          answer: "Answer 4",
        },
        {
          question: "Question 7",
          answer: null,
        },
      ],
      education: [
        {
          institution: "XYZ University",
          title: "Bachelor of Science",
          startDate: "Mar 2015",
          endDate: "Oct 2019",
        },
        {
          institution: "ABC University",
          title: "Master of Arts",
          startDate: "June 2013",
          endDate: "Dec 2015",
        },
      ],
      skills: ["java", "kotlin", "yaml"],
      disqualified: false,
    });
  });
});
