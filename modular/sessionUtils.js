// sessionUtils.js

/**
 * Get current date and time in US/EDT
 * @returns {string} - Formatted date and time
 */
export function getFriendlyDateTime() {
    return new Date().toLocaleString('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}
