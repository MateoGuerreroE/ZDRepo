import { NormalizedCandidateData } from "./sheets";

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

export type Candidate = Omit<NormalizedCandidateData, "jobData"> & {
  jobApplied: string;
};

export interface ProcessedData {
  job: string;
  jobDescription: string;
  candidates: Candidate[];
}
