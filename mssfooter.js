/* Last Updated: November 8, 2024, 11:23 AM EDT 1007*/

// ============================
// Global Variable Declarations
// ============================
window.userMeta = {};
window.userState = { state: 'visitor', subState: '' };
window.userSession = {
    sessionState: {
        timeStarted: getLastUpdated(),
        secondsSpent: 0
    }
};
window.userAuth = "";
window.geoDataFetched = false;
window.customerZoomInitialized = false;
window.geoDataFetched = false;

let sessionAssistIntervalId = null;
let idleTimeoutId = null;
let lastActivityTime = Date.now();
let idleLimit = 10 * 60 * 1000; // Set idle limit to 10 minutes (adjust as needed)
let idleCheckInterval;
let loggedOut = false; // Flag to indicate if the user has been logged out


// ============================
// Utility Functions
// ============================



/**
 * Get current date and time in US/EDT
 * @returns {string} - Formatted date and time
 */
function getLastUpdated() {
    return new Date().toLocaleString('en-US', {
        timeZone: 'America/New_York',
    });
}

/**
 * Load geolocation data via fetch API
 * @returns {object|null} - Geolocation data or null on failure
 */


// Function to Load Geolocation Data
async function loadGeoLocationData() {
    // Check if geolocation data is already fetched and available in userMeta
    if (window.geoDataFetched && window.userMeta?.geoData) {
        console.log("Geolocation data already fetched.");
        return window.userMeta.geoData; // Return cached geoData
    }

    try {
        const response = await fetch('https://ipv4.geojs.io/v1/ip/geo.json');
        const json = await response.json();
        console.log("Geolocation data fetched successfully:", json);

        // Construct geoData object with the necessary fields
        const geoData = {
            ip: json.ip,
            country: json.country,
            region: json.region,
            city: json.city,
            timezone: json.timezone,
        };

        // Ensure userMeta is initialized
        window.userMeta = window.userMeta || {};
        window.userMeta.geoData = geoData; // Store in userMeta
        window.geoDataFetched = true;      // Update the flag

        return geoData;
    } catch (error) {
        console.error("Geolocation fetch failed:", error);
        return null;
    }
}


/** 	
 * Update the status div with current user state
 */
function updateStatusDiv() {
    const statusDiv = document.getElementById('status-div');
    if (!statusDiv) {
        console.warn('Status div not found.');
        return;
    }
    statusDiv.innerHTML = `User State: ${window.userState.state}, SubState: ${window.userState.subState}`;
}

/**
 * Get all cookies as an object
 * @returns {object} - Parsed cookies
 */
