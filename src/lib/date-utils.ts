/**
 * Date utility functions for plan hierarchy sync
 * Implements ISO 8601 date and week number standards
 */

/**
 * Get ISO 8601 week ID for a given date
 * Format: "YYYY-Www" (e.g., "2024-W03")
 * Week starts on Monday and ends on Sunday
 * 
 * @param date - The date to get the week ID for
 * @returns ISO 8601 week ID string
 */
export function getWeekId(date: Date): string {
  // Create a copy to avoid mutating the original date
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  
  // Get first day of year
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  
  // Calculate full weeks to nearest Thursday
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  
  // Return ISO week number with leading zero
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/**
 * Get month ID for a given date
 * Format: "YYYY-MM" (e.g., "2024-01")
 * 
 * @param date - The date to get the month ID for
 * @returns Month ID string
 */
export function getMonthId(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get the start date (Monday) of a week from its week ID
 * 
 * @param weekId - ISO 8601 week ID (e.g., "2024-W03")
 * @returns Date object representing Monday of that week
 */
export function getWeekStartDate(weekId: string): Date {
  const [yearStr, weekStr] = weekId.split('-W');
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);
  
  // January 4th is always in week 1
  const jan4 = new Date(Date.UTC(year, 0, 4));
  
  // Get the Monday of week 1
  const dayNum = jan4.getUTCDay() || 7;
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - dayNum + 1);
  
  // Add weeks to get to the target week
  const targetMonday = new Date(week1Monday);
  targetMonday.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7);
  
  return targetMonday;
}

/**
 * Get the end date (Sunday) of a week from its week ID
 * 
 * @param weekId - ISO 8601 week ID (e.g., "2024-W03")
 * @returns Date object representing Sunday of that week
 */
export function getWeekEndDate(weekId: string): Date {
  const monday = getWeekStartDate(weekId);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return sunday;
}

/**
 * Parse an ISO 8601 date string to a Date object
 * Format: "YYYY-MM-DD"
 * 
 * @param dateString - ISO 8601 date string
 * @returns Date object
 * @throws Error if date format is invalid
 */
export function parseDate(dateString: string): Date {
  // Validate format
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!iso8601Regex.test(dateString)) {
    throw new Error(`Invalid date format: ${dateString}. Expected ISO 8601 format (YYYY-MM-DD)`);
  }
  
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Validate date components
  if (month < 1 || month > 12) {
    throw new Error(`Invalid month: ${month}. Must be between 1 and 12`);
  }
  
  if (day < 1 || day > 31) {
    throw new Error(`Invalid day: ${day}. Must be between 1 and 31`);
  }
  
  // Create date and validate it's a real date
  const date = new Date(year, month - 1, day);
  
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new Error(`Invalid date: ${dateString}. Date does not exist`);
  }
  
  return date;
}

/**
 * Format a Date object to ISO 8601 date string
 * Format: "YYYY-MM-DD"
 * 
 * @param date - Date object to format
 * @returns ISO 8601 date string
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
