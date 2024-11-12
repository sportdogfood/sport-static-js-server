// sessionManager.js
import { loadGeoLocationData } from './geo.js';
import { getCookies, saveToLocalStorage, getFriendlyDateTime, generateRandom4DigitNumber, createSporturl } from './utils.js';
import { evaluateUser } from './user.js';
import { handleLogout as sessionHandleLogout, sendSessionWebhook } from './sessionManager.js'; // Recursive, needs adjustment

// To avoid circular dependencies, ensure that sessionManager.js does not import from itself.
// Thus, remove any such imports and define all functions within this module.

export let sessionTimer = null;
export let idleTimer = null;
export let sessionAssistIntervalId = null;
export let loggedOut = false; // Flag to indicate if the user has been logged out

/**
 * Initialize user data from cookies and update state
 */
export async function initializeUserData() {
    console.log('User data initialization started at:', getFriendlyDateTime());

    // Ensure FC is defined
    if (typeof FC === 'undefined') {
        console.error('FoxyCart (FC) library is not loaded.');
        return;
    }

    // This function is called when the FoxyCart library is loaded
    FC.onLoad = function () {
        // Wait until the FoxyCart client is ready
        FC.client.on('ready.done', async function () {
            // Step 1: Get fcsid from FoxyCart session
            if (FC.json && FC.json.session_id) {
                const fcsid = FC.json.session_id;
                console.log('Successfully retrieved fcsid:', fcsid);
                localStorage.setItem('fcsid', fcsid);
            } else {
                console.error('Failed to retrieve fcsid. FC.json.session_id is not available.');
                return; // Exit if fcsid could not be retrieved
            }

            // Step 2: Load Geolocation Data
            const geoData = await loadGeoLocationData();
            console.log('Geolocation data retrieved:', geoData);

            // Step 3: Get Cookies
            const cookies = getCookies();
            console.log('Cookies retrieved:', cookies);

            // Step 4: Check Local Storage and Window Location
            const initialLandingPage = window.location.href;
            console.log('Initial landing page:', initialLandingPage);

            const localStorageData = localStorage.getItem('userSession') ? JSON.parse(localStorage.getItem('userSession')) : null;
            console.log('Local storage data retrieved:', localStorageData);

            // Step 5: Initialize User State, User Meta, and User Session
            window.userMeta = {
                ...window.userMeta,
                lastUpdated: getFriendlyDateTime(),
                friendlyLastUpdated: getFriendlyDateTime(),
                fx_customerId: cookies['fx_customerId'] || null,
                fx_customer_em: cookies['fx_customer_em'] || null,
                geoData: geoData,
                initialLandingPage: initialLandingPage,
                // ... [other fx_customer variables]
            };

            window.userSession = {
                ...window.userSession,
                lastUpdated: getFriendlyDateTime(),
                sessionId: cookies['fcsid'] || 'anon',
                sessionState: {
                    ...window.userSession?.sessionState,
                    timeStarted: window.userSession?.sessionState?.timeStarted || getFriendlyDateTime(),
                    secondsSpent: window.userSession?.sessionState?.secondsSpent || 0,
                }
            };

            window.userState = {
                state: cookies['fx_customerId'] ? 'customer' : 'visitor',
                subState: '',
            };

            // Save to localStorage
            saveToLocalStorage();

            console.log("Final userMeta before updating state at:", getFriendlyDateTime(), window.userMeta);

            // Fire session start and update session state
            fireSessionStart();
            updateSessionState(window.userMeta);

            // Start session timer to track time spent
            startSessionTimer();

            // Start idle timer to track inactivity
            startIdleTimer();

            // Perform first session evaluation
            sessionFirstEvaluate();

            console.log('User data initialization completed at:', getFriendlyDateTime());
        });
    };
}

/**
 * Perform first evaluation of the session
 */
