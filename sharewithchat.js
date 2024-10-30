
/* =========== start_1_cst_start =========== */

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

// Debounce function 
function debounce(func, delay) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}

const debouncedPushPagesense = debounce(pushPagesense, 2000);

/* =========== ens_1_cst_start =========== */

/* =========== start_2_userEmbedded =========== */

function updateEmbeddedData(key, data) {
    let userZoom = JSON.parse(localStorage.getItem('userZoom')) || {};

    if (!userZoom._embedded) {
        userZoom._embedded = {};
    }

    userZoom._embedded[key] = data;

    console.log(`Updating _embedded with key: ${key}, data:`, data);
    localStorage.setItem('userZoom', JSON.stringify(userZoom));
    localStorage.setItem(`debug_update_${key}`, JSON.stringify(data));
    console.log(`Set debug_update_${key} in localStorage:`, data);
}

// Attach updateEmbeddedData to window for global access
window.updateEmbeddedData = updateEmbeddedData;

/* =========== end_2_userEmbedded =========== */

/* =========== start_3.1_session_init =========== */

const SessionManager = {
    session: null, // Placeholder for session data

    initializeSession() {
        console.log("Initializing session...");
        if (!localStorage.getItem("userSession")) {
            // Start a new session with default data
            this.startSession({
                status: 'logged out', // Default state
                fx_customerId: window.fx_customerId ?? null,
                userMeta: {
                    lastUpdate: getFriendlyDate(),
                    lastScriptRun: getFriendlyDate(),
                    sessionTime: 0 // Initialize sessionTime in seconds
                },
                userCookies: this.getCookies(), // Initialize
                userGeo: {}, // Initialize userGeo
                userPersona: {}, // Initialize
                userCalc: {}, // Initialize
                userContent: {}, // Initialize
                userEvents: [] // Initialize
            });
            console.log("New session started.");
        } else {
            this.getSession();
            console.log("Existing session loaded.", this.session);
        }
    },

    // Retrieve the session
    getSession() {
        this.session = JSON.parse(localStorage.getItem("userSession"));
        console.log("Session retrieved from localStorage.", this.session);
    },

    // Update the session with new data
    updateSession(newData) {
        if (!this.session) {
            this.getSession(); // Retrieve the session if it's not initialized
        }
        Object.assign(this.session, newData);
        if (this.session.userMeta) {
            this.session.userMeta.lastUpdate = getFriendlyDate();
        }
        this.updateLocalStorage();
        console.log("Session updated with new data:", newData);
    },

    // Start a new session
    startSession(userData) {
        this.session = {
            ...userData,
            userMeta: {
                ...userData.userMeta,
                lastUpdate: getFriendlyDate(),
                lastScriptRun: getFriendlyDate(),
                sessionTime: userData.userMeta?.sessionTime ?? 0 // Initialize sessionTime in seconds
            }
        };
        this.updateLocalStorage();
        console.log("Session started:", this.session);
    },

    // End session and clear data
    endSession() {
        this.session = null;
        localStorage.removeItem("userSession");
        console.log("Session ended and removed from localStorage.");
    },

    // Helper to ensure localStorage is up-to-date
    updateLocalStorage() {
        if (this.session) {
            localStorage.setItem("userSession", JSON.stringify(this.session));
            console.log("Session stored in localStorage:", this.session);
        }
    },

    // Retrieve cookies from document
    getCookies() {
        const cookies = document.cookie.split('; ').filter(cookie => cookie);
        const cookieObj = {};
        cookies.forEach(cookie => {
            const [name, ...rest] = cookie.split('=');
            const value = rest.join('=');
            cookieObj[name] = decodeURIComponent(value);
        });
        console.log("Cookies retrieved:", cookieObj);
        return cookieObj;
    }
};

/* =========== end_3.1_session_init =========== */


/* =========== start_3.2_user_data_enrichment =========== */

