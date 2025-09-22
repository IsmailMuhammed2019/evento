// Nigerian timezone utilities
export const NIGERIAN_TIMEZONE = 'Africa/Lagos';

/**
 * Get current date in Nigerian timezone
 * @returns Date string in YYYY-MM-DD format
 */
export function getNigerianDate(): string {
  const now = new Date();
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: NIGERIAN_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now);
}

/**
 * Get tomorrow's date in Nigerian timezone
 * @returns Date string in YYYY-MM-DD format
 */
export function getNigerianTomorrow(): string {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: NIGERIAN_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(tomorrow);
}

/**
 * Get current time in Nigerian timezone
 * @returns Time string in HH:MM:SS format
 */
export function getNigerianTime(): string {
  const now = new Date();
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: NIGERIAN_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(now);
}

/**
 * Format date for display in Nigerian timezone
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Formatted date string
 */
export function formatNigerianDate(dateString: string): string {
  try {
    if (!dateString) return 'N/A';
    const date = new Date(dateString + 'T00:00:00');
    if (isNaN(date.getTime())) return 'Invalid Date';
    return new Intl.DateTimeFormat('en-US', {
      timeZone: NIGERIAN_TIMEZONE,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    }).format(date);
  } catch (error) {
    return 'Invalid Date';
  }
}

/**
 * Check if a date is today in Nigerian timezone
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns boolean
 */
export function isTodayInNigeria(dateString: string): boolean {
  return dateString === getNigerianDate();
}

/**
 * Check if a date is tomorrow in Nigerian timezone
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns boolean
 */
export function isTomorrowInNigeria(dateString: string): boolean {
  return dateString === getNigerianTomorrow();
}

/**
 * Check if a date is today or tomorrow in Nigerian timezone
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns boolean
 */
export function isTodayOrTomorrowInNigeria(dateString: string): boolean {
  return isTodayInNigeria(dateString) || isTomorrowInNigeria(dateString);
}
