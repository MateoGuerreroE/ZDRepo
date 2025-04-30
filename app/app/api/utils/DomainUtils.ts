import { IJobData } from "../types/domain";

export function buildJobDescription(jobInfo: IJobData): string {
  const { jobTitle, jobTags, department, headline, experienceRequirements } =
    jobInfo;
  const tags = jobTags.length > 0 ? `Tags: ${jobTags.join(" ")}` : "No tags";
  const requiredExperience = experienceRequirements.length
    ? `Requires: ${experienceRequirements
        .map((exp) => `${exp.years} years, ${exp.subject.replace("?", "")}`)
        .join(", ")}`
    : "No experience requirements defined";

  const description = `Job Title: ${jobTitle} | Department: ${department} | Tags: ${tags} | Experience: ${requiredExperience} | Headline: ${
    headline ? `${headline}` : "No job headline"
  }`;
  return description;
}