SessionManager.getSportUrlCookie = function () {
    const cookieString = document.cookie.split('; ').find(row => row.startsWith('sporturl='));
    if (cookieString) {
        const sporturlValue = decodeURIComponent(cookieString.split('=')[1]);
        const urlParams = new URLSearchParams(sporturlValue);
        window.fx_customerId = urlParams.get('cid');
        window.fx_customer_em = urlParams.get('em');
        const timestamp = urlParams.get('ts');
        window.lastvisit = timestamp ? new Date(parseInt(timestamp)).toLocaleString('en-US', { timeZone: 'America/New_York' }) : null;
        console.log("SportURL cookie parsed:", { fx_customerId: window.fx_customerId, fx_customer_em: window.fx_customer_em, lastvisit: window.lastvisit });
    }
};

SessionManager.updateUserGeo = function () {
    const script = document.createElement('script');
    script.src = "https://get.geojs.io/v1/ip/geo.js";
    script.async = true;
    script.onload = () => {
        if (typeof geoip === 'function') {
            console.log("GeoJS script loaded.");
        }
    };
    document.body.appendChild(script);

    // Define the geoip function
    window.geoip = (json) => {
        const geoData = {
            geoIP: json.ip,
            geoCountry: json.country,
            geoRegion: json.region,
            geoCity: json.city,
            geoTimeZone: json.timezone
        };
        console.log("Geolocation data fetched:", geoData);
        SessionManager.updateSession({ userGeo: geoData }); // Use `SessionManager` here to ensure correct context
    };
};

SessionManager.checkForIdentification = function () {
    const cookies = this.getCookies();
    let identified = false;

    // Check if fx_customer_sso exists
    if (cookies['fx_customer_sso']) {
        const ssoToken = cookies['fx_customer_sso'];
        console.log("SSO token found. Processing fx_customer_sso...");

        const urlParams = new URLSearchParams(ssoToken.split('?')[1]);
        const fcCustomerId = urlParams.get('fc_customer_id');
        const fcAuthToken = urlParams.get('fc_auth_token');

        if (fcCustomerId) {
            document.cookie = `fc_customer_id=${fcCustomerId}; path=/;`;
        }
        if (fcAuthToken) {
            document.cookie = `fc_auth_token=${fcAuthToken}; path=/;`;
        }

        if (!cookies['fx_customer_id'] && fcCustomerId) {
            document.cookie = `fx_customer_id=${fcCustomerId}; path=/;`;
        }
    }

    if (cookies['fx_customer_sso'] || cookies['fx_customerId'] || cookies['fx_customer_jwt'] || cookies['fx_customer'] || cookies['fx_customer_em'] || cookies['sporturl'] || window.fx_customerEmail || window.fx_customerId) {
        identified = true;
        console.log("User identified based on cookies or window properties.");
        this.updateSession({ status: 'user-returning' });
    }

    if (!window.fx_customerId && cookies['fx_customer_id']) {
        window.fx_customerId = cookies['fx_customer_id'];
    }

    console.log("Identification check completed. Identified:", identified);

    if (identified && (cookies['fx_customer_jwt'] || cookies['fx_customer_sso'])) {
        console.log("JWT or SSO token found. Setting up userCart...");
        this.initializeUserCartPlaceholder();
    }

    if (identified && cookies['fx_customerId']) {
        console.log("Attempting to find customer details with fx_customerId.");
        this.findCustomer(cookies['fx_customerId']);
    }

    this.loadIdentificationScripts();
};

// Placeholder function to initialize userCart
SessionManager.initializeUserCartPlaceholder = function () {
    console.log("Placeholder: Initializing userCart...");
};

/* =========== end_3.2_user_data_enrichment =========== */
/* =========== start_3.3_session_state_polling =========== */

// Define the polling interval in milliseconds (45 seconds)
const POLLING_INTERVAL = 45000;
let pollingCount = 0; // Track the number of polling attempts
const MAX_POLLING_COUNT = 6; // Maximum polling attempts
let pollingIntervalId = null; // Store interval ID for later clearing

// Add 15-second delay before start polling
setTimeout(() => startSessionPolling(), 15000);

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

