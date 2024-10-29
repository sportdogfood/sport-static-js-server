/* =========== start_3.3_session_state_polling =========== */

// Define the polling interval in milliseconds (45 seconds)
const POLLING_INTERVAL = 45000;

// Function to poll user session data
function pollUserSession() {
    if (!SessionManager.session) {
        console.error("Session not initialized, polling will be skipped.");
        return;
    }

    console.log("Polling user session data...");
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

    const currentUserState = {
        status: status || 'unknown',
        lastScriptRun: lastScriptRun || 'unknown',
        lastUpdate: lastUpdate || 'unknown',
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
    };

    // Update `userState` in local storage
    localStorage.setItem('userState', JSON.stringify(currentUserState));
    console.log("User state updated:", currentUserState);

    // Logic for loading userDesk.js if needed
    if (window.fx_customerId && (!userDesk || !userDesk.ID)) {
        console.log("Condition met for loading userDesk.js");
        SessionManager.initializeUserDesk(window.fx_customerId);
    }
}

// Start polling function
function startSessionPolling() {
    // Poll immediately
    pollUserSession();

    // Set interval to poll every 45 seconds
    setInterval(pollUserSession, POLLING_INTERVAL);
}

// Start polling when DOMContentLoaded and session is initialized
document.addEventListener('DOMContentLoaded', () => {
    if (SessionManager && typeof SessionManager.initializeSession === 'function') {
        SessionManager.initializeSession();
        startSessionPolling();
    } else {
        console.error('SessionManager is not defined properly, unable to start polling.');
    }
});

/* =========== end_3.3_session_state_polling =========== */
