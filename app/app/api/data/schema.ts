import {
  boolean,
  integer,
  json,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import {
  IEducationData,
  IExperienceData,
  IQuestionData,
  IRawJobData,
} from "../types";
import { IScoringDetails } from "../types/scoring";

export const candidatesTable = pgTable("candidates", {
  candidateId: text("candidateId").primaryKey(),
  candidateName: text("candidateName").notNull(),
  experience: json().notNull().$type<IExperienceData[]>(),
  education: json().notNull().$type<IEducationData[]>(),
  skills: json().notNull().$type<string[]>(),
  disqualified: boolean().notNull(),
  questions: json().notNull().$type<IQuestionData[]>(),
  jobData: json().notNull().$type<IRawJobData>(),
});

export const scoreTable = pgTable("scores", {
  scoringId: text("scoringId").primaryKey(),
  scoredAt: timestamp("scoredAt").notNull().defaultNow(),
  generalScoring: integer("generalScoring").notNull(),
  scoringDetails: json().notNull().$type<IScoringDetails>(),
  candidateId: text("candidateId")
    .notNull()
    .references(() => candidatesTable.candidateId),
});
