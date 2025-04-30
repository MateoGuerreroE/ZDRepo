import { NormalizedCandidateData } from "./sheets";

export type NormalizedSourceData = NormalizedCandidateData & {
  candidateId: string;
};
