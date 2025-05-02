import { IJobData } from "../types/domain";
import * as crypto from "crypto";

export function buildJobDescription(jobInfo: IJobData): string {
  const { jobTitle, jobTags, department, headline, experienceRequirements } =
    jobInfo;
  const tags = jobTags.length > 0 ? `Tags: ${jobTags.join(" ")}` : "No tags";
  const requiredExperience = experienceRequirements.length
    ? `Requires: ${experienceRequirements
        .map((exp) => `${exp.years} years, ${exp.subject.replace("?", "")}`)
        .join(", ")}`
    : "No experience requirements defined";

  const description = `Job Title: ${jobTitle} | Department: ${department} | Tags: ${tags} | Required experience: ${requiredExperience} | Headline: ${
    headline ? `${headline}` : "No job headline"
  }`;
  return description;
}

export function hashJobDescription(jd: string): string {
  return crypto.createHash("md5").update(jd, "utf8").digest("hex");
}

/**
 * Returns `batchSize` elements from an array and mutates the array removing those elements
 * @param elements Array of elements
 * @param batchSize Number of elements to be removed and returned
 * @returns
 */
export function getNextBatch<T>(elements: T[], batchSize: number): T[] {
  const batch = elements.slice(0, batchSize);

  elements.splice(0, batchSize);

  return batch;
}
