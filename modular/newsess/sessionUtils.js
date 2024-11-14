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

/**
 * Generate a random 4-digit number as a string
 * @returns {string}
 */
export function generateRandom4DigitNumber() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

// Add other utility functions as needed
