import { NeonDataSource } from "./NeonDataSource";
import { candidatesTable, scoreTable, NeonDataClient } from "../data";
import { Candidate } from "../types";
import { RawScoring } from "../types/scoring";

jest.mock("../data", () => {
  const actual = jest.requireActual("../data");
  return {
    ...actual,
    NeonDataClient: jest.fn(() => ({
      db: {
        select: jest.fn(),
        insert: jest.fn(),
      },
    })),
  };
});

describe("NeonDataSource", () => {
  const mockSelect = jest.fn();
  const mockInsert = jest.fn();
  const mockDb = {
    select: mockSelect,
    insert: mockInsert,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Override the NeonDataClient mock to use our mockDb
    (NeonDataClient as jest.Mock).mockImplementation(() => ({
      db: mockDb,
    }));
  });

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
      candidateId: "2",
      candidateName: "Bob",
      experience: [],
      education: [],
      questions: [],
      disqualified: false,
      skills: ["JavaScript"],
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

  it("should get candidates from DB", async () => {
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockResolvedValue(candidates),
    });

    const dataSource = new NeonDataSource();
    const result = await dataSource.getCandidates();

    expect(result).toEqual(candidates);
    expect(mockSelect).toHaveBeenCalled();
  });

  it("should insert score result", async () => {
    const insertMock = jest
      .fn()
      .mockReturnValue({ values: jest.fn().mockResolvedValue(undefined) });
    mockDb.insert = insertMock;

    const dataSource = new NeonDataSource();
    await dataSource.saveResult("job123", candidates, scores);

    expect(insertMock).toHaveBeenCalledWith(scoreTable);
    expect(insertMock().values).toHaveBeenCalledWith({
      jobId: "job123",
      candidates,
      scores,
    });
  });

  it("should return score from DB", async () => {
    const mockResult = [
      {
        jobId: "job123",
        candidates,
        scores,
      },
    ];
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(mockResult),
      }),
    });

    const dataSource = new NeonDataSource();
    const result = await dataSource.getScores("job123");

    expect(result).toEqual(mockResult[0]);
    expect(mockSelect).toHaveBeenCalled();
  });

  it("should return null if no scores found", async () => {
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    });

    const dataSource = new NeonDataSource();
    const result = await dataSource.getScores("job123");

    expect(result).toBeNull();
  });

  it("should save candidates to DB", async () => {
    const insertMock = jest
      .fn()
      .mockReturnValue({ values: jest.fn().mockResolvedValue(undefined) });
    mockDb.insert = insertMock;

    const dataSource = new NeonDataSource();
    await dataSource.saveCandidates(candidates);

    expect(insertMock).toHaveBeenCalledWith(candidatesTable);
    expect(insertMock().values).toHaveBeenCalledWith(candidates);
  });
});
