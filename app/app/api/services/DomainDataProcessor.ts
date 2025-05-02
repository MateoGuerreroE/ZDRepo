import { nanoid } from "nanoid";
import { IQuestionData, NormalizedCandidateData } from "../types";
import {
  Candidate,
  IExperienceRequirements,
  IJob,
  IJobData,
} from "../types/domain";
import { buildJobDescription } from "../utils/DomainUtils";
import { RawScoring, ScoringInfo } from "../types/scoring";

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
        candidateId: candidateInfo.candidateId ?? nanoid(),
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

  static getScoringInfo(jdHash: string, scores: RawScoring[]): ScoringInfo[] {
    return scores.map((rscore) => {
      const { candidateId, highlights, ...scoringDetails } = rscore;
      const totalScore = Object.values(scoringDetails).reduce((acc, next) => {
        return acc + next;
      }, 0);

      return {
        candidateId,
        scoringId: nanoid(),
        generalScoring: totalScore,
        jobHash: jdHash,
        scoredAt: new Date(),
        scoringDetails,
        highlights,
      };
    });
  }

  static getTopCandidates(scores: ScoringInfo[]) {
    const sortedScores = scores.sort(
      (a, b) => b.generalScoring - a.generalScoring
    );
    return sortedScores.slice(0, 30);
  }
}
