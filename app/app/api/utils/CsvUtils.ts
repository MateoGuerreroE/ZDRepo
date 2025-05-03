/**
 * Normalizes headers from a spreadsheet by removing special characters and converting them to camelCase.
 * @param headers Array of strings representing the headers from a spreadsheet.
 * @returns A set of keys of type T, where T is the type of the data being processed.
 */
export function normalizeHeaders<T>(headers: string[]): (keyof T)[] {
  return headers.map((header) => {
    // Remove special characters and replace spaces with underscores
    return header
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .map((word, idx) =>
        idx === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join("") as keyof T;
  });
}

/** Nulls invalid or empty dates */
export function cleanDate(date: string): string | null {
  if (date === "N/A" || date === " ") {
    return null;
  }
  return date;
}

/**
 * Extracts the date range from a string and returns the start date, end date, and the remaining string.
 * String must contain date in parentheses, and dates must be separated by "to".
 * @param entry The string containing the date range.
 */
export function extractDate(entry: string): {
  startDate: string | null;
  endDate: string | null;
  output: string;
} {
  const matches = [...entry.matchAll(/\(([^)]+)\)/g)];
  if (matches.length) {
    const lastMatch = matches[matches.length - 1];
    return {
      startDate: cleanDate(lastMatch[1].split(" to ")[0] || " "),
      endDate: cleanDate(lastMatch[1].split(" to ")[1] || " "),
      output: entry.replace(lastMatch[0], "").trim(),
    };
  }
  return {
    startDate: null,
    endDate: null,
    output: entry.trim(),
  };
}

/**
 * Calculates the time period between two dates in months and years.
 * @param fromDate Date with format MM YYYY. In case null, It will nullify the totalExperience and months.
 * @param toDate Date with format MM YYYY. In case null, It will take the current date.
 * @returns totalExperience in format "X years Y months" and months in number.
 */
export function calculateTimePeriod(
  fromDate: string | null,
  toDate: string | null
): { totalExperience: string | null; months: number | null } {
  if (!fromDate) {
    return {
      totalExperience: null,
      months: null,
    };
  }

  const from = new Date(fromDate + " 1");
  const to = toDate ? new Date(toDate + " 1") : new Date();

  const years = to.getFullYear() - from.getFullYear();
  const months = to.getMonth() - from.getMonth();

  const totalMonths = years * 12 + months;
  if (totalMonths < 0) return { totalExperience: null, months: null };

  const totalYears = Math.floor(totalMonths / 12);

  const remainingMonths = ((totalMonths % 12) + 12) % 12;

  return {
    totalExperience: `${totalYears} years ${remainingMonths} months`,
    months: totalMonths,
  };
}

/**
 * Extracts the title and institution from a string.
 * String must contain "at" to separate the title and institution. e.g. "Software Engineer at XYZ University".
 *
 * @param baseString String containing the title and institution, separated by "at".
 * @returns Object containing the title and institution extracted from the string.
 *          If the title or institution is empty, it will be set to null.
 */
export function extractTitleAndInstitution(baseString: string): {
  title: string | null;
  institution: string | null;
} {
  const match = baseString.match(/\b(at)\b/i);
  if (!match || match.index === undefined) {
    return { title: null, institution: null };
  }

  const title = baseString.slice(0, match.index).trim();
  const institution = baseString.slice(match.index + match[0].length).trim();

  return {
    title: title.length ? title : null,
    institution: institution.length ? institution : null,
  };
}
