<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
  <!-- jQuery CDN -->
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>

    <!-- foxycart CDN -->
<script data-cfasync="false" src="https://cdn.foxycart.com/secure.sportdogfood.com/loader.js" async defer></script>


</head>
<body>
    <!-- Login Section -->
    <div id="login-section">
        <button id="login-button" data-el="login-button" class="button button-2">Login</button>
        <button id="logout-button" class="button button-2" style="display: none;">Logout</button>
    </div>

    <!-- Status Div -->
    <div id="status-div">Status: Visitor</div>

<!-- Authentication Modal -->
<div id="modalOverlay" class="modal-overlay">
  <div id="modalContent" class="modal-content">
    <span id="closeModal" class="close-button">&times;</span>
    <h2>Login</h2>
    <form id="loginForm">
      <label for="em">Email:</label>
      <input type="email" id="em" name="email" required>
      <label for="passwordInput">Password:</label>
      <div class="password-wrapper">
        <input type="password" id="passwordInput" name="password" required>
        <button type="button" id="togglePassword">Show</button>
      </div>
      <button type="submit" id="auth-button">Login</button>
      <div id="authResult"></div>
    </form>
  </div>
</div>


 
<script>
/* Last Updated: November 1, 2024, 4:00 PM EDT */

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

let sessionAssistIntervalId = null;
let idleTimeoutId = null;
const idleLimit = 10 * 60 * 1000; // 10 minutes

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
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });

    ['fx_customerEmail', 'fx_customerId', 'userMeta', 'userSession'].forEach(item => localStorage.removeItem(item));

    window.fx_customerId = null;
    window.fx_customer_em = null;
    window.fx_customerEmail = null;
    window.fx_customerEm = null;
    window.userMeta = {};
    window.userSession = {};
    window.userAttributesProcessed= {};
    window.userState = {};
    window.userSubscriptions = {};
    window.userTransactions = {};
    window.userZoom = {};

    console.log('Authentication data cleared.');
}

/**
     * Create a new Sport URL and set it as a cookie
     */

