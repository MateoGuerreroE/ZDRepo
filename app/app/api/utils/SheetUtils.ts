export function normalizeHeaders(headers: string[]): string[] {
  return headers.map((header) => {
    // Remove special characters and replace spaces with underscores
    return header
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .map((word, idx) =>
        idx === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join("");
  });
}

export function cleanDate(date: string): string | null {
  if (date === "N/A" || date === " ") {
    return null;
  }
  return date;
}