// Function to poll user session data
function pollUserSession() {
    if (!SessionManager.session) {
        console.error("Session not initialized, polling will be skipped.");
        return;
    }

    console.log("Polling user session data... (Attempt: " + (pollingCount + 1) + ")");

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

    // Increment the polling count and stop if the max count is reached
    pollingCount++;
    if (pollingCount >= MAX_POLLING_COUNT) {
        console.warn("Polling has reached the maximum count of 6. Stopping polling...");
        clearInterval(pollingIntervalId); // Stop the polling after 6 attempts
        return;
    }

    // Initialization conditions based on the updated Section 13.2
    if (window.fx_customerId) {
        if (!SessionManager.session.userCustomer) {
            console.log("User customer data not found. Initializing user customer...");
            if (typeof fxCustomerInit === 'function') {
                fxCustomerInit(window.fx_customerId);
            } else {
                console.error("fxCustomerInit function not found in fxcustomer.js. Loading script dynamically...");
                loadFxCustomerScript();
            }
        }
        if (!SessionManager.session.userContact) {
            console.log("User contact data not found. Initializing user contact...");
            if (typeof zoContactInit === 'function') {
                zoContactInit(window.fx_customerId);
            } else {
                console.error("zoContactInit function not found in zocontact.js. Loading script dynamically...");
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
}

// Start polling function
function startSessionPolling() {
    // Poll immediately after the delay
    pollUserSession();

    // Set interval to poll every 45 seconds and store the interval ID
    pollingIntervalId = setInterval(() => {
        pollUserSession();
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



/* =========== start_4_sessionformPopulation =========== */

document.addEventListener('DOMContentLoaded', () => {
    const currentPath = window.location.pathname;

    if (currentPath === "/login") {
        // Run form population only on the login page
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            populateFormFromParams();
        } else {
            console.warn("Login form not found on /login page.");
        }
    }

    // Attach event listeners to buttons on the page
    attachButtonEventListeners();
});

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

function attachButtonEventListeners() {
    const buttons = [
        {
            id: 'login-button',
            handler: () => {
                //console.log('[EventListener] Login button clicked.');
                if (SessionManager && typeof SessionManager.handleLogin === 'function') {
                    SessionManager.handleLogin();
                    debouncedPushPagesense('login-click', localStorage.getItem('fx_customerId'));
                } else {
                    console.error('[EventListener] SessionManager.handleLogin is not a function or is undefined.');
                }
            }
        },
        {
            id: 'logout-button',
            handler: () => {
               // console.log('[EventListener] Logout button clicked.');
                if (SessionManager && typeof SessionManager.handleLogout === 'function') {
                    SessionManager.handleLogout();
                    debouncedPushPagesense('logout-click', localStorage.getItem('fx_customerId'));
                } else {
                    console.error('[EventListener] SessionManager.handleLogout is not a function or is undefined.');
                }
            }
        },
        {
            id: 'auth-button',
            handler: () => {
               // console.log('[EventListener] Auth button clicked.');
                if (typeof authenticateCustomer === 'function') {
                    authenticateCustomer()
                        .then(() => {
                            debouncedPushPagesense('auth-click', null);
                        })
                        .catch((error) => {
                            console.error('[EventListener] Error during authenticateCustomer:', error);
                        });
                } else {
                    console.error('[EventListener] authenticateCustomer is not a function or is undefined.');
                }
            }
        }
    ];

    buttons.forEach(({ id, handler }) => {
        const button = document.getElementById(id);
        if (button && !button.listenerAdded) {
           // console.log(`[EventListener] Adding click event listener to button: ${id}`);
            button.addEventListener('click', handler);
            button.listenerAdded = true;
        } else if (!button) {
            console.warn(`[EventListener] Button with ID: ${id} not found in the DOM.`);
        }
    });
}

/* =========== end_4_sessionformPopulation =========== */



/* =========== start_5_initialDom =========== */

if (!window.domContentLoadedListenerAdded) {
    window.domContentLoadedListenerAdded = true;
    document.addEventListener('DOMContentLoaded', () => {
        if (SessionManager && typeof SessionManager.initializeSession === 'function') {
            SessionManager.initializeSession();
        } else {
            console.error('SessionManager.initializeSession is not a function or is undefined');
        }

        // Populate the form only if the current path is '/login'
        const currentPath = window.location.pathname;
        if (currentPath === "/login") {
            populateFormFromParams(); // Populate the form on page load
        }

        // Attach button event listeners
        attachButtonEventListeners();

        // MutationObserver to attach button event listeners if buttons are dynamically added
        const observer = new MutationObserver(() => {
            attachButtonEventListeners();
        });

        observer.observe(document.body, { childList: true, subtree: true });

        // Set initial button state on DOM load
        const initialStatus = localStorage.getItem('fx_customerId') ? 'logged in' : 'logged out';
        buttonMaster(initialStatus, 'initial load');
        debouncedPushPagesense(initialStatus === 'logged in' ? 'session-restored' : 'session-initiated', localStorage.getItem('fx_customerId'));
    });
}

// Function to attach button event listeners
function attachButtonEventListeners() {
    const buttons = [
        {
            id: 'login-button',
            handler: () => {
              //  console.log('[EventListener] Login button clicked.');
                if (SessionManager && typeof SessionManager.handleLogin === 'function') {
                    SessionManager.handleLogin();
                    debouncedPushPagesense('login-click', localStorage.getItem('fx_customerId'));
                } else {
                    console.error('[EventListener] SessionManager.handleLogin is not a function or is undefined.');
                }
            }
        },
        {
            id: 'logout-button',
            handler: () => {
              //  console.log('[EventListener] Logout button clicked.');
                if (SessionManager && typeof SessionManager.handleLogout === 'function') {
                    SessionManager.handleLogout();
                    debouncedPushPagesense('logout-click', localStorage.getItem('fx_customerId'));
                } else {
                    console.error('[EventListener] SessionManager.handleLogout is not a function or is undefined.');
                }
            }
        },
        {
            id: 'auth-button',
            handler: () => {
               // console.log('[EventListener] Auth button clicked.');
                if (typeof authenticateCustomer === 'function') {
                    authenticateCustomer().then(() => {
                        debouncedPushPagesense('auth-click', null);
                    }).catch((error) => {
                        console.error('[EventListener] Error during authenticateCustomer:', error);
                    });
                } else {
                    console.error('[EventListener] authenticateCustomer is not a function or is undefined.');
                }
            }
        }
    ];

    buttons.forEach(({ id, handler }) => {
        const button = document.getElementById(id);
        if (button && !button.listenerAdded) {
         //   console.log(`[EventListener] Adding click event listener to button: ${id}`);
            button.addEventListener('click', handler);
            button.listenerAdded = true;
        } else if (!button) {
            console.warn(`[EventListener] Button with ID: ${id} not found in the DOM.`);
        }
    });
}

/* =========== end_5_initialDom =========== */




/* =========== start_6_sessioninitial_buttonhandle =========== */

document.addEventListener('DOMContentLoaded', () => {
    if (SessionManager && typeof SessionManager.initializeSession === 'function') {
        SessionManager.initializeSession();
    } else {
        console.error('SessionManager.initializeSession is not a function or is undefined');
    }
    
    populateFormFromParams(); // Populate the form on page load

    // Function to attach button event listeners
    function attachButtonEventListeners() {
        const buttons = [
            {
                id: 'login-button',
                handler: () => {
                    if (SessionManager && typeof SessionManager.handleLogin === 'function') {
                        SessionManager.handleLogin();
                        debouncedPushPagesense('login-click', localStorage.getItem('fx_customerId'));
                    } else {
                        console.error('SessionManager.handleLogin is not a function or is undefined');
                    }
                }
            },
            {
                id: 'logout-button',
                handler: () => {
                    if (SessionManager && typeof SessionManager.handleLogout === 'function') {
                        SessionManager.handleLogout();
                        debouncedPushPagesense('logout-click', localStorage.getItem('fx_customerId'));
                    } else {
                        console.error('SessionManager.handleLogout is not a function or is undefined');
                    }
                }
            },
            {
                id: 'auth-button',
                handler: () => {
                    if (typeof authenticateCustomer === 'function') {
                        authenticateCustomer()
                            .then(() => {
                                debouncedPushPagesense('auth-click', null);
                            })
                            .catch((error) => {
                                console.error('Error during authenticateCustomer:', error);
                            });
                    } else {
                        console.error('authenticateCustomer is not a function or is undefined');
                    }
                }
            }
        ];

        buttons.forEach(({ id, handler }) => {
            const button = document.getElementById(id);
            if (button && !button.listenerAdded) {
                button.addEventListener('click', handler);
                button.listenerAdded = true;
            }
        });
    }

    // Attach event listeners initially
    attachButtonEventListeners();

    const observer = new MutationObserver(() => {
        const loginButton = document.getElementById('login-button');
        const logoutButton = document.getElementById('logout-button');
        const statusDiv = document.getElementById('status-div');
    
        if (loginButton && logoutButton) {
            observer.disconnect(); // Stop observing once buttons are found
            attachButtonEventListeners(); // Attach event listeners to buttons
            buttonMaster(SessionManager && typeof SessionManager.isUserAuthenticated === 'function' && SessionManager.isUserAuthenticated() ? 'logged in' : 'logged out', 'observer');
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Handle session state on load
    if (SessionManager && (typeof SessionManager.isUserAuthenticated === 'function' && SessionManager.isUserAuthenticated())) {
        buttonMaster('logged in', 'DOMContentLoaded');
        debouncedPushPagesense('session-restored', localStorage.getItem('fx_customerId'));
    } else {
        buttonMaster('logged out', 'DOMContentLoaded');
        debouncedPushPagesense('session-initiated', null);
    }
});

/* =========== end_6_sessioninitial_buttonhandle =========== */
/* =========== start_7_sessionUIstate =========== */

/* =========== start_7_sessionUIstate =========== */

// Define the buttonMaster function
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

defineButtonMaster();

/* =========== end_7_sessionUIstate =========== */

/* =========== start_8_sessionUserLogin =========== */

SessionManager.handleLogin = function () {
    console.log('[SessionManager] handleLogin called.');
    this.updateSession({ status: 'logged in', calledBy: 'handleLogin' });
    buttonMaster('logged in', 'handleLogin');
    pushPagesense('login', this.session.fx_customerId);

    if (window.fx_customerId) {
        console.log('[SessionManager] Authenticated user found, initializing user data...');
        this.initializeUserZoom();
        this.initializeUserCart();
        this.initializeUserDesk();
        this.initializeUserCustomer();
        this.initializeUserThrive();
    } else {
        console.error('[SessionManager] fx_customerId is not set. Skipping user data initialization.');
    }
};
// Add login button handler programmatically
document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('login-button');
    if (loginButton && !loginButton.listenerAdded) {
        loginButton.addEventListener('click', () => {
          //  console.log('[EventListener] Login button clicked. Redirecting to login page.');
            window.location.href = '/login';
        });
        loginButton.listenerAdded = true;
    }
});
/* =========== end_8_sessionUserLogin =========== */
/* =========== start_9_pagesense_track =========== */

function debounce(func, delay) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}

let pagesenseCallCount = 0; // Keep track of how many times pushPagesense has been called

// Function to push events to PageSense, can be called a maximum of 4 times
function pushPagesense(actionType, customerId) {
    if (pagesenseCallCount >= 4) {
        console.warn('Max number of PageSense calls reached. Skipping action:', actionType);
        return;
    }

    // Prevent recursive calls
    if (window.pushPagesenseLock) {
        console.warn('PushPagesense is currently locked to prevent recursion for action:', actionType);
        return;
    }

    // Ensure that PageSense is loaded
    if (typeof window.pagesense === 'undefined') {
        console.warn('PageSense is not yet loaded. Skipping action:', actionType);
        return;
    }

    window.pushPagesenseLock = true;

    try {
        if (typeof window.pushPagesense === 'function') {
            window.pushPagesense(actionType, customerId);
            console.log('Pagesense tracking for action:', actionType, 'Customer ID:', customerId);
            pagesenseCallCount++;
        } else {
            console.error('Pagesense function is not defined on the window object.');
        }
    } catch (error) {
        console.error('Error while pushing Pagesense action:', error);
    } finally {
        window.pushPagesenseLock = false;
    }
}

// Function to load PageSense script dynamically
function loadPageSenseScript() {
    if (!document.getElementById('pagesense-script')) {
        const scriptElement = document.createElement('script');
        scriptElement.src = "https://cdn.pagesense.io/js/sportdogfood141/683c76dd5be1480e9ff129b5be0042a9.js";
        scriptElement.id = 'pagesense-script';
        scriptElement.async = true;
        document.body.appendChild(scriptElement);
        console.log("PageSense script loaded dynamically.");
    }
}

/*
   this is section-9 pagesense-tracking
this should only be executed when called. it should only be called max 6 times where
each userEvent will be logged and sent to pagesense as these events
auth-click, fx_customerId 500, 595, 665, 874
login-click, fx_customerId 475, 571, 642, 852
logout-click, fx_customerId 487, 583, 653, 863
login-success, fx_customerId 988
*/

/* =========== end_9_pagesense_track =========== */

/* =========== start_10_eventsAuth =========== */

function attachButtonEventListeners() {
    const buttons = [
        {
            id: 'login-button', handler: () => {
               // console.log('[EventListener] Login button clicked.');
                if (SessionManager && typeof SessionManager.handleLogin === 'function') {
                    SessionManager.handleLogin();
                    debouncedPushPagesense('login-click', localStorage.getItem('fx_customerId'));
                } else {
                    console.error('[EventListener] SessionManager.handleLogin is not a function or is undefined.');
                }
            }
        },
        {
            id: 'logout-button', handler: () => {
              //  console.log('[EventListener] Logout button clicked.');
                if (SessionManager && typeof SessionManager.handleLogout === 'function') {
                    SessionManager.handleLogout();
                    debouncedPushPagesense('logout-click', localStorage.getItem('fx_customerId'));
                } else {
                    console.error('[EventListener] SessionManager.handleLogout is not a function or is undefined.');
                }
            }
        },
        {
            id: 'auth-button', handler: () => {
              //  console.log('[EventListener] Auth button clicked.');
                if (typeof authenticateCustomer === 'function') {
                    authenticateCustomer().then(() => {
                        debouncedPushPagesense('auth-click', null);
                    }).catch((error) => {
                        console.error('[EventListener] Error during authenticateCustomer:', error);
                    });
                } else {
                    console.error('[EventListener] authenticateCustomer is not a function or is undefined.');
                }
            }
        }
    ];

    buttons.forEach(({ id, handler }) => {
        const button = document.getElementById(id);
        if (button) {
            if (!button.listenerAdded) {
              //  console.log(`[EventListener] Adding click event listener to button: ${id}`);
                button.addEventListener('click', handler);
                button.listenerAdded = true;
            } else {
              //  console.log(`[EventListener] Button with ID: ${id} already has an event listener.`);
            }
        } else {
            // Log at debug level rather than an error to avoid noise on non-login/logout pages.
            console.debug(`[EventListener] Button with ID: ${id} not found on the current page. Skipping.`);
        }
    });
}

/* =========== end_10_eventsAuth =========== */

/* =========== start_11_sessionAuthHandle =========== */

// Function to authenticate customer
async function authenticateCustomer() {
    const email = document.getElementById('em')?.value;
    const password = document.getElementById('passwordInput')?.value;

    if (!email || !password) {
        displayAuthResult("Please provide both email and password.");
        return;
    }

    const apiUrl = 'https://sportcorsproxy.herokuapp.com/foxycart/customer/authenticate';
    const payload = { email, password };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
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

// Function to display authentication result
function displayAuthResult(message) {
    const resultElement = document.getElementById('authResult');
    if (resultElement) {
        resultElement.textContent = message;
        resultElement.style.display = 'block';
    } else {
        console.error('Authentication result element not found in the DOM.');
    }
}

/* =========== end_11_sessionAuthHandle =========== */


/* =========== start_12_authsuccess =========== */
// Function to handle successful authentication
function handleSuccessfulAuthentication(responseData, email) {
    document.dispatchEvent(new Event('authenticated'));
    window.fx_customerId = responseData.fc_customer_id;

    window.userCustomerData = responseData;
    window.userCustomerEmail = email;

    displayAuthResult("Authentication successful! Welcome.");

    // Store customer data in localStorage for session persistence
    localStorage.setItem("fx_customerEmail", email);
    localStorage.setItem("fx_customerId", responseData.fc_customer_id);

    // Set cookies for secure customer identification
    const cookieAttributes = "path=/; Secure; SameSite=Strict";
    document.cookie = `fx_customer=${responseData.fc_auth_token}; ${cookieAttributes}`;
    document.cookie = `fx_customerId=${responseData.fc_customer_id}; ${cookieAttributes}`;
    document.cookie = `fx_customer_em=${encodeURIComponent(email)}; ${cookieAttributes}`;
    document.cookie = `fx_customer_jwt=${responseData.jwt}; ${cookieAttributes}`;
    document.cookie = `fx_customer_sso=${responseData.sso}; ${cookieAttributes}`;

    // Set sporturl cookie with additional metadata for customer session
    const sportpin = Math.floor(1000 + Math.random() * 9000);
    const timestamp = Date.now();
    const sporturl = `https://www.sportdogfood.com/login&em=${encodeURIComponent(email)}&cid=${responseData.fc_customer_id}&pn=${sportpin}&ts=${timestamp}`;
    document.cookie = `sporturl=${encodeURIComponent(sporturl)}; path=/; max-age=${60 * 60 * 24 * 180}; Secure; SameSite=Strict`;

    // Fetch additional customer data and track login success
    fetchCustomerData(responseData.fc_customer_id);
    debouncedPushPagesense('login-success', responseData.fc_customer_id);

    // Load PageSense tracking script dynamically after successful login
    loadPageSenseScript();
}

// Placeholder function to fetch customer data
async function fetchCustomerData(customerId) {
    console.log(`Fetching additional data for customer ID: ${customerId}`);
}
/* =========== end_12_authsuccess =========== */
/* =========== start_13.1_logout_sessionterminate =========== */
// Manage user logout
SessionManager.handleLogout = function() {
    console.log('[SessionManager] handleLogout called.');
    // Logout logic and removing session data
  
    const userSession = localStorage.getItem('userSession');
    if (!userSession) {
        console.error('[SessionManager] No user session found in localStorage. Cannot proceed with logout.');
        return;
    }
  
    const sessionObject = JSON.parse(userSession);
    const fx_customerEmail = localStorage.getItem('fx_customerEmail');
    const fx_customerId = localStorage.getItem('fx_customerId');
    const logoutDate = new Date().toLocaleString('en-US', { timeZone: 'America/New_York', hour12: false });
  
    const payload = {
        ...sessionObject,
        logoutDate,
        fx_customerEmail,
        fx_customerId,
    };
  
    console.log('[SessionManager] Logging out with payload:', payload);
  
    fetch('https://cat-heroku-proxy-51e72e8e9b26.herokuapp.com/proxy/session', {
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
        console.log('[SessionManager] Logout successfully sent:', data);
        // Remove all related data from localStorage
        localStorage.removeItem('userSession');
        localStorage.removeItem('fx_customerEmail');
        localStorage.removeItem('fx_customerId');
        localStorage.removeItem('userState');
        localStorage.removeItem('userZoom');
        localStorage.removeItem('userContact');
        localStorage.removeItem('userCustomer');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('debug_update_fx:subscriptions');
        localStorage.removeItem('debug_update_fx:transactions');
  
        buttonMaster('logged out', 'handleLogout');
        pushPagesense('logout', fx_customerId);
    })
    .catch((error) => {
        console.error('[SessionManager] There was an error during the logout process:', error);
    });
  };
  /* =========== end_13.1_logout_sessionterminate =========== */
  
/* =========== start_13.2_user_initialization =========== */

// Initialize userZoom 
SessionManager.initializeUserZoom = function() {
    console.log("Initializing userZoom...");
};

// Initialize userCart
SessionManager.initializeUserCart = function() {
    console.log("Initializing user cart...");
};

// Initialize userDesk
SessionManager.initializeUserDesk = function(customerId) {
    console.log("Attempting to initialize user desk details...");

    if (!window.fx_customerId) {
        console.error("No valid customer ID found. Initialization aborted.");
        return;
    }

    // Check if UserDesk library is already loaded
    if (typeof UserDesk === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://sportdogfood.github.io/sport-static-js-server/userdesk.js'; // Update the path as needed

        script.onload = function() {
            console.log("userdesk.js loaded successfully");
            if (typeof UserDesk.initialize === 'function') {
                UserDesk.initialize(customerId);
            } else {
                console.error("UserDesk.initialize function not found in userdesk.js");
            }
        };

        script.onerror = function() {
            console.error("Failed to load userdesk.js");
        };

        document.head.appendChild(script);
    } else {
        // UserDesk is already loaded, directly call initialize
        if (typeof UserDesk.initialize === 'function') {
            UserDesk.initialize(customerId);
        } else {
            console.error("UserDesk.initialize function not found");
        }
    }
};

// Initialize userCustomer
SessionManager.initializeUserCustomer = function() {
    console.log("Initializing user customer details...");

    if (localStorage.getItem('userCustomer') === null) {
        const script = document.createElement('script');
        script.src = 'https://sportdogfood.github.io/sport-static-js-server/fxcustomer.js'; 
        script.id = 'fxcustomer';

        script.onload = function() {
            console.log("fxcustomer.js loaded successfully");
            if (typeof fxCustomerInit === 'function') {
                fxCustomerInit();
            } else {
                console.error("fxCustomerInit function not found in fxcustomer.js");
            }
        };

        script.onerror = function() {
            console.error("Failed to load fxcustomer.js");
        };

        document.head.appendChild(script);
    } else {
        console.log("userCustomer already exists in local storage.");
    }
};

// Initialize userContact
SessionManager.initializeUserContact = function() {
    console.log("Initializing user contact details...");

    if (localStorage.getItem('userContact') === null) {
        const script = document.createElement('script');
        script.src = 'https://sportdogfood.github.io/sport-static-js-server/zocontact.js';
        script.id = 'zocontact';

        script.onload = function() {
            console.log("zocontact.js loaded successfully");
            if (typeof zoContactInit === 'function') {
                zoContactInit();
            } else {
                console.error("zoContactInit function not found in zocontact.js");
            }
        };

        script.onerror = function() {
            console.error("Failed to load zocontact.js");
        };

        document.head.appendChild(script);
    } else {
        console.log("userContact already exists in local storage.");
    }
};

// Initialize userThrive
SessionManager.initializeUserThrive = function() {
    console.log("Initializing user thrive details...");
};

// Initialize userAuto
SessionManager.initializeUserAuto = function() {
    console.log("Initializing user auto details...");
};

// Initialize userTrack
SessionManager.initializeUserTrack = function() {
    console.log("Initializing user tracking details...");
};

// Initialize userTrans
SessionManager.initializeUserTrans = function() {
    console.log("Initializing user transaction details...");
};

// Initialize userGetAgain
SessionManager.initializeUserGetAgain = function() {
    console.log("Initializing user 'get again' details...");
    // Placeholder
};

/* =========== end_13.2_user_initialization =========== */


/* =========== start_14_authandfxatt =========== */
document.addEventListener('authenticated', () => {
    const scriptsToLoad = [
        { src: 'https://sportdogfood.github.io/sport-static-js-server/fxcustomerzoom.js', id: 'fxcustomerzoom', initFunction: 'customerzoomInit' },
        { src: 'https://sportdogfood.github.io/sport-static-js-server/fxsubscriptions.js', id: 'fxsubscriptions', initFunction: 'subscriptionsInit' },
        { src: 'https://sportdogfood.github.io/sport-static-js-server/fxtransactions.js', id: 'fxtransactions', initFunction: 'transactionsInit' },
        { src: 'https://sportdogfood.github.io/sport-static-js-server/fxattributes.js', id: 'fxattributes', initFunction: 'attributesInit' }
    ];

    scriptsToLoad.forEach(scriptInfo => {
        if (!document.getElementById(scriptInfo.id)) {
            const scriptElement = document.createElement('script');
            scriptElement.src = scriptInfo.src;
            scriptElement.id = scriptInfo.id;

            scriptElement.onload = () => {
                console.log(`${scriptInfo.id}.js loaded successfully`);
                if (typeof window[scriptInfo.initFunction] === 'function') {
                    console.log(`Executing ${scriptInfo.initFunction} function.`);
                    window[scriptInfo.initFunction]();
                } else {
                    console.error(`${scriptInfo.initFunction} function not found in ${scriptInfo.id}.js.`);
                }
            };

            scriptElement.onerror = () => {
                console.error(`Failed to load ${scriptInfo.id}.js`);
            };

            document.body?.appendChild(scriptElement);
        } else {
            console.log(`${scriptInfo.id}.js is already loaded`);
            if (typeof window[scriptInfo.initFunction] === 'function') {
                console.log(`Re-executing ${scriptInfo.initFunction} since ${scriptInfo.id}.js is already loaded.`);
                window[scriptInfo.initFunction]();
            } else {
                console.warn(`${scriptInfo.initFunction} function not found even though the script is loaded.`);
            }
        }
    });
});
/* =========== end_14_authandfxatt =========== */