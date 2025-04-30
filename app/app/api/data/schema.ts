import { boolean, integer, json, pgTable, text } from "drizzle-orm/pg-core";
import { IEducationData, IExperienceData, IQuestionData } from "../types";

export const candidatesTable = pgTable("candidates", {
  candidateId: text("candidateId").primaryKey(),
  candidateName: text("candidateName").notNull(),
  experience: json().notNull().$type<IExperienceData[]>(),
  education: json().notNull().$type<IEducationData[]>(),
  skills: json().notNull().$type<string[]>(),
  disqualified: boolean().notNull(),
  questions: json().notNull().$type<IQuestionData[]>(),
  generalScoring: integer("generalScoring"),
});
