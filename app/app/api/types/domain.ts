import { NormalizedCandidateData } from "./app";

/**
 * @deprecated JD won't need to be inferred from the job title anymore.
 */
export interface IJobData {
  jobTitle: string;
  jobTags: string[];
  department: string;
  headline: string | null;
  experienceRequirements: IExperienceRequirements[];
}

export type IJob = IJobData & { jobDescription: string };

export interface IExperienceRequirements {
  subject: string;
  years: number;
}

export type Candidate = NormalizedCandidateData & {
  candidateId: string;
};

export interface ProcessedData {
  job: string;
  jobDescription: string;
  candidates: Candidate[];
}
