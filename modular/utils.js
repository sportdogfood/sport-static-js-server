// utils.js

/**
 * Get current date and time in US/EDT
 * @returns {string} - Formatted date and time
 */
export function getLastUpdated() {
    return new Date().toLocaleString('en-US', {
        timeZone: 'America/New_York',
    });
}

/**
 * Get friendly date and time in US/EDT format
 * @returns {string} - Formatted date and time
 */
export function getFriendlyDateTime() {
    const options = {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    return new Date().toLocaleString('en-US', options);
}

/**
 * Get all cookies as an object
 * @returns {object} - Parsed cookies
 */
export function getCookies() {
    const cookies = {};
    document.cookie.split(';').forEach(function (cookie) {
        const [name, value] = cookie.trim().split('=');
        cookies[name] = decodeURIComponent(value);
    });
    console.log("Current cookies:", cookies);
    return cookies;
}

/**
 * Generate a random 4-digit number
 * @returns {string} - 4-digit random number as a string
 */
export function generateRandom4DigitNumber() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Generate a Sport URL based on customer email and ID
 * @param {string} customerEmail - Customer's email
 * @param {string} customerId - Customer's ID
 * @returns {string} - Generated Sport URL
 */
export function generateSporturl(customerEmail, customerId) {
    const randomPin = generateRandom4DigitNumber();
    const currentTimestamp = Date.now().toString();
    return `https://www.sportdogfood.com/login?em=${encodeURIComponent(customerEmail)}&cid=${encodeURIComponent(customerId)}&pn=${encodeURIComponent(randomPin)}&ts=${encodeURIComponent(currentTimestamp)}`;
}

/**
 * Set a cookie with given name, value, and expiration in days
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {number} days - Expiration in days
 */
export function setCookie(name, value, days) {
    const expires = days ? '; expires=' + new Date(Date.now() + days * 864e5).toUTCString() : '';
    document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/; Secure; SameSite=Strict`;
    console.log(`Cookie set: ${name}=${value}; expires=${expires}`);
}

/**
 * Clear authentication data by removing specific cookies and localStorage items
 */
export function clearAuthenticationData() {
    const cookiesToRemove = [
        'fx_customer', 'fx_customerId', 'fx_customer_em', 'fx_customer_jwt', 'fx_customer_sso',
        'sporturl', 'fx_customerPin', 'fx_customerLastVisit', 'fx_customerEm',
        'fx_customerEmail', 'fc_customer_id', 'fc_auth_token'
    ];

    cookiesToRemove.forEach((cookieName) => {
        // Remove each cookie by setting it to expire in the past with the same path, Secure, and SameSite attributes
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; Secure; SameSite=Strict;`;
        console.log(`Attempted to remove cookie: ${cookieName}`);
    });

    const localStorageItems = [
        'fx_customerEmail', 'fx_customerId', 'userAttributesProcessed',
        'userZoom', 'userTransactions', 'userSubscriptions',
        'userState', 'userMeta', 'userSession'
    ];

    localStorageItems.forEach(item => {
        localStorage.removeItem(item);
        console.log(`Removed localStorage item: ${item}`);
    });

    // Clear global variables
    window.fx_customerId = null;
    window.fx_customer_em = null;
    window.fx_customerEmail = null;
    window.fx_customerEm = null;

    // Clear userMeta and userSession
    window.userMeta = {};
    window.userSession = {};

    console.log('Authentication data cleared.');
}

/**
 * Save the current state to localStorage
 */
export function saveToLocalStorage() {
    localStorage.setItem('userMeta', JSON.stringify(window.userMeta));
    localStorage.setItem('userState', JSON.stringify(window.userState));
    localStorage.setItem('userSession', JSON.stringify(window.userSession));
    localStorage.setItem('fx_customerId', window.fx_customerId || '');
    localStorage.setItem('fx_customer_em', window.fx_customer_em || '');
    console.log("State saved to localStorage:", {
        userMeta: window.userMeta,
        userState: window.userState,
        userSession: window.userSession,
        fx_customerId: window.fx_customerId,
        fx_customer_em: window.fx_customer_em
    });
}
