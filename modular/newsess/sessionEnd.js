// sessionEnd.js

import { sendSessionWebhook } from './sessionWebhook.js'; // Import the webhook function

const sessionEnd = {
    /**
     * Handle user logout process
     */
    async handleLogout() {
        // Capture the required data before clearing
        const customerEmail = window.fx_customer_em;
        const customerId = window.fx_customerId;
        const sessionState = window.userSession?.sessionState || {};
        const sessionId = window.userSession?.sessionId || 'unknown';
        const logoutDate = new Date().toLocaleString('en-US', { timeZone: 'America/New_York', hour12: false });

        // Construct the payload for the webhook
        const payload = {
            customerEmail,
            customerId,
            sessionId,
            logoutDate,
            sessionState
        };

        console.log('[sessionEnd] Preparing to send session data to webhook:', payload);

        // Send session data via webhook before clearing authentication data
        await sendSessionWebhook(payload);

        // Clear existing authentication data
        this.clearAuthenticationData();

        // Create new sport URL
        this.createNewSporturl(customerEmail, customerId);

        // Update user state to unauthenticated
        this.updateUserStateAfterAuth(false);

        // Perform any additional cleanup or state updates
        if (typeof window.sessionAssist === 'function') {
            window.sessionAssist();
        }

        // Redirect to homepage or login page
        window.location.href = '/';
    },

    /**
     * Clear authentication data by removing specific cookies and localStorage items
     */
    clearAuthenticationData() {
        const cookiesToRemove = [
            'fx_customer', 'fx_customerId', 'fx_customer_em', 'fx_customer_jwt', 'fx_customer_sso',
            'sporturl', 'fx_customerPin', 'fx_customerLastVisit', 'fx_customerEm',
            'fx_customerEmail', 'fc_customer_id', 'fc_auth_token'
        ];
        
        cookiesToRemove.forEach((cookieName) => {
            // Remove each cookie by setting it to expire in the past with the same path, Secure, and SameSite attributes
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; Secure; SameSite=Strict;`;
            console.log(`[sessionEnd] Attempted to remove cookie: ${cookieName}`);
        });

        const localStorageItems = [
            'fx_customerEmail', 'fx_customerId', 'userAttributesProcessed',
            'userZoom', 'userTransactions', 'userSubscriptions',
            'userState', 'userMeta', 'userSession'
        ];

        localStorageItems.forEach(item => {
            localStorage.removeItem(item);
            console.log(`[sessionEnd] Removed localStorage item: ${item}`);
        });

        // Clear global variables
        window.fx_customerId = null;
        window.fx_customer_em = null;
        window.fx_customerEmail = null;
        window.fx_customerEm = null;
        
        // Clear userMeta and userSession
        window.userMeta = {};
        window.userSession = {};

        console.log('[sessionEnd] Authentication data cleared.');
    },

    /**
     * Create a new Sport URL and set it as a cookie
     * @param {string} customerEmail - Customer's email
     * @param {string} customerId - Customer's ID
     */
    createNewSporturl(customerEmail, customerId) {
        if (customerEmail && customerId) {
            const sporturl = this.generateSporturl(customerEmail, customerId);
            const encodedSporturl = encodeURIComponent(sporturl); // Single encoding
            this.setCookie('sporturl', encodedSporturl, 180);
            window.userMeta = window.userMeta || {};
            window.userMeta.sporturl = encodedSporturl;

            console.log('[sessionEnd] New sporturl cookie created before logout.');
        } else {
            console.log('[sessionEnd] No sporturl created: customerEmail or customerId not defined.');
        }
    },

    /**
     * Generate a Sport URL based on customer email and ID
     * @param {string} customerEmail - Customer's email
     * @param {string} customerId - Customer's ID
     * @returns {string} - Generated Sport URL
     */
    generateSporturl(customerEmail, customerId) {
        const randomPin = this.generateRandom4DigitNumber();
        const currentTimestamp = Date.now().toString();
        return `https://www.sportdogfood.com/login?em=${encodeURIComponent(customerEmail)}&cid=${encodeURIComponent(customerId)}&pn=${encodeURIComponent(randomPin)}&ts=${encodeURIComponent(currentTimestamp)}`;
    },

    /**
     * Generate a random 4-digit number
     * @returns {string} - 4-digit random number as a string
     */
    generateRandom4DigitNumber() {
        return Math.floor(1000 + Math.random() * 9000).toString();
    },

    /**
     * Set a cookie with given name, value, and expiration in days
     * @param {string} name - Cookie name
     * @param {string} value - Cookie value
     * @param {number} days - Expiration in days
     */
    setCookie(name, value, days) {
        const expires = days ? '; expires=' + new Date(Date.now() + days * 864e5).toUTCString() : '';
        document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/; Secure; SameSite=Strict`;
        console.log(`[sessionEnd] Cookie set: ${name}=${value}; expires=${expires}`);
    },

    /**
     * Update user state after authentication attempt
     * @param {boolean} success - Authentication success status
     */
    updateUserStateAfterAuth(success) {
        if (success) {
            window.userState.state = 'customer';
            window.userState.subState = 'user-logged-in';
            window.userAuth = 'authenticated';
            // Assume pushPagesense is a global function or part of another module
            if (typeof pushPagesense === 'function') {
                pushPagesense('user-auth', window.fx_customerId || "");
            }
        } else {
            window.userState.state = 'visitor';
            window.userState.subState = '';
            window.userAuth = '';
        }

        // Dispatch userStateChanged event to inform other modules/UI components
        const event = new CustomEvent('userStateChanged', { detail: window.userState });
        window.dispatchEvent(event);

        // Save updated state to localStorage
        this.saveToLocalStorage();

        console.log('[sessionEnd] User State Updated after authentication:', window.userState);

        // Update UI elements based on authentication status
        this.updateButtonState();
        this.updateStatusDiv();
    },

    /**
     * Update button visibility based on userState
     */
    updateButtonState() {
        const loginButton = document.getElementById('login-button');
        const logoutButton = document.getElementById('logout-button');

        if (window.userAuth === 'authenticated') {
            if (loginButton) loginButton.style.display = 'none';
            if (logoutButton) logoutButton.style.display = 'inline';
        } else {
            if (loginButton) loginButton.style.display = 'inline';
            if (logoutButton) logoutButton.style.display = 'none';
        }
    },

    /**
     * Update the status div with current user state
     */
    updateStatusDiv() {
        const statusDiv = document.getElementById('status-div');
        if (!statusDiv) {
            console.warn('[sessionEnd] Status div not found.');
            return;
        }
        statusDiv.innerHTML = `User State: ${window.userState.state}, SubState: ${window.userState.subState}`;
    }
};

export default sessionEnd;
