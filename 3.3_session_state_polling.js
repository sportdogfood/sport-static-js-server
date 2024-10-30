/* =========== start_3.3_session_state_polling =========== */

// Define the delay in milliseconds (45 seconds)
const RETRY_DELAY = 45000;
let retryAttempted = false; // Track if a retry has been attempted

// Add 15-second delay before starting the session data retrieval
setTimeout(() => retrieveSessionData(), 15000);

// Function to load fxCustomer script dynamically
function loadFxCustomerScript() {
    if (!document.getElementById('fxcustomer-script')) {
        const scriptElement = document.createElement('script');
        scriptElement.src = "https://sportdogfood.github.io/sport-static-js-server/fxcustomer.js";
        scriptElement.id = 'fxcustomer-script';
        scriptElement.async = true;
        document.body.appendChild(scriptElement);
        console.log("fxcustomer.js script loaded dynamically.");
    }
}

// Function to load zoContact script dynamically
function loadZoContactScript() {
    if (!document.getElementById('zocontact-script')) {
        const scriptElement = document.createElement('script');
        scriptElement.src = "https://sportdogfood.github.io/sport-static-js-server/zocontact.js";
        scriptElement.id = 'zocontact-script';
        scriptElement.async = true;
        document.body.appendChild(scriptElement);
        console.log("zocontact.js script loaded dynamically.");
    }
}

// Function to retrieve user session data
function retrieveSessionData() {
    if (!SessionManager.session) {
        console.error("Session not initialized, skipping data retrieval.");
        return;
    }

    console.log("Retrieving user session data...");

    const cookies = SessionManager.getCookies();
    
    // Check if fx_customer_sso exists and update customer ID and authentication status accordingly
    if (cookies['fx_customer_sso']) {
        const ssoToken = cookies['fx_customer_sso'];
        console.log("SSO token found. Processing fx_customer_sso...");

        const urlParams = new URLSearchParams(ssoToken.split('?')[1]);
        const fcCustomerId = urlParams.get('fc_customer_id');
        const fcAuthToken = urlParams.get('fc_auth_token');

        if (fcCustomerId) {
            window.fx_customerId = fcCustomerId; // Update fx_customerId globally
            document.cookie = `fx_customer_id=${fcCustomerId}; path=/;`;
            SessionManager.updateSession({ userCookies: { fx_customer_id: fcCustomerId } });
        }

        if (fcAuthToken) {
            SessionManager.updateSession({ status: 'isUserAuthenticated' });
        }
    }

    const {
        status,
        userMeta: { lastScriptRun, lastUpdate } = {},
        userCookies: { fx_customer_sso, fx_customer_jwt } = {},
        userZoom,
        userContact,
        userCustomer,
        userGeo,
        userDesk,
    } = SessionManager.session;

    // Track current page (thisPage) and last visited page (lastPage)
    const thisPage = window.location.href;
    const lastPage = localStorage.getItem('lastPage') || 'unknown';

    // Update `lastPage` in localStorage for future reference
    localStorage.setItem('lastPage', thisPage);

    // Determine the login and logout button states
    const loginButton = document.getElementById('login-button');
    const logoutButton = document.getElementById('logout-button');
    const loginButtonState = loginButton ? (loginButton.style.display !== 'none' ? 'visible' : 'hidden') : 'not found';
    const logoutButtonState = logoutButton ? (logoutButton.style.display !== 'none' ? 'visible' : 'hidden') : 'not found';

    // Update current time
    const currentTime = new Date().toLocaleString('en-US', { timeZone: 'America/New_York', hour12: false });
    const currentUserState = {
        status: status || 'unknown',
        lastScriptRun: lastScriptRun || currentTime, // If not available, set to currentTime
        lastUpdate: lastUpdate || currentTime,
        fx_customer_sso: fx_customer_sso || 'unknown',
        fx_customer_jwt: fx_customer_jwt || 'unknown',
        fx_customerId: window.fx_customerId || 'unknown',
        fx_customerEmail: window.fx_customerEmail || 'unknown',
        userZoom: userZoom || 'unknown',
        userContact: userContact || 'unknown',
        userCustomer: userCustomer || 'unknown',
        userGeo: userGeo || 'unknown',
        userDesk: userDesk || 'unknown',
        thisPage,
        lastPage,
        loginButtonState,
        logoutButtonState,
        lastPollTime: currentTime
    };

    // Update `userState` in local storage
    localStorage.setItem('userState', JSON.stringify(currentUserState));
    console.log("User state updated:", currentUserState);

    // Update SessionManager's session data
    SessionManager.updateSession({
        userMeta: {
            lastScriptRun: currentTime,
            lastUpdate: currentTime
        }
    });

    // Initialization conditions based on the updated Section 13.2
    if (window.fx_customerId) {
        if (!SessionManager.session.userCustomer) {
            console.log("User customer data not found. Initializing user customer...");
            if (typeof fxCustomerInit === 'function') {
                fxCustomerInit(window.fx_customerId);
            } else {
                loadFxCustomerScript();
            }
        }
        if (!SessionManager.session.userContact) {
            console.log("User contact data not found. Initializing user contact...");
            if (typeof zoContactInit === 'function') {
                zoContactInit(window.fx_customerId);
            } else {
                loadZoContactScript();
            }
        }
        if (!SessionManager.session.userDesk || !SessionManager.session.userDesk.ID) {
            console.log("User desk data not found. Initializing user desk...");
            SessionManager.initializeUserDesk(window.fx_customerId);
        }
        if (!SessionManager.session.userZoom) {
            console.log("User zoom data not found. Initializing user zoom...");
            SessionManager.initializeUserZoom();
        }
    } else {
        console.warn("No valid customer ID found during polling. Skipping initialization tasks.");
    }

    // Retry once after 45 seconds if data was not successfully initialized
    if (!retryAttempted) {
        console.log("Retrying after delay of 45 seconds...");
        retryAttempted = true;
        setTimeout(() => retrieveSessionData(), RETRY_DELAY);
    } else {
        console.log("Retry attempt completed. No further retries will be made.");
    }
}

// Start retrieving session data when DOMContentLoaded and session is initialized
document.addEventListener('DOMContentLoaded', () => {
    if (SessionManager && typeof SessionManager.initializeSession === 'function') {
        SessionManager.initializeSession();
        setTimeout(retrieveSessionData, 15000); // Delay start of session data retrieval by 15 seconds
    } else {
        console.error('SessionManager is not defined properly, unable to retrieve session data.');
    }
});

/* =========== end_3.3_session_state_polling =========== */
