import { DomainDataProcessor } from "./DomainDataProcessor";
import { RawScoring } from "../types/scoring";
import { Candidate } from "../types";

jest.mock("../utils/DomainUtils", () => ({
  hashString: jest.fn(() => "mocked-hash"),
}));

describe("DomainDataProcessor", () => {
  const candidates: Candidate[] = [
    {
      candidateId: "1",
      candidateName: "Alice",
      experience: [],
      education: [],
      questions: [],
      disqualified: false,
      skills: ["Python"],
      appliedAt: new Date().toISOString(),
    },
    {
      candidateId: "1",
      candidateName: "Alice",
      experience: [
        {
          totalExperience: "2 years 1 month",
          totalMonths: 25,
          institution: "MIT",
          title: "Testing",
          startDate: "Jan 2020",
          endDate: "Feb 2021",
        },
      ],
      education: [],
      questions: [],
      disqualified: false,
      skills: ["Python"],
      appliedAt: new Date().toISOString(),
    },
  ];

  const scores: RawScoring[] = [
    {
      candidateId: "1",
      highlights: "Great experience",
      overallExperience: 40,
      questionAlignment: 10,
      education: 10,
      completion: 8,
    },
    {
      candidateId: "2",
      highlights: "Strong communicator",
      overallExperience: 18,
      questionAlignment: 5,
      education: 20,
      completion: 10,
    },
  ];

  it("should process scores and return enriched result", () => {
    const result = DomainDataProcessor.processScores(candidates, scores);

    expect(result.length).toBe(2);

    expect(result[0]).toMatchObject({
      candidateId: "1",
      candidateName: "Alice",
      generalScoring: 68,
      scoringId: "mocked-hash",
      highlights: "Great experience",
    });

    expect(result[1]).toMatchObject({
      candidateId: "2",
      candidateName: "Unknown",
      generalScoring: 53,
      scoringId: "mocked-hash",
      highlights: "Strong communicator",
    });

    expect(new Date(result[0].scoredAt).toString()).not.toBe("Invalid Date");
  });

  it('should fallback to "Unknown" if candidate name is missing', () => {
    const unknownCandidates: Candidate[] = []; // Empty list

    const result = DomainDataProcessor.processScores(unknownCandidates, scores);

    expect(result[0].candidateName).toBe("Unknown");
  });

  it("should return max 30 top scores", () => {
    const largeInput: RawScoring[] = Array.from({ length: 50 }, (_, i) => ({
      candidateId: `${i}`,
      highlights: `h-${i}`,
      overallExperience: 15,
      questionAlignment: 10,
      education: 5,
      completion: 8,
    }));

    const largeCandidates: Candidate[] = largeInput.map((s) => ({
      candidateId: s.candidateId,
      candidateName: `Candidate ${s.candidateId}`,
      experience: [],
      education: [],
      questions: [],
      disqualified: false,
      skills: [],
      appliedAt: new Date().toISOString(),
    }));

    const result = DomainDataProcessor.processScores(
      largeCandidates,
      largeInput
    );

    expect(result.length).toBe(30);
  });
});