function createNewSporturl(customerEmail, customerId) {
    if (customerEmail && customerId) {
        const sporturl = generateSporturl(customerEmail, customerId);
        const encodedSporturl = encodeURIComponent(encodeURIComponent(sporturl));

        setCookie('sporturl', encodedSporturl, 180); // Set new 'sporturl' cookie with 180 days expiration
        window.userMeta = window.userMeta || {};
        window.userMeta.sporturl = encodedSporturl;

        console.log('New sporturl cookie created after logout.');
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
     * Load additional scripts for authenticated users
     */
 function loadAuthenticatedUserScripts() {
    // Load fxcustomerzoom.js first
    const customerZoomScriptInfo = { src: 'https://sportdogfood.github.io/sport-static-js-server/fxcustomerzoom.js', id: 'fxcustomerzoom', initFunction: 'customerzoomInit' };

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
 * Handle session events based on userState
 * @param {object} userState - Current user state
 */
function handleSessionEvents(userState) {
    switch (userState.state) {
        case 'customer':
        case 'authenticated':
            if (window.userAuth === 'authenticated') {
                console.log('User is authenticated, loading additional data.');
                loadAuthenticatedUserScripts();
            }
            break;
        case 'contact':
            console.log('User is known but not logged in.');
            break;
        case 'potential':
            console.log('User is a potential customer, showing promotional materials.');
            break;
        case 'visitor':
            console.log('User is a visitor, displaying general welcome.');
            break;
        default:
            console.warn('Unhandled user state:', userState.state);
            break;
    }
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
    console.log("State saved to localStorage:", {
        userMeta: window.userMeta,
        userState: window.userState,
        userSession: window.userSession,
    });
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
 * Load GeoJS data via fetch API
 * @returns {object|null} - Geolocation data or null on failure
 */
async function loadGeoLocationData() {
    try {
        const response = await fetch('https://get.geojs.io/v1/ip/geo.json');
        const json = await response.json();
        console.log("Geolocation data fetched successfully:", json);
        return {
            ip: json.ip,
            country: json.country,
            region: json.region,
            city: json.city,
            timezone: json.timezone,
        };
    } catch (error) {
        console.error("Geolocation fetch failed:", error);
        return null;
    }
}

/**
 * Update userState based on provided data
 * @param {object} allData - Combined data from cookies and other sources
 */
function updateUserState(allData) {
    console.log("Simulating update of userState with provided data");

    // Flag to control actual state updates
    const deployState = false; // Set to true when ready to deploy

    // Create a simulated state without modifying the actual global state
    const simulatedUserState = {
        ...window.userState,
        lastUpdated: getLastUpdated(),
    };

    let simulatedUserAuth = window.userAuth;

    // Evaluate user based on multiple criteria - dummy logic for simulation
    if (allData['fcsid'] && allData['fx_customer_sso']) {
        simulatedUserAuth = 'authenticated';
        simulatedUserState.state = 'customer';
        simulatedUserState.subState = 'authenticated-and-active';
        console.log("[SIMULATION] User meets criteria for authenticated and active state. Would initialize user contact here.");
    } else if (allData['fcsid']) {
        simulatedUserAuth = 'authenticated';
        simulatedUserState.state = 'customer';
        simulatedUserState.subState = 'authenticated';
    } else if (allData['fx_customer_sso'] || allData['fx_customer_jwt']) {
        simulatedUserAuth = 'authenticated';
        simulatedUserState.state = 'authenticated';
        simulatedUserState.subState = 'user-logged-in';
    } else if (localStorage.getItem('fx_customerId')) {
        simulatedUserState.state = 'known-customer';
        simulatedUserState.subState = 'identified-by-localstorage';
    } else if (window.location.href.includes('promo') && allData['sporturl']) {
        simulatedUserState.state = 'promotional-visitor';
        simulatedUserState.subState = 'promo-link-detected';
        simulatedUserAuth = '';
    } else if (allData['geoData.region']) {
        simulatedUserState.state = 'region-visitor';
        simulatedUserState.subState = `visitor-from-${allData['geoData.region']}`;
        simulatedUserAuth = '';
    } else if (window.userSession.sessionState.secondsSpent > 300) {
        simulatedUserState.state = 'idle';
        simulatedUserState.subState = 'user-idle';
        simulatedUserAuth = '';
    } else {
        simulatedUserState.state = 'visitor';
        simulatedUserState.subState = 'general-visitor';
        simulatedUserAuth = '';
    }

    console.log('[SIMULATION] Simulated User State:', simulatedUserState);
    console.log('[SIMULATION] Simulated User Auth:', simulatedUserAuth);

    // If deployState is true, update the actual global state
    if (deployState) {
        window.userState = simulatedUserState;
        window.userAuth = simulatedUserAuth;

        // Dispatch custom event
        const event = new CustomEvent('userStateChanged', { detail: window.userState });
        window.dispatchEvent(event);

        updateButtonState();
        updateStatusDiv();
    } else {
        // For simulation, we can dispatch the event with simulated data if needed
        // const event = new CustomEvent('userStateChanged', { detail: simulatedUserState });
        // window.dispatchEvent(event);

        console.log('[SIMULATION] User State Updated:', simulatedUserState);
        console.log('[SIMULATION] User Auth:', simulatedUserAuth);

        // Logging instead of calling functions to actually update UI
        console.log('[SIMULATION] Would update button state here.');
        console.log('[SIMULATION] Would update status div here.');
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
 * Initialize user data from cookies and update state
 */
async function initializeUserData() {
    // Delay to allow cookies to load completely
    console.log('Initializing user data.');
    setTimeout(async () => {
        const cookies = getCookies();

        window.fx_customerId = cookies['fx_customerId'] || null;
        window.fx_customer_id = cookies['fx_customer_id'] || null;
        window.fx_customer_em = cookies['fx_customer_em'] || null;
        window.fx_customerEmail = cookies['fx_customerEmail'] || null;
        window.fx_customerEm = cookies['fx_customerEm'] || null;
        window.fx_customerPin = cookies['fx_customerPin'] || null;
        window.fx_customerLastVisit = cookies['fx_customerLastVisit'] || null;

        window.userMeta = {
            ...window.userMeta,
            lastUpdated: getLastUpdated(),
            friendlyLastUpdated: getLastUpdated(),
            fx_customerId: window.fx_customerId,
            fx_customer_id: window.fx_customer_id,
            fx_customer_em: window.fx_customer_em,
            fx_customerEmail: window.fx_customerEmail,
            fx_customerEm: window.fx_customerEm,
            fx_customerPin: window.fx_customerPin,
            fx_customerLastVisit: window.fx_customerLastVisit,
        };

        window.userSession = {
            ...window.userSession,
            lastUpdated: getLastUpdated(),
            sessionId: cookies['fcsid'] || 'anon',
            sessionState: {
                ...window.userSession.sessionState,
                timeStarted: window.userSession.sessionState.timeStarted || getLastUpdated(),
                secondsSpent: window.userSession.sessionState.secondsSpent || 0
            }
        };

        // Now that both userMeta and userSession have been updated, save them to localStorage
        saveToLocalStorage();

        console.log("Final userMeta before updating state:", window.userMeta);

        // Load geolocation data
        const geoData = await loadGeoLocationData();
        updateUserState({
            ...cookies,
            'geoData.region': geoData ? geoData.region : null,
        });

        // Fire session start and update session state
        setTimeout(() => {
            fireSessionStart();
            updateSessionState(window.userMeta);
        }, 500);
    }, 1000); // Delay to ensure cookies are fully loaded
    console.log('User data initialization completed.');
    console.log('Calling saveToLocalStorage() from initializeUserData');
    saveToLocalStorage();
}



/**
 * Perform session assist operations
 */
async function performSessionAssist() {
    console.log('Performing session assist operations...');
    console.log('performSessionAssist called.');
    const lastUpdated = getLastUpdated();
    console.log(`Session Assist Last Updated: ${lastUpdated}`);

    window.userMeta = {
        ...window.userMeta,
        landingPage: window.location.href,
    };

    saveToLocalStorage();

    // Delay to allow cookies to load completely
    setTimeout(async () => {
        const cookies = getCookies();

        window.fx_customerId = cookies['fx_customerId'] || null;
        window.fx_customer_id = cookies['fx_customer_id'] || null;
        window.fx_customer_em = cookies['fx_customer_em'] || null;
        window.fx_customerEmail = cookies['fx_customerEmail'] || null;
        window.fx_customerEm = cookies['fx_customerEm'] || null;
        window.fx_customerPin = cookies['fx_customerPin'] || null;
        window.fx_customerLastVisit = cookies['fx_customerLastVisit'] || null;

        window.userMeta = {
            ...window.userMeta,
            lastUpdated: getLastUpdated(),
            friendlyLastUpdated: getLastUpdated(),
            fx_customerId: window.fx_customerId,
            fx_customer_id: window.fx_customer_id,
            fx_customer_em: window.fx_customer_em,
            fx_customerEmail: window.fx_customerEmail,
            fx_customerEm: window.fx_customerEm,
            fx_customerPin: window.fx_customerPin,
            fx_customerLastVisit: window.fx_customerLastVisit,
        };

         // Now that both userMeta and userSession have been updated, save them to localStorage
         saveToLocalStorage();

        console.log("Final userMeta before updating state:", window.userMeta);
        
        // Load geolocation data
        const geoData = await loadGeoLocationData();
        updateUserState({
            ...cookies,
            'geoData.region': geoData ? geoData.region : null,
        });

        // Fire session start and update session state
        setTimeout(() => {
            fireSessionStart();
            updateSessionState(window.userMeta);
        }, 500);
    }, 1000); // Delay to ensure cookies are fully loaded
    console.log('Session assist operations completed.');
    console.log('Calling saveToLocalStorage() from performSessionAssist');
    saveToLocalStorage();

}

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






// Initialize user data on script load
initializeUserData();

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
        checkIdleState(); // Optional function to check if the user is idle
    }, 45000); // 45 seconds
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
        console.log('Session assist polling stopped.');
        sessionAssistIntervalId = null;
    } else {
        console.log('Session assist polling was not running.');
    }
}

// Reset idle timer on user activity
function resetIdleTimer() {
    console.log('resetIdleTimer called. Resetting idle timer.');
    if (idleTimeoutId) {
        clearTimeout(idleTimeoutId);
    }
    idleTimeoutId = setTimeout(() => {
        try {
            console.log('Idle timeout reached. User considered idle.');
            console.log('handleLogout called. Logging out user.');
            handleLogout(); // Log the user out after being idle
            stopSessionAssistPolling(); // Stop polling after logout
        } catch (error) {
            console.error('Error during idle timeout handling:', error);
        }
    }, idleLimit);
    console.log('User logged out successfully.');
    console.log(`New idle timeout set for ${idleLimit / 60000} minutes.`);
}

// Set up idle detection on user activity
function setupIdleDetection() {
    ['mousemove', 'keydown', 'scroll', 'click'].forEach(event => {
        document.addEventListener(event, resetIdleTimer);
    });
}

// ============================
// Initialization on Page Load
// ============================
document.addEventListener('DOMContentLoaded', () => {
    setupIdleDetection(); // Start monitoring user activity for idle detection
    resetIdleTimer(); // Start the initial idle timer
    startSessionAssistPolling(); // Start polling for session assist
});


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
        document.dispatchEvent(new Event('authenticated'));
        window.fx_customerId = responseData.fc_customer_id;
        window.fx_customer_em = email;

        const cookieAttributes = "path=/; Secure; SameSite=Lax";
        document.cookie = `fx_customer=${responseData.fc_auth_token}; ${cookieAttributes}`;
        document.cookie = `fx_customerId=${responseData.fc_customer_id}; ${cookieAttributes}`;
        document.cookie = `fx_customer_em=${encodeURIComponent(email)}; ${cookieAttributes}`;
        document.cookie = `fx_customer_jwt=${responseData.jwt}; ${cookieAttributes}`;
        document.cookie = `fx_customer_sso=${responseData.sso}; ${cookieAttributes}`;

        console.log("Cookies set successfully.");
        modalOverlay.classList.remove('active');
        if (loginButton) loginButton.style.display = 'none';
        if (logoutButton) logoutButton.style.display = 'inline';
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

    // Initialize user data on script load
    initializeUserData();

    // Start idle detection and session polling
    setupIdleDetection();
    resetIdleTimer();
    startSessionAssistPolling();
});
    </script>