export function sessionFirstEvaluate() {
    console.log('Session-first evaluation started at:', getFriendlyDateTime());

    // Check if user has fx_customerId or other session-related data to identify them
    if (window.userMeta.fx_customerId) {
        // Returning customer logic
        window.userState.state = 'customer';
        window.userState.subState = 'returning';
        console.log('Returning customer detected:', window.userMeta.fx_customerId);

        // Trigger any actions specific to returning customers
        handleReturningCustomer();

    } else if (window.userMeta.geoData && window.userMeta.geoData.country) {
        // New user or visitor logic, can use geo data to personalize
        window.userState.state = 'visitor';
        window.userState.subState = 'new';
        console.log('New visitor detected based on geo data:', window.userMeta.geoData);

        // Trigger actions for new visitors, like a welcome message or promotional offer
        handleNewVisitor();

    } else {
        // If no identifiable customer or geo data is found, treat as an anonymous visitor
        window.userState.state = 'visitor';
        window.userState.subState = 'anonymous';
        console.log('Anonymous visitor detected.');
    }

    // Log the final user state
    console.log('User state after first evaluation:', window.userState);

    // Perform actions based on user state
    performUserStateActions();
}

function handleReturningCustomer() {
    // Implement logic for returning customers, such as:
    // - Showing personalized content
    // - Providing access to order history, favorites, etc.
    console.log('Executing logic for returning customer...');
}

function handleNewVisitor() {
    // Implement logic for new visitors, such as:
    // - Offering promotions
    // - Showing a welcome message
    console.log('Executing logic for new visitor...');
}

export function performUserStateActions() {
    if (window.userState.state === 'customer') {
        // Logic for authenticated/returning customer
        console.log('Performing actions for authenticated user...');
    } else if (window.userState.state === 'visitor') {
        // Logic for new/anonymous visitor
        console.log('Performing actions for visitor...');
    }
}

/**
 * Fire session start event
 */
export function fireSessionStart() {
    console.log('Session Started');
}

/**
 * Update session state with userMeta
 * @param {object} userMeta - User metadata
 */
export function updateSessionState(userMeta) {
    console.log('Session State Updated with userMeta:', userMeta);
}

/**
 * Start tracking session time
 */
export function startSessionTimer() {
    if (window.sessionTimer) {
        clearInterval(window.sessionTimer); // Clear any existing timer
    }

    // Start a new session timer to track time spent
    window.sessionTimer = setInterval(() => {
        // Increment the time spent on the session
        const currentTimeSpent = window.userSession.sessionState.secondsSpent || 0;
        window.userSession.sessionState.secondsSpent = currentTimeSpent + 1;

        // Update session state in sessionStorage
        sessionStorage.setItem('userSession', JSON.stringify(window.userSession));

        // Log the updated time spent for debugging
        console.log('Time spent on session:', window.userSession.sessionState.secondsSpent);
    }, 1000); // Update every second
}

/**
 * Start tracking idle time
 */
export function startIdleTimer() {
    // Clear any existing idle timer
    if (window.idleTimer) {
        clearTimeout(window.idleTimer);
    }

    // Set the idle timer to trigger after the specified idle limit
    window.idleTimer = setTimeout(() => {
        handleIdleTimeout();
    }, 10 * 60 * 1000); // 10 minutes of inactivity
}

/**
 * Reset idle timer on any user interaction
 */
export function resetIdleTimer() {
    if (!loggedOut) { // Only reset the timer if the user has not been logged out
        window.lastActivityTime = Date.now();
        startIdleTimer(); // Restart idle timer
        console.log('Idle timer reset due to user activity.');
    }
}

/**
 * Handle idle timeout (e.g., log out user or show a prompt)
 */
export function handleIdleTimeout() {
    console.log('User has been idle for too long, logging out...');

    // Trigger logout
    handleLogout(); // Defined below
}

/**
 * Handle user logout and clear session data
 */
export function handleLogout() {
    console.log('Logging out user and clearing session data.');

    // Capture the required data before clearing
    const customerEmail = window.fx_customer_em;
    const customerId = window.fx_customerId;

    // Send session data via webhook before clearing authentication data
    sendSessionWebhook();

    // Clear session data from sessionStorage and localStorage
    sessionStorage.removeItem('fcsid');
    sessionStorage.removeItem('userSession');
    sessionStorage.removeItem('userMeta');
    sessionStorage.removeItem('geoFetched');
    sessionStorage.removeItem('cookiesFetched');

    // Clear session-related flags
    window.userSession = {};
    window.userMeta = {};
    window.userState = { state: 'visitor', subState: '' };
    window.userAuth = "";

    // Clear idle and session timers
    clearInterval(window.sessionTimer); // Stop session timer
    clearTimeout(window.idleTimer); // Stop idle timer

    // Clear authentication cookies and set a new sporturl
    clearAuthenticationData(); // From utils.js
    createSporturl(customerEmail, customerId); // From utils.js

    // Update user state after authentication
    updateUserStateAfterAuth(false); // From utils.js

    // Optionally, redirect the user or show a confirmation message
    window.location.href = '/'; // Redirect to home page or login page after logout

    console.log('Session data cleared, user logged out.');
}

