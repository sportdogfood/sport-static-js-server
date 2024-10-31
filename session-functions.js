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

function populateFormFromParams() {
    const params = new URLSearchParams(window.location.search);
    const loginForm = document.getElementById('loginForm');

    if (!loginForm) {
        console.warn("Login form not found, skipping form population.");
        return;
    }

    // Populate form fields
    const emailField = loginForm.querySelector('#em');
    const passwordField = loginForm.querySelector('#passwordInput');
    const customerIdField = loginForm.querySelector('#cid');

    if (params.has('em') && emailField) emailField.value = params.get('em');
    if (params.has('pw') && passwordField) passwordField.value = params.get('pw');
    if (params.has('cid') && customerIdField) customerIdField.value = params.get('cid');

    // Specific checks for admin
    if (params.get('admin') === '1527') {
        const secField = loginForm.querySelector('#sec');
        const stnField = loginForm.querySelector('#stn');

        if (params.has('sec') && secField) {
            secField.value = params.get('sec');
        }

        if (params.has('stn') && stnField) {
            stnField.value = params.get('stn');
        }
    }
}

function defineButtonMaster() {
    window.buttonMaster = function (status, caller) {
        console.log(`[buttonMaster] Called with status: ${status}, by: ${caller}`);

        const loginButton = document.getElementById('login-button');
        const logoutButton = document.getElementById('logout-button');
        const statusDiv = document.getElementById('status-div');
        const authButton = document.getElementById('auth-button');

        // Ensure all buttons are found
        console.log(`[buttonMaster] loginButton found: ${!!loginButton}, logoutButton found: ${!!logoutButton}, statusDiv found: ${!!statusDiv}, authButton found: ${!!authButton}`);

        const friendlyDate = getFriendlyDate();
        if (statusDiv) {
            statusDiv.textContent = `${status} at ${friendlyDate} by ${caller}`;
            statusDiv.style.display = 'block';
            console.log(`[buttonMaster] Updated statusDiv: ${statusDiv.textContent}`);
        } else {
            console.error('[buttonMaster] statusDiv is not found in the DOM.');
        }

        if (status === 'logged in') {
            loginButton && (loginButton.style.display = 'none');
            logoutButton && (logoutButton.style.display = 'inline');
        } else if (status === 'logged out') {
            loginButton && (loginButton.style.display = 'inline');
            logoutButton && (logoutButton.style.display = 'none');
        } else {
            console.error(`[buttonMaster] Invalid status: ${status} passed to buttonMaster`);
        }
    };
}

function getFriendlyDate() {
    return new Date().toLocaleString('en-US', {
        timeZone: 'America/New_York',
        hour12: true,
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
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


   
    // Retry once after 45 seconds if data was not successfully initialized
    if (!retryAttempted) {
        console.log("Retrying after delay of 45 seconds...");
        retryAttempted = true;
        setTimeout(() => retrieveSessionData(), RETRY_DELAY);
    } else {
        console.log("Retry attempt completed. No further retries will be made.");
    }
}
