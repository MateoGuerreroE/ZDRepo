import { Candidate } from "./domain";

export interface IScoringDetails {
  overallExperience: number; // 0-50 including skills (if any) and relevant experience
  education: number; // 0-20 including relevant education and certifications
  questionAlignment: number; // 0-20 This scores how well the candidate's answers align with the questions asked
  completion: number; // 0-10 This scores how well the candidate completed the whole format, considering skills, etc
}

export type ScoringInfo = {
  candidateId: string;
  scoringId: string;
  generalScoring: number; // 0-100
  scoredAt: Date;
  highlights: string;
  scoringDetails: IScoringDetails;
  jobHash: string;
};

export interface RawScoring extends IScoringDetails {
  highlights: string;
  candidateId: string;
}

export type ScoringResponse = {
  candidates: RawScoring[];
};

export interface IScoreResult extends ScoringInfo {
  candidate: Candidate;
}
