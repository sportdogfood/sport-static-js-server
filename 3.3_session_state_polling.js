/* =========== start_3.3_session_state_polling =========== */

// Define the polling interval in milliseconds (45 seconds)
const POLLING_INTERVAL = 45000;
let pollingEndTime = Date.now() + (6 * 60 * 1000); // Poll for 6 minutes
let pollingIntervalId = null; // Store interval ID for later clearing

// Add 15-second delay before start polling
setTimeout(() => startSessionPolling(), 15000);

// Function to poll user session data
function pollUserSession() {
    if (!SessionManager.session) {
        console.error("Session not initialized, polling will be skipped.");
        return;
    }

    console.log("Polling user session data...");

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

    // Update polling time
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

    // Auto logout check
    if (Date.now() > pollingEndTime) {
        console.warn("Polling exceeded limit of 6 minutes. Triggering auto logout...");
        clearInterval(pollingIntervalId); // Stop the polling
        SessionManager.handleLogout();
        return;
    }

    // Initialization conditions based on the updated Section 13.2
    if (window.fx_customerId) {
        if (!SessionManager.session.userCustomer) {
            console.log("User customer data not found. Initializing user customer...");
            if (typeof fxCustomerInit === 'function') {
                fxCustomerInit(window.fx_customerId);
            } else {
                console.error("fxCustomerInit function not found in fxcustomer.js");
            }
        }
        if (!SessionManager.session.userContact) {
            console.log("User contact data not found. Initializing user contact...");
            if (typeof zoContactInit === 'function') {
                zoContactInit(window.fx_customerId);
            } else {
                console.error("zoContactInit function not found in zocontact.js");
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
}

// Start polling function
function startSessionPolling() {
    // Poll immediately after the delay
    pollUserSession();

    // Set interval to poll every 45 seconds and store the interval ID
    pollingIntervalId = setInterval(() => {
        if (Date.now() > pollingEndTime) {
            console.warn("Polling has reached its time limit. Stopping polling...");
            clearInterval(pollingIntervalId); // Stop the polling after 6 minutes
            SessionManager.handleLogout();
        } else {
            pollUserSession();
        }
    }, POLLING_INTERVAL);
}

// Start polling when DOMContentLoaded and session is initialized
document.addEventListener('DOMContentLoaded', () => {
    if (SessionManager && typeof SessionManager.initializeSession === 'function') {
        SessionManager.initializeSession();
        setTimeout(startSessionPolling, 15000); // Delay start of polling by 15 seconds
    } else {
        console.error('SessionManager is not defined properly, unable to start polling.');
    }
});

/* =========== end_3.3_session_state_polling =========== */