function getCookies() {
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
function generateRandom4DigitNumber() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Generate a Sport URL based on customer email and ID
 * @param {string} customerEmail - Customer's email
 * @param {string} customerId - Customer's ID
 * @returns {string} - Generated Sport URL
 */
function generateSporturl(customerEmail, customerId) {
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
function setCookie(name, value, days) {
    const expires = days ? '; expires=' + new Date(Date.now() + days * 864e5).toUTCString() : '';
    document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/; Secure; SameSite=Strict`;
    console.log(`Cookie set: ${name}=${value}; expires=${expires}`);
}

/**
 * Clear authentication data by removing specific cookies and localStorage items
 */
function clearAuthenticationData() {
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
 * Create a new Sport URL and set it as a cookie
 * @param {string} customerEmail - Customer's email
 * @param {string} customerId - Customer's ID
 */
function createNewSporturl(customerEmail, customerId) {
    if (customerEmail && customerId) {
        const sporturl = generateSporturl(customerEmail, customerId);
        const encodedSporturl = encodeURIComponent(sporturl); // Single encoding
        setCookie('sporturl', encodedSporturl, 180);
        window.userMeta = window.userMeta || {};
        window.userMeta.sporturl = encodedSporturl;

        console.log('New sporturl cookie created before logout.');
    } else {
        console.log('No sporturl created: customerEmail or customerId not defined.');
    }
}


/**
 * Handle user logout process
 */
function handleLogout() {
    // Capture the required data before clearing
    const customerEmail = window.fx_customer_em;
    const customerId = window.fx_customerId;

    // Send session data via webhook before clearing authentication data
    sendSessionWebhook();

    clearAuthenticationData(); // Clear existing cookies including 'sporturl'

    // Use captured data to create new sport URL
    createNewSporturl(customerEmail, customerId); // Create new 'sporturl' cookie with updated timestamp and expiration

    updateUserStateAfterAuth(false);

    if (typeof window.sessionAssist === 'function') {
        window.sessionAssist();
    }

    window.location.href = '/';
}

/**
 * Update user state after authentication attempt
 * @param {boolean} success - Authentication success status
 */
function updateUserStateAfterAuth(success) {
    if (success) {
        window.userState.state = 'customer';
        window.userState.subState = 'user-logged-in';
        window.userAuth = 'authenticated';
        pushPagesense('user-auth', window.fx_customerId || "");
    } else {
        window.userState.state = 'visitor';
        window.userState.subState = '';
        window.userAuth = '';
    }

    const event = new CustomEvent('userStateChanged', { detail: window.userState });
    window.dispatchEvent(event);

    saveToLocalStorage();

    console.log('User State Updated after authentication:', window.userState);

    updateButtonState();
    updateStatusDiv();
}
/**
 * Update button visibility based on userState
 */
function updateButtonState() {
    const loginButton = document.getElementById('login-button');
    const logoutButton = document.getElementById('logout-button');

    if (window.userAuth === 'authenticated') {
        if (loginButton) loginButton.style.display = 'none';
        if (logoutButton) logoutButton.style.display = 'inline';
    } else {
        if (loginButton) loginButton.style.display = 'inline';
        if (logoutButton) logoutButton.style.display = 'none';
    }
}

/**
 * Handle session events based on userState
 * @param {object} userState - Current user state
 */
function handleSessionEvents(userState) {
    if (window.userAuth === 'authenticated') {
        console.log('User is authenticated, loading additional data.');
        loadAuthenticatedUserScripts();
    } else {
        console.log('User is not authenticated. Not loading authenticated scripts.');
        // Optionally, unload scripts if needed
    }
}

 /**
     * Load additional scripts for authenticated users
     */
 function loadAuthenticatedUserScripts() {
    if (window.userAuth !== 'authenticated') {
        console.log('User is not authenticated. Aborting script loading.');
        return;
    }

    // Load fxcustomerzoom.js first
    const customerZoomScriptInfo = {
        src: 'https://sportdogfood.github.io/sport-static-js-server/fxcustomerzoom.js',
        id: 'fxcustomerzoom',
        initFunction: 'customerzoomInit'
    };

    function loadScript(scriptInfo, onSuccess, onFailure) {
        if (!document.getElementById(scriptInfo.id)) {
            const scriptElement = document.createElement('script');
            scriptElement.src = scriptInfo.src;
            scriptElement.id = scriptInfo.id;

            scriptElement.onload = () => {
                console.log(`${scriptInfo.id}.js loaded successfully`);
                if (typeof window[scriptInfo.initFunction] === 'function') {
                    console.log(`Executing ${scriptInfo.initFunction} function.`);
                    try {
                        window[scriptInfo.initFunction]();
                        if (onSuccess) onSuccess();
                    } catch (error) {
                        console.error(`${scriptInfo.initFunction} function failed:`, error);
                        if (onFailure) onFailure();
                    }
                } else {
                    console.error(`${scriptInfo.initFunction} function not found in ${scriptInfo.id}.js.`);
                    if (onFailure) onFailure();
                }
            };

            scriptElement.onerror = () => {
                console.error(`Failed to load ${scriptInfo.id}.js`);
                if (onFailure) onFailure();
            };

            document.body.appendChild(scriptElement);
        } else {
            console.log(`${scriptInfo.id}.js is already loaded`);
            if (typeof window[scriptInfo.initFunction] === 'function') {
                console.log(`Re-executing ${scriptInfo.initFunction} since ${scriptInfo.id}.js is already loaded.`);
                try {
                    window[scriptInfo.initFunction]();
                    if (onSuccess) onSuccess();
                } catch (error) {
                    console.error(`${scriptInfo.initFunction} function failed:`, error);
                    if (onFailure) onFailure();
                }
            } else {
                console.warn(`${scriptInfo.initFunction} function not found even though the script is loaded.`);
                if (onFailure) onFailure();
            }
        }
    }

    // Load the other scripts after customerzoomInit has successfully executed
    function loadOtherScripts() {
        const otherScriptsToLoad = [
            { src: 'https://sportdogfood.github.io/sport-static-js-server/fxsubscriptions.js', id: 'fxsubscriptions', initFunction: 'subscriptionsInit' },
            { src: 'https://sportdogfood.github.io/sport-static-js-server/fxtransactions.js', id: 'fxtransactions', initFunction: 'transactionsInit' },
            { src: 'https://sportdogfood.github.io/sport-static-js-server/fxattributes.js', id: 'fxattributes', initFunction: 'attributesInit' }
        ];

        otherScriptsToLoad.forEach(scriptInfo => {
            loadScript(scriptInfo);
        });
    }

    // Load customerzoom.js and then load other scripts upon successful initialization
    loadScript(customerZoomScriptInfo, loadOtherScripts, function() {
        console.error('customerzoomInit failed or script did not load, not loading other scripts.');
    });
}

/**
 * Fire session start event
 */
function fireSessionStart() {
    console.log('Session Started');
}

/**
 * Update session state with userMeta
 * @param {object} userMeta - User metadata
 */
function updateSessionState(userMeta) {
    console.log('Session State Updated with userMeta:', userMeta);
}

/**
 * Save the current state to localStorage
 */
function saveToLocalStorage() {
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

/**
 * Evaluate user based on cookies, localStorage, and geolocation data
 * @param {object} cookies - Parsed cookies
 * @param {object} geoData - Geolocation data
 */
function evaluateUser(cookies, geoData) {
    console.log('Evaluating user...');

    // Update window.userMeta with data from cookies
    window.userMeta = {
        ...window.userMeta,
        lastUpdated: getLastUpdated(),
        fx_customerId: cookies['fx_customerId'] || null,
        fx_customer_em: cookies['fx_customer_em'] || null,
        // Add other cookie data as needed
    };

    // Update window.userMeta with geolocation data
    if (geoData) {
        window.userMeta.geoData = geoData;
    }

    // Determine user authentication status
    if (cookies['fx_customer_sso'] && cookies['fx_customerId']) {
        window.userAuth = 'authenticated';
        window.userState.state = 'customer';
        window.userState.subState = 'user-logged-in';
    } else {
        window.userAuth = '';
        window.userState.state = 'visitor';
        window.userState.subState = '';
    }

    // Dispatch userStateChanged event
    const event = new CustomEvent('userStateChanged', { detail: window.userState });
    window.dispatchEvent(event);

    console.log('User evaluation completed:', window.userState, window.userAuth);
}

/**
 * Initialize user data from cookies and update state
 */

// Ensure FC is initialized properly before use
var FC = FC || {};
let is_subscription_modification;

// Function to get friendly date/time in US/EDT format
function getFriendlyDateTime() {
    const options = { timeZone: 'America/New_York', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    return new Date().toLocaleString('en-US', options);
}

// Modified async function to initialize user data with delays and logging
function initializeUserData() {
    console.log('User data initialization started at:', getFriendlyDateTime());

    // This function is called when the FoxyCart library is loaded
    FC.onLoad = function () {
        // Wait until the FoxyCart client is ready
        FC.client.on('ready.done', async function () {
            // This code runs after the FoxyCart client has fully loaded

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

            console.log('User data initialization completed at:', getFriendlyDateTime());
        });
    };
}

// Calling the initializeUserData function
initializeUserData();


/**
 * Refresh geolocation data by resetting the flag and fetching again
 */
async function refreshGeoLocationData() {
    window.geoDataFetched = false; // Reset the flag
    const geoData = await loadGeoLocationData();
    console.log("Geolocation data refreshed:", geoData);
    window.userMeta.geoData = geoData;
    saveToLocalStorage();
}

/**
 * Perform session assist operations
 */
async function performSessionAssist() {
    console.log('Performing session assist operations...');
    const lastUpdated = getLastUpdated();
    console.log(`Session Assist Last Updated: ${lastUpdated}`);

    // Update landingPage in userMeta
    window.userMeta = {
        ...window.userMeta,
        landingPage: window.location.href,
        lastUpdated: getLastUpdated(),
        friendlyLastUpdated: getLastUpdated(),
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

// Function to Load External evaluateCustomerState Script
function loadEvaluateCustomerStateScript() {
    if (!document.getElementById('evaluatecustomerstate-script') && !window.evaluateCustomerStateLoading) {
        window.evaluateCustomerStateLoading = true; // Flag to prevent multiple loading attempts

        const scriptElement = document.createElement('script');
        scriptElement.src = "https://sportdogfood.github.io/sport-static-js-server/evaluatecustomerstate.js";
        scriptElement.id = 'evaluatecustomerstate-script';
        scriptElement.async = true;

        scriptElement.onload = function () {
            console.log("EvaluateCustomerState script loaded successfully.");
            window.evaluateCustomerStateLoaded = true; // Flag to indicate the script has been loaded
            window.evaluateCustomerStateLoading = false;
        };

        scriptElement.onerror = function () {
            console.error("Failed to load EvaluateCustomerState script.");
            window.evaluateCustomerStateLoading = false;
        };

        document.body.appendChild(scriptElement);
        console.log("Attempting to load EvaluateCustomerState script dynamically.");
    } else {
        console.log("EvaluateCustomerState script is already loading or has been loaded.");
    }
}

// Modified Function to Load External PageSense Script
function loadPageSenseScript() {
    // Check if the script is already loaded or if there is an ongoing attempt to load it
    if (!document.getElementById('pagesense-script') && !window.pagesenseScriptLoading) {
        window.pagesenseScriptLoading = true; // Flag to prevent multiple loading attempts

        const scriptElement = document.createElement('script');
        scriptElement.src = "https://sportdogfood.github.io/sport-static-js-server/session-pagesense.js";
        scriptElement.id = 'pagesense-script';
        scriptElement.async = true;

        scriptElement.onload = function () {
            console.log("PageSense script loaded successfully from session-pagesense.js.");
            window.pagesenseScriptLoaded = true; // Flag to indicate the script has been loaded
            window.pagesenseScriptLoading = false;
        };

        scriptElement.onerror = function () {
            console.error("Failed to load PageSense script from session-pagesense.js.");
            window.pagesenseScriptLoading = false;
        };

        document.body.appendChild(scriptElement);
        console.log("Attempting to load PageSense script dynamically from session-pagesense.js.");
    } else {
        console.log("PageSense script is already loading or has been loaded.");
    }
}

function evaluateCustomerWhenScriptReady(fx_customerId, sessionState, userMeta) {
    if (window.evaluateCustomerStateLoaded) {
        evaluateCustomerState(fx_customerId, sessionState, userMeta);
    } else {
        // Retry after a short delay if script is not yet loaded
        console.warn("EvaluateCustomerState script not yet loaded. Retrying shortly...");
        setTimeout(() => evaluateCustomerWhenScriptReady(fx_customerId, sessionState, userMeta), 100); // Retry in 100ms
    }
}

// Commented out reference to undefined postAuthenticationWorkflow


/**
 * Check if the user is idle and handle accordingly
 */
function checkIdleState() {
    // Function to check if the user is idle
    // Since idle detection is already handled via resetIdleTimer and setupIdleDetection,
    // this function is included to prevent errors and can be expanded if needed
    console.log('Checking idle state...');
    // Additional idle state checks can be added here
}

// Refresh geolocation data on button click
document.getElementById('refresh-geo-button').addEventListener('click', refreshGeoLocationData);

// ============================
// Event Listeners
// ============================

/**
 * Handle user authentication state changes
 * @param {object} userState - Current user state
 */
window.addEventListener('userStateChanged', handleUserStateChange);

function handleUserStateChange(event) {
    const userState = event.detail;
    console.log('User state changed:', userState);
    handleSessionEvents(userState);
}

// ============================
// Session Auth Logic
// ============================
document.addEventListener('DOMContentLoaded', function () {
    const loginButton = document.getElementById('login-button');
    const logoutButton = document.getElementById('logout-button');
    const modalOverlay = document.getElementById('modalOverlay');
    const modalContent = document.getElementById('modalContent');
    const closeModalButton = document.getElementById('closeModal');
    const togglePasswordButton = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('passwordInput');
    const authButton = document.getElementById('auth-button');

    // Open the modal when login button is clicked
    if (loginButton && modalOverlay) {
        loginButton.addEventListener('click', () => {
            modalOverlay.classList.add('active');
            console.log('Login button clicked. Modal opened.');
        });
        console.log('Login button event listener added.');
    } else {
        console.warn('Login button or modalOverlay not found.');
    }

    // Close the modal when close button is clicked
    if (closeModalButton && modalOverlay) {
        closeModalButton.addEventListener('click', () => {
            modalOverlay.classList.remove('active');
            console.log('Close modal button clicked. Modal closed.');
        });
        console.log('Close modal button event listener added.');
    } else {
        console.warn('Close modal button or modalOverlay not found.');
    }

    // Close the modal when clicking outside the modal content
    if (modalOverlay && modalContent) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.classList.remove('active');
                console.log('Clicked outside modal content. Modal closed.');
            }
        });
    }

    // Toggle password visibility
    if (togglePasswordButton && passwordInput) {
        togglePasswordButton.addEventListener('click', () => {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            togglePasswordButton.textContent = isPassword ? 'Hide' : 'Show';
            console.log(`Password input type changed to ${passwordInput.type}`);
        });
        console.log('Toggle password button event listener added.');
    } else {
        console.warn('Toggle password button or passwordInput not found.');
    }

    // Authentication logic
    if (authButton) {
        authButton.addEventListener('click', authenticateCustomer);
        console.log('Auth button event listener added.');
    } else {
        console.warn('Auth button not found.');
    }

    /**
     * Authenticate customer with email and password
     * @param {Event} event - Click event
     */
    async function authenticateCustomer(event) {
        event.preventDefault();
        const email = document.getElementById('em')?.value;
        const password = document.getElementById('passwordInput')?.value;

        if (!email || !password) {
            displayAuthResult("Please provide both email and password.");
            return;
        }

        try {
            const response = await fetch('https://sportcorsproxy.herokuapp.com/foxycart/customer/authenticate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                throw new Error(`Network response was not ok (${response.status})`);
            }

            const responseData = await response.json();
            if (responseData.session_token && responseData.fc_customer_id) {
                handleSuccessfulAuthentication(responseData, email);
            } else {
                displayAuthResult("Authentication failed: Missing session_token or customer ID.");
            }
        } catch (error) {
            console.error('Error during customer authentication:', error);
            displayAuthResult(`Error: ${error.message}`);
        }
    }

    /**
     * Display authentication result message
     * @param {string} message - Message to display
     */
    function displayAuthResult(message) {
        const resultElement = document.getElementById('authResult');
        if (resultElement) {
            resultElement.textContent = message;
            console.log(`Authentication Result: ${message}`);
        }
    }

/**
 * Handle successful authentication
 * @param {object} responseData - Data from authentication response
 * @param {string} email - User's email
 */
function handleSuccessfulAuthentication(responseData, email) {
    console.log('Authentication successful. Processing response data.');

    // Step 1: Extract relevant data from authentication response
    const { fc_customer_id, jwt, session_token, expires_in, sso, fc_auth_token } = responseData;

    // Step 2: Update global variables and user session data
    window.fx_customerId = fc_customer_id;
    window.jwt = jwt; // If needed globally
    window.session_token = session_token; // If needed globally

    // Update userMeta
    window.userMeta = {
        ...window.userMeta,
        fx_customerId: fc_customer_id,
        jwt: jwt,
        sessionToken: session_token,
        authTokenExpiration: new Date(Date.now() + expires_in * 1000), // Calculate expiration time
    };

    // Log the updated values for debugging
    console.log('Updated userMeta after authentication:', window.userMeta);

    // Step 3: Update Local Storage if needed
    saveToLocalStorage(); // Save the updated userMeta to persist between sessions

    // Step 4: Dispatch custom event indicating user has been authenticated
    const authEvent = new CustomEvent('userAuthenticated', { detail: { fx_customerId: fc_customer_id } });
    window.dispatchEvent(authEvent);

    // Step 5: Initialize or Update User Session
    if (!window.userSession) {
        initializeUserSession();
    } else {
        window.userSession.lastUpdated = getFriendlyDateTime();
    }

    // Step 6: Trigger any post-authentication workflows
    //postAuthenticationWorkflow();

    // Step 7: Set Cookies with Authentication Data
    const cookieAttributes = "path=/; Secure; SameSite=Lax";
    document.cookie = `fx_customer=${fc_auth_token}; ${cookieAttributes}`;
    document.cookie = `fx_customerId=${fc_customer_id}; ${cookieAttributes}`;
    document.cookie = `fx_customer_em=${encodeURIComponent(email)}; ${cookieAttributes}`;
    document.cookie = `fx_customer_jwt=${jwt}; ${cookieAttributes}`;
    document.cookie = `fx_customer_sso=${sso}; ${cookieAttributes}`;
    console.log("Cookies set successfully.");

    // Step 8: Read the updated cookies
    const cookies = getCookies();
    console.log('Updated cookies:', cookies);

    // Step 9: Update userMeta with new data from cookies
    window.userMeta = {
        ...window.userMeta,
        fx_customerId: cookies['fx_customerId'] || null,
        fx_customer_em: cookies['fx_customer_em'] || null,
        // ... other userMeta properties
    };

    // Step 10: Re-evaluate user state based on updated cookies
    evaluateUser(cookies, window.userMeta.geoData);

    // Step 11: Update UI elements
    modalOverlay.classList.remove('active');
    loginButton.style.display = 'none';
    logoutButton.style.display = 'inline';
    updateStatusDiv();
    updateUserStateAfterAuth(true);
}


    // Attach event listener to logout button
    if (logoutButton && !logoutButton.listenerAdded) {
        logoutButton.addEventListener('click', handleLogout);
        logoutButton.listenerAdded = true;
        console.log('Logout button event listener added.');
    } else {
        console.warn('Logout button not found or listener already added.');
    }

     // Attach event listener to refresh geolocation data button
     const refreshGeoButton = document.getElementById('refresh-geo-button');
     if (refreshGeoButton) {
         refreshGeoButton.addEventListener('click', refreshGeoLocationData);
     } else {
         console.warn('Refresh Geo button not found.');
     }

    // Attach event listener to refresh customerZoom button
    const refreshCustomerZoomButton = document.getElementById('refresh-customerzoom-button');
    if (refreshCustomerZoomButton) {
        refreshCustomerZoomButton.addEventListener('click', refreshCustomerZoom);
    } else {
        console.warn('Refresh CustomerZoom button not found.');
    }

});



// ============================
// Functions
// ============================

// Start or restart session assist polling
function startSessionAssistPolling() {
    if (sessionAssistIntervalId !== null) {
        clearInterval(sessionAssistIntervalId);
    }
    sessionAssistIntervalId = setInterval(() => {
        performSessionAssist();
        // Optional function to check if the user is idle
    }, 300000); // 5 minutes
}

function refreshCustomerZoom() {
    if (window.userAuth !== 'authenticated') {
        console.log('User is not authenticated. Cannot refresh customerZoom.');
        return;
    }

    // Reset the initialization flag
    window.customerZoomInitialized = false;

    // Optionally, unload or reset existing data if needed
    window.userZoom = {};
    window.userAttributesProcessed = {};
    window.userSubscriptions = {};
    window.userTransactions = {};

    console.log('Refreshing customerZoom and dependent scripts.');

    // Re-run loadAuthenticatedUserScripts
    loadAuthenticatedUserScripts();
}

// execute the function on user interaction
function onUserInteraction() {
    const fx_customerId = window.fx_customerId || null;
    const sessionState = {
        secondsSpent: window.sessionState ? window.sessionState.secondsSpent : 0
    };
    const userMeta = {
        landingPage: window.userMeta ? window.userMeta.landingPage : '',
        geoData: {
            region: window.userMeta && window.userMeta.geoData ? window.userMeta.geoData.region : ''
        }
    };

    evaluateCustomerWhenScriptReady(fx_customerId, sessionState, userMeta);
}

// Manually execute performSessionAssist and continue polling
function refreshSessionAssist() {
    performSessionAssist();
    startSessionAssistPolling();
}

// Stop session assist polling
function stopSessionAssistPolling() {
    if (sessionAssistIntervalId !== null) {
        clearInterval(sessionAssistIntervalId);
        sessionAssistIntervalId = null;
    }
}

/**
 * Send session data to webhook upon logout
 */
function sendSessionWebhook() {
    // Optional: Only proceed if user is authenticated
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


// Reset idle timer on user activity
function resetIdleTimer() {
    if (!loggedOut) { // Only reset the timer if the user has not been logged out
        lastActivityTime = Date.now();
        console.log('User activity detected. Timer reset.');
    }
}

// Check for idle time
function checkIdleTime() {
    if (loggedOut) return; // Do not check idle time if the user has been logged out

    const currentTime = Date.now();
    if (currentTime - lastActivityTime >= idleLimit) {
        console.log('User has been idle for too long. Logging out.');
        handleLogout(); // Log the user out after being idle
        stopSessionAssistPolling(); // Stop polling after logout
        loggedOut = true; // Set the flag to indicate the user is logged out
        clearInterval(idleCheckInterval); // Stop the idle check interval
    } else {
        //console.log('User is still active. Time since last activity:', (currentTime - lastActivityTime) / 1000, 'seconds');
        setTimeout(checkIdleTime, 60 * 1000); // Set the next check in 1 minute
    }
}

// Set up idle detection on user activity
function setupIdleDetection() {
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

// Initialization on Page Load
document.addEventListener('DOMContentLoaded', () => {
    setupIdleDetection(); // Start monitoring user activity for idle detection
    resetIdleTimer();     // Initialize last activity time
    checkIdleTime();      // Start the initial idle check
    startSessionAssistPolling(); // Start polling for session assist
    initializeUserData(); // Initialize user data
    loadPageSenseScript(); // Load the session-pagesense.js script dynamically when the DOM is ready
    loadEvaluateCustomerStateScript(); // Load the evaluatecustomerstate.js script dynamically when the DOM is ready
    // Start the idle check interval
    idleCheckInterval = setInterval(checkIdleTime, 1000); // Check every 1 second
});

