import { nanoid } from "nanoid";
import { IScoreResult, RawScoring, ScoringInfo } from "../types/scoring";
import { Candidate } from "../types";

export class DomainDataProcessor {
  static processScores(
    candidates: Candidate[],
    scores: RawScoring[]
  ): IScoreResult[] {
    const scoringInfo = this.getScoringInfo(scores);
    const topScores = this.getTopScores(scoringInfo);
    return topScores.map((score) => {
      const candidate = candidates.find(
        (c) => c.candidateId === score.candidateId
      );
      return {
        ...score,
        candidateName: candidate?.candidateName || "Unknown",
      };
    });
  }

  private static getScoringInfo(scores: RawScoring[]): ScoringInfo[] {
    return scores.map((rscore) => {
      const { candidateId, highlights, ...scoringDetails } = rscore;
      const totalScore = Object.values(scoringDetails).reduce((acc, next) => {
        return acc + next;
      }, 0);

      return {
        candidateId,
        scoringId: nanoid(),
        generalScoring: totalScore,
        scoredAt: new Date(),
        scoringDetails,
        highlights,
      };
    });
  }

  private static getTopScores(scores: ScoringInfo[]) {
    const sortedScores = scores.sort(
      (a, b) => b.generalScoring - a.generalScoring
    );
    return sortedScores.slice(0, 30);
  }
}
