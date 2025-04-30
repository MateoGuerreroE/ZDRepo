import { IQuestionData, NormalizedCandidateData } from "../types";
import { Candidate } from "../types/dataSource";
import { IExperienceRequirements, IJob, IJobData } from "../types/domain";
import { buildJobDescription } from "../utils/DomainUtils";

export class DomainDataProcessor {
  static getJobsMap(data: NormalizedCandidateData[]): Map<string, IJob> {
    const jobs: Map<string, IJob> = new Map();
    for (const candidate of data) {
      const { jobData } = candidate;
      const key = jobData.jobTitle;
      if (jobs.has(key)) {
        continue;
      }
      // TODO: This infers reprocessing, is It easier to receive candidate normalization? -> Change structure

      const job: IJobData = {
        jobTitle: jobData.jobTitle,
        jobTags: jobData.keywords
          ? jobData.keywords.split("|").map((s) => s.trim())
          : [],
        department: jobData.jobDepartment,
        headline: jobData.headline || null,
        experienceRequirements: this.getExperienceRequirements(
          candidate.questions
        ),
      };
      const jobDescription = buildJobDescription(job);

      jobs.set(key, { ...job, jobDescription });
    }

    return jobs;
  }

  static getProcessedCandidates(
    candidates: NormalizedCandidateData[]
  ): Candidate[] {
    const processedCandidates = candidates.map((candidate) => {
      const { jobData, ...candidateInfo } = candidate;
      return {
        ...candidateInfo,
        jobApplied: jobData.jobTitle,
      };
    });
    return processedCandidates;
  }

  private static getExperienceRequirements(
    questions: IQuestionData[]
  ): IExperienceRequirements[] {
    const result: IExperienceRequirements[] = [];
    for (const question of questions) {
      const match = question.question?.match(/(\d+)\+?\s*years?/); // This matches "2 years" or "2+ years"
      if (match) {
        const years = parseInt(match[1], 10);
        const subject = question.question
          ?.slice(match.index! + match[0].length)
          .trim();
        if (!subject) {
          continue;
        }
        result.push({ subject, years });
      }
    }
    return result;
  }
}
