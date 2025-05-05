import { boolean, json, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import {
  Candidate,
  IEducationData,
  IExperienceData,
  IQuestionData,
} from "../types";
import { RawScoring } from "../types/scoring";

export const candidatesTable = pgTable("candidates", {
  candidateId: text("candidateId").primaryKey(),
  candidateName: text("candidateName").notNull(),
  appliedAt: text("appliedAt").notNull(),
  experience: json().notNull().$type<IExperienceData[]>(),
  education: json().notNull().$type<IEducationData[]>(),
  skills: json().notNull().$type<string[]>(),
  disqualified: boolean().notNull(),
  questions: json().notNull().$type<IQuestionData[]>(),
});

export const scoreTable = pgTable("scores", {
  jobId: text("jobId").notNull(),
  scoredAt: timestamp("scoredAt").notNull().defaultNow(),
  candidates: json().notNull().$type<Candidate[]>(),
  scores: json().notNull().$type<RawScoring[]>(),
});
