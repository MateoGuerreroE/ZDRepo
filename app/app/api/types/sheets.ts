export interface IEducationData {
  institution: string | null;
  title: string | null;
  startDate: string | null;
  endDate: string | null;
}

export interface IExperienceData extends IEducationData {
  totalExperience: string | null;
  totalMonths: number | null;
}

export interface IQuestionData {
  question: string | null;
  answer: string | null;
}

export interface IRawCandidateData extends Record<string, string | null> {
  name: string;
  jobTitle: string;
  jobDepartment: string;
  jobLocation: string;
  headline: string | null;
  creationTime: string;
  stage: string;
  tags: string | null;
  source: string;
  type: string;
  summary: string | null;
  keywords: string | null;
  educations: string | null;
  experiences: string | null;
  skills: string | null;
  disqualified: string;
  disqualifiedAt: string | null;
  disqualificationCategory: string | null;
  disqualificationReason: string | null;
  disqualificationNote: string | null;
  question1: string | null;
  answer1: string | null;
  question2: string | null;
  answer2: string | null;
  question3: string | null;
  answer3: string | null;
  question4: string | null;
  answer4: string | null;
  question5: string | null;
  answer5: string | null;
  question6: string | null;
  answer6: string | null;
  question7: string | null;
  answer7: string | null;
}

export type NormalizedCandidateData = {
  candidateName: string;
  experience: IExperienceData[];
  education: IEducationData[];
  skills: string[];
  disqualified: boolean;
  questions: IQuestionData[];
};