/**
 * Send session data to webhook upon logout
 */
export function sendSessionWebhook() {
    // Only proceed if user is authenticated
    if (window.userAuth !== 'authenticated') {
        console.log('[SessionManager] User is not authenticated. Skipping webhook.');
        return;
    }

    try {
        // Retrieve the user session data
        const sessionObject = window.userSession || {};
        const fx_customerEmail = window.fx_customer_em || localStorage.getItem('fx_customerEmail');
        const fx_customerId = window.fx_customerId || localStorage.getItem('fx_customerId');
        const logoutDate = new Date().toLocaleString('en-US', { timeZone: 'America/New_York', hour12: false });

        // Construct the payload for the webhook
        const payload = {
            ...sessionObject,
            logoutDate,
            fx_customerEmail,
            fx_customerId,
        };

        console.log('[SessionManager] Logging out with payload:', payload);

        // Send the payload to the webhook URL
        fetch('https://cat-heroku-proxy-51e72e8e9b26.herokuapp.com/proxy/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`[SessionManager] Network response was not ok (${response.status})`);
                }
                return response.json();
            })
            .then((data) => {
                console.log('[SessionManager] Webhook response:', data);
            })
            .catch((error) => {
                console.error('[SessionManager] Failed to send webhook:', error);
            });
    } catch (error) {
        console.error('[SessionManager] Error in sendSessionWebhook:', error);
    }
}

/**
 * Perform session assist operations
 */
export async function performSessionAssist() {
    console.log('Performing session assist operations...');
    const lastUpdated = getFriendlyDateTime();
    console.log(`Session Assist Last Updated: ${lastUpdated}`);

    // Update landingPage in userMeta
    window.userMeta = {
        ...window.userMeta,
        landingPage: window.location.href,
        lastUpdated: getFriendlyDateTime(),
        friendlyLastUpdated: getFriendlyDateTime(),
    };

    // Update session duration
    if (window.userSession.sessionState.timeStarted) {
        const startTime = new Date(window.userSession.sessionState.timeStarted).getTime();
        const currentTime = new Date().getTime();
        window.userSession.sessionState.secondsSpent = Math.floor((currentTime - startTime) / 1000);
    }

    // Save to localStorage
    saveToLocalStorage();

    console.log("Final userMeta before updating state:", window.userMeta);

    // Load geolocation data
    const geoData = await loadGeoLocationData();

    // Get cookies
    const cookies = getCookies();

    // Evaluate User
    evaluateUser(cookies, geoData);

    // Fire session start and update session state
    fireSessionStart();
    updateSessionState(window.userMeta);

    console.log('Session assist operations completed.');
}

/**
 * Start or restart session assist polling
 */
export function startSessionAssistPolling() {
    if (sessionAssistIntervalId !== null) {
        clearInterval(sessionAssistIntervalId);
    }
    sessionAssistIntervalId = setInterval(() => {
        performSessionAssist();
        // Optional function to check if the user is idle
    }, 300000); // 5 minutes
}

/**
 * Stop session assist polling
 */
export function stopSessionAssistPolling() {
    if (sessionAssistIntervalId !== null) {
        clearInterval(sessionAssistIntervalId);
        sessionAssistIntervalId = null;
    }
}

/**
 * Setup idle detection on user activity
 */
export function setupIdleDetection() {
    ['mousemove', 'keydown', 'scroll', 'click'].forEach(event => {
        document.addEventListener(event, resetIdleTimer);
    });

    // Handle page visibility change
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            console.log('Page is visible. Resetting idle timer.');
            resetIdleTimer();
        }
    });

    // Handle window focus and blur
    window.addEventListener('focus', () => {
        console.log('Window focused. Resetting idle timer.');
        resetIdleTimer();
    });
    window.addEventListener('blur', () => {
        console.log('Window blurred.');
    });
}
