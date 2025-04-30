import { IRawCandidateData } from "../services/types/sheets";

export function normalizeHeaders(
  headers: string[]
): (keyof IRawCandidateData)[] {
  return headers.map((header) => {
    // Remove special characters and replace spaces with underscores
    return header
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .map((word, idx) =>
        idx === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join("") as keyof IRawCandidateData;
  });
}

export function cleanDate(date: string): string | null {
  if (date === "N/A" || date === " ") {
    return null;
  }
  return date;
}
