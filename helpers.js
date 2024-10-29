
// Reorder5: Helper Functions & Utilities

// Helper function to get friendly date format
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

// Function to push Pagesense tracking (corrected to avoid infinite recursion)
function pushPagesense(actionType, customerId) {
    // Prevent recursive calls by using a lock mechanism
    if (window.pushPagesenseLock) {
        console.warn('PushPagesense is currently locked to prevent recursion for action:', actionType);
        return;
    }

    // Ensure that PageSense is loaded before pushing events
    if (typeof window.pagesense === 'undefined') {
        console.warn('PageSense is not yet loaded. Skipping action:', actionType);
        return;
    }

    window.pushPagesenseLock = true;

    try {
        if (typeof window.pushPagesense === 'function') {
            window.pushPagesense(actionType, customerId);
            console.log('Pagesense tracking for action:', actionType, 'Customer ID:', customerId);
        } else {
            console.error('Pagesense function is not defined on the window object.');
        }
    } catch (error) {
        console.error('Error while pushing Pagesense action:', error);
    } finally {
        window.pushPagesenseLock = false;
    }
}

// Debounce function to limit the frequency of pushPagesense calls
function debounce(func, delay) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}

// Debounced version of pushPagesense
const debouncedPushPagesense = debounce(pushPagesense, 2000);

// Function to update _embedded data in localStorage
// Helper function to update _embedded data in localStorage
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

// Attach updateEmbeddedData to window to make it globally accessible
window.updateEmbeddedData = updateEmbeddedData;


// Reorder1: Session Initialization & Management

// Define the SessionManager to handle all session-related tasks
// Reorder1: Session Initialization & Management

// Define the SessionManager to handle all session-related tasks
const SessionManager = {
    session: null,

    initializeSession() {
        console.log("Initializing session...");
        this.session = this.loadOrStartSession();
        this.getSportUrlCookie();
        this.initializeCustomerIdentifiers();
        this.checkForIdentification();
        this.updateUserGeo();
    },

    loadOrStartSession() {
        const storedSession = localStorage.getItem("userSession");
        if (storedSession) {
            console.log("Existing session loaded.", JSON.parse(storedSession));
            return JSON.parse(storedSession);
        }
        const newSession = this.createDefaultSession();
        this.saveSession(newSession);
        console.log("New session started.");
        return newSession;
    },

    createDefaultSession() {
        return {
            status: 'logged out',
            fx_customerId: window.fx_customerId || null,
            userMeta: { lastUpdate: getFriendlyDate(), lastScriptRun: getFriendlyDate(), sessionTime: 0 },
            userCookies: this.getCookies(),
            userGeo: {},
            userPersona: {},
            userCalc: {},
            userContent: {},
            userEvents: []
        };
    },

    initializeCustomerIdentifiers() {
        const customerId = localStorage.getItem("fx_customerId") || this.getCookies()["fx_customerId"] || window.fx_customerId;
        const customerEmail = localStorage.getItem("fx_customerEmail") || this.getCookies()["fx_customer_em"] || window.fx_customerEmail;

        window.fx_customerId = customerId || window.fx_customerId;
        window.fx_customerEmail = customerEmail || window.fx_customerEmail;

        if (customerId) this.session.fx_customerId = customerId;
        if (customerEmail) this.session.fx_customerEmail = customerEmail;

        console.log("Customer Identifiers initialized:", { fx_customerId: window.fx_customerId, fx_customerEmail: window.fx_customerEmail });
    },

    getSportUrlCookie() {
        const sportUrlCookie = document.cookie.split('; ').find(row => row.startsWith('sporturl='));
        if (sportUrlCookie) {
            const sporturlValue = decodeURIComponent(sportUrlCookie.split('=')[1]);
            const urlParams = new URLSearchParams(sporturlValue);
            window.fx_customerId = urlParams.get('cid');
            window.fx_customer_em = urlParams.get('em');
            window.lastvisit = urlParams.get('ts') ? new Date(parseInt(urlParams.get('ts'))).toLocaleString('en-US', { timeZone: 'America/New_York' }) : null;
            console.log("SportURL cookie parsed:", { fx_customerId: window.fx_customerId, fx_customer_em: window.fx_customer_em, lastvisit: window.lastvisit });
        }
    },

    getCookies() {
        return document.cookie.split('; ').reduce((acc, cookie) => {
            const [name, ...rest] = cookie.split('=');
            acc[name] = decodeURIComponent(rest.join('='));
            return acc;
        }, {});
    },

    updateUserGeo() {
        const script = document.createElement('script');
        script.src = "https://get.geojs.io/v1/ip/geo.js";
        script.async = true;
        script.onload = () => console.log("GeoJS script loaded successfully.");
        document.body.appendChild(script);

        window.geoip = (json) => {
            const geoData = { geoIP: json.ip, geoCountry: json.country, geoRegion: json.region, geoCity: json.city, geoTimeZone: json.timezone };
            console.log("Geolocation data fetched:", geoData);
            this.updateSession({ userGeo: geoData });
        };
    },

    checkForIdentification() {
        const cookies = this.getCookies();
        let identified = false;

        if (cookies['fx_customer_sso'] || cookies['fx_customerId'] || cookies['fx_customer_jwt'] || cookies['fx_customer'] || cookies['fx_customer_em'] || cookies['sporturl'] || window.fx_customerEmail || window.fx_customerId) {
            identified = true;
            this.updateSession({ status: 'user-returning' });
            console.log("User identified based on cookies or window properties.");
            if (cookies['fx_customerId']) this.findCustomer(cookies['fx_customerId']);
        }

        console.log("Identification check completed. Identified:", identified);
        this.loadIdentificationScripts();
    },

    updateSession(newData) {
        if (!this.session) this.getSession();
        Object.assign(this.session, newData);
        this.session.userMeta.lastUpdate = getFriendlyDate();
        this.saveSession(this.session);
        console.log("Session updated with new data:", newData);
    },

    saveSession(session) {
        localStorage.setItem("userSession", JSON.stringify(session));
        console.log("Session stored in localStorage:", session);
    },

    getSession() {
        return JSON.parse(localStorage.getItem("userSession"));
    },

    endSession() {
        this.session = null;
        localStorage.removeItem("userSession");
        console.log("Session ended and removed from localStorage.");
    },

    findCustomer(customerId) {
        console.log(`Attempting to find customer with ID: ${customerId}`);
        this.loadAndInitScript(
            'https://sportdogfood.github.io/sport-static-js-server/fxcustomer.js',
            'fxcustomer',
            'fxCustomerInit',
            () => fxCustomerInit(customerId)
        );
    },

    loadIdentificationScripts() {
        const scripts = [
            { src: 'https://sportdogfood.github.io/sport-static-js-server/zocontact.js', id: 'zocontact', initFunction: 'zoContactInit' },
            { src: 'https://sportdogfood.github.io/sport-static-js-server/fxcustomer.js', id: 'fxcustomer', initFunction: 'fxCustomerInit' }
        ];
        scripts.forEach(script => this.loadAndInitScript(script.src, script.id, script.initFunction));
    },

    loadAndInitScript(src, id, initFunction, callback = () => {}) {
        if (!document.getElementById(id)) {
            const scriptElement = document.createElement('script');
            scriptElement.src = src;
            scriptElement.id = id;
            scriptElement.onload = () => {
                console.log(`${id}.js loaded successfully`);
                if (typeof window[initFunction] === 'function') {
                    console.log(`Executing ${initFunction} function.`);
                    window[initFunction]();
                    callback();
                } else {
                    console.error(`${initFunction} function not found in ${id}.js.`);
                }
            };
            scriptElement.onerror = () => console.error(`Failed to load ${id}.js`);
            document.body.appendChild(scriptElement);
        } else {
            console.log(`${id}.js is already loaded`);
            if (typeof window[initFunction] === 'function') window[initFunction]();
        }
    }
};

// Attach the SessionManager to window to make it globally accessible
// Attach the SessionManager to window to make it globally accessible
window.SessionManager = SessionManager;

// Main function to parse query params and populate the form
function populateFormFromParams() {
    const params = new URLSearchParams(window.location.search);
    const loginForm = document.getElementById('loginForm');

    if (!loginForm) {
        console.error("Login form not found");
        return;
    }

    // Populate form fields based on params
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

        if (params.has('sec') && secField) secField.value = params.get('sec');
        if (params.has('stn') && stnField) stnField.value = params.get('stn');
    }
}

// Event listeners for DOM content loaded
if (!window.domContentLoadedListenerAdded) {
    window.domContentLoadedListenerAdded = true;
    document.addEventListener('DOMContentLoaded', () => {
        SessionManager.initializeSession();
        populateFormFromParams(); // Populate the form on page load

        // Add event listeners for buttons
        const buttons = [
            { id: 'login-button', handler: () => {
                SessionManager.handleLogin();
                debouncedPushPagesense('login-click', localStorage.getItem('fx_customerId'));
            }},
            { id: 'logout-button', handler: () => {
                SessionManager.handleLogout();
                debouncedPushPagesense('logout-click', localStorage.getItem('fx_customerId'));
            }},
            { id: 'auth-button', handler: () => {
                authenticateCustomer();
                debouncedPushPagesense('auth-click', null);
            }}
        ];

        buttons.forEach(({ id, handler }) => {
            const button = document.getElementById(id);
            if (button && !button.listenerAdded) {
                button.addEventListener('click', handler);
                button.listenerAdded = true;
            }
        });

        // Handle session state on load
        if (SessionManager.isUserAuthenticated()) {
            buttonMaster('logged in', 'DOMContentLoaded');
            debouncedPushPagesense('session-restored', localStorage.getItem('fx_customerId'));
        } else {
            buttonMaster('logged out', 'DOMContentLoaded');
            debouncedPushPagesense('session-initiated', null);
        }
    });
}

// Define buttonMaster to manage button states
function defineButtonMaster() {
    window.buttonMaster = function(status, caller) {
        const loginButton = document.getElementById('login-button');
        const logoutButton = document.getElementById('logout-button');
        const statusDiv = document.getElementById('status-div');

        const friendlyDate = getFriendlyDate();
        if (statusDiv) {
            statusDiv.textContent = `${status} at ${friendlyDate} by ${caller}`;
            statusDiv.style.display = 'block';
        }

        if (status === 'logged in') {
            if (loginButton) loginButton.style.display = 'none';
            if (logoutButton) logoutButton.style.display = 'inline';
        } else {
            if (loginButton) loginButton.style.display = 'inline';
            if (logoutButton) logoutButton.style.display = 'none';
        }
    };
}

defineButtonMaster();

// Debounce function to limit the frequency of pushPagesense calls
function debounce(func, delay) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}

// Debounced version of pushPagesense
const debouncedPushPagesense = debounce(pushPagesense, 2000);

// Function to push Pagesense tracking (corrected to avoid infinite recursion)
function pushPagesense(actionType, customerId) {
    // Prevent recursive calls by using a lock mechanism
    if (window.pushPagesenseLock) {
        console.warn('PushPagesense is currently locked to prevent recursion for action:', actionType);
        return;
    }

    // Ensure that PageSense is loaded before pushing events
    if (typeof window.pagesense === 'undefined') {
        console.warn('PageSense is not yet loaded. Skipping action:', actionType);
        return;
    }

    window.pushPagesenseLock = true;

    try {
        if (typeof window.pushPagesense === 'function') {
            window.pushPagesense(actionType, customerId);
            console.log('Pagesense tracking for action:', actionType, 'Customer ID:', customerId);
        } else {
            console.error('Pagesense function is not defined on the window object.');
        }
    } catch (error) {
        console.error('Error while pushing Pagesense action:', error);
    } finally {
        window.pushPagesenseLock = false;
    }
}

// ********** Authentication Handling  **********
// Main function to authenticate customer
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

        if (!response.ok) throw new Error(`Network response was not ok (${response.status})`);

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

// Function to display authentication result messages
function displayAuthResult(message) {
    const resultElement = document.getElementById('authResult');
    if (resultElement) {
        resultElement.textContent = message;
        resultElement.style.display = 'block';
    }
}

// Function to handle successful authentication
function handleSuccessfulAuthentication(responseData, email) {
    document.dispatchEvent(new Event('authenticated'));
    window.fx_customerId = responseData.fc_customer_id;
    window.userCustomerData = responseData;
    window.userCustomerEmail = email;

    displayAuthResult("Authentication successful! Welcome.");

    localStorage.setItem("fx_customerEmail", email);
    localStorage.setItem("fx_customerId", responseData.fc_customer_id);

    setAuthenticationCookies(responseData, email);
    const sporturl = generateSportUrl(email, responseData.fc_customer_id);
    document.cookie = `sporturl=${encodeURIComponent(sporturl)}; path=/; max-age=${60 * 60 * 24 * 180}; Secure; SameSite=Strict`;

    fetchCustomerData(responseData.fc_customer_id);
    debouncedPushPagesense('login-success', responseData.fc_customer_id);
    loadPageSenseScript();
}

// Helper function to set authentication cookies
function setAuthenticationCookies(responseData, email) {
    document.cookie = `fx_customer=${responseData.fc_auth_token}; path=/; Secure; SameSite=Strict`;
    document.cookie = `fx_customerId=${responseData.fc_customer_id}; path=/; Secure; SameSite=Strict`;
    document.cookie = `fx_customer_em=${encodeURIComponent(email)}; path=/; Secure; SameSite=Strict`;
    document.cookie = `fx_customer_jwt=${responseData.jwt}; path=/; Secure; SameSite=Strict`;
    document.cookie = `fx_customer_sso=${responseData.sso}; path=/; Secure; SameSite=Strict`;
}

// Helper function to generate sporturl
function generateSportUrl(email, customerId) {
    const sportpin = Math.floor(1000 + Math.random() * 9000);
    const timestamp = Date.now();
    return `https://www.sportdogfood.com/login&em=${encodeURIComponent(email)}&cid=${customerId}&pn=${sportpin}&ts=${timestamp}`;
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

// Placeholder for fetchCustomerData
async function fetchCustomerData(customerId) {
    console.log(`Fetching additional data for customer ID: ${customerId}`);
    // Implement the actual data fetching logic here
}

// Event listener for when the user is authenticated
document.addEventListener('authenticated', () => {
    const scriptsToLoad = [
        { src: 'https://sportdogfood.github.io/sport-static-js-server/fxcustomerzoom.js', id: 'fxcustomerzoom', initFunction: 'customerzoomInit' },
        { src: 'https://sportdogfood.github.io/sport-static-js-server/fxsubscriptions.js', id: 'fxsubscriptions', initFunction: 'subscriptionsInit' },
        { src: 'https://sportdogfood.github.io/sport-static-js-server/fxtransactions.js', id: 'fxtransactions', initFunction: 'transactionsInit' },
        { src: 'https://sportdogfood.github.io/sport-static-js-server/fxattributes.js', id: 'fxattributes', initFunction: 'attributesInit' }
    ];

    scriptsToLoad.forEach(scriptInfo => loadAndInitializeScript(scriptInfo));
});

// Function to load and initialize scripts after authentication
function loadAndInitializeScript({ src, id, initFunction }) {
    if (!document.getElementById(id)) {
        const scriptElement = document.createElement('script');
        scriptElement.src = src;
        scriptElement.id = id;

        scriptElement.onload = () => {
            console.log(`${id}.js loaded successfully`);
            if (typeof window[initFunction] === 'function') {
                console.log(`Executing ${initFunction} function.`);
                window[initFunction]();
            } else {
                console.error(`${initFunction} function not found in ${id}.js.`);
            }
        };

        scriptElement.onerror = () => {
            console.error(`Failed to load ${id}.js`);
        };

        document.body?.appendChild(scriptElement);
    } else {
        console.log(`${id}.js is already loaded`);
        if (typeof window[initFunction] === 'function') {
            console.log(`Re-executing ${initFunction} since ${id}.js is already loaded.`);
            window[initFunction]();
        } else {
            console.warn(`${initFunction} function not found even though the script is loaded.`);
        }
    }
}


// Reorder4: Login & Logout Workflow
// Reorder4: Login & Logout Workflow

SessionManager.handleLogin = function() {
    this.updateSession({ status: 'logged in', calledBy: 'handleLogin' });
    buttonMaster('logged in', 'handleLogin');
    pushPagesense('login', this.session.fx_customerId);

    if (window.fx_customerId) {
        console.log("Authenticated user found, initializing user data...");
        this.initializeUserModules();
    }
};

SessionManager.handleLogout = function() {
    const userSession = localStorage.getItem('userSession');
    if (!userSession) {
        console.error('No user session found in localStorage.');
        return;
    }

    const sessionObject = JSON.parse(userSession);
    const fx_customerEmail = localStorage.getItem('fx_customerEmail');
    const fx_customerId = localStorage.getItem('fx_customerId');
    const logoutDate = new Date().toLocaleString('en-US', { timeZone: 'America/New_York', hour12: false });

    const payload = { ...sessionObject, logoutDate, fx_customerEmail, fx_customerId };
    const proxyUrl = 'https://cat-heroku-proxy-51e72e8e9b26.herokuapp.com/proxy/session';

    fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })
    .then(response => {
        if (!response.ok) throw new Error(`Network response was not ok (${response.status})`);
        return response.json();
    })
    .then(data => {
        console.log('Logout successfully sent:', data);
        this.clearLocalStorage();
        buttonMaster('logged out', 'handleLogout');
        pushPagesense('logout', fx_customerId);
    })
    .catch(error => {
        console.error('There was an error during the logout process:', error);
    });
};

// Helper function to clear local storage on logout
SessionManager.clearLocalStorage = function() {
    const keysToRemove = [
        'userSession', 'fx_customerEmail', 'fx_customerId', 'userState',
        'userZoom', 'userContact', 'userCustomer', 'isAuthenticated',
        'debug_update_fx:subscriptions', 'debug_update_fx:transactions'
    ];
    keysToRemove.forEach(key => localStorage.removeItem(key));
};

// Helper function to initialize user modules
SessionManager.initializeUserModules = function() {
    const initFunctions = [
        this.initializeUserZoom,
        this.initializeUserCart,
        this.initializeUserDesk,
        this.initializeUserCustomer,
        this.initializeUserThrive
    ];
    initFunctions.forEach(fn => fn && fn.call(this));
};

// Placeholder functions for module initialization
SessionManager.initializeUserZoom = function() { console.log("Initializing userZoom..."); };
SessionManager.initializeUserCart = function() { console.log("Initializing user cart..."); };
SessionManager.initializeUserCustomer = function() { console.log("Initializing user customer details..."); };
SessionManager.initializeUserThrive = function() { console.log("Initializing user thrive details..."); };

// Initialize userDesk with dynamic script loading if necessary
SessionManager.initializeUserDesk = function(customerId) {
    if (window.fx_customerId && userSession?.userDesk?.ID == null) {
        console.log("Initializing user desk details...");

        if (typeof UserDesk === 'undefined') {
            this.loadScript('https://sportdogfood.github.io/sport-static-js-server/userdesk.js', 'UserDesk', 'initialize', customerId);
        } else {
            UserDesk.initialize(customerId);
        }
    } else {
        console.log("Skipping user desk initialization: fx_customerId invalid or deskID already present.");
    }
};

// Utility function to dynamically load a script and call an init function if available
SessionManager.loadScript = function(src, globalObjectName, initFunctionName, initArg) {
    const script = document.createElement('script');
    script.src = src;

    script.onload = () => {
        console.log(`${globalObjectName}.js loaded successfully`);
        if (window[globalObjectName] && typeof window[globalObjectName][initFunctionName] === 'function') {
            console.log(`Executing ${initFunctionName} function.`);
            window[globalObjectName][initFunctionName](initArg);
        } else {
            console.error(`${initFunctionName} function not found in ${globalObjectName}.js.`);
        }
    };

    script.onerror = () => console.error(`Failed to load ${globalObjectName}.js`);
    document.head.appendChild(script);
};

// Reorder6: Dynamic Script Loading & Authentication Events
document.addEventListener('authenticated', () => {
    const scriptsToLoad = [
        { src: 'https://sportdogfood.github.io/sport-static-js-server/fxcustomerzoom.js', id: 'fxcustomerzoom', initFunction: 'customerzoomInit' },
        { src: 'https://sportdogfood.github.io/sport-static-js-server/fxsubscriptions.js', id: 'fxsubscriptions', initFunction: 'subscriptionsInit' },
        { src: 'https://sportdogfood.github.io/sport-static-js-server/fxtransactions.js', id: 'fxtransactions', initFunction: 'transactionsInit' },
        { src: 'https://sportdogfood.github.io/sport-static-js-server/fxattributes.js', id: 'fxattributes', initFunction: 'attributesInit' }
    ];

    scriptsToLoad.forEach(({ src, id, initFunction }) => SessionManager.loadScriptIfNotLoaded(src, id, initFunction));
});

// Utility function to load scripts if not already loaded and initialize
SessionManager.loadScriptIfNotLoaded = function(src, id, initFunction) {
    if (!document.getElementById(id)) {
        const scriptElement = document.createElement('script');
        scriptElement.src = src;
        scriptElement.id = id;

        scriptElement.onload = () => {
            console.log(`${id}.js loaded successfully`);
            if (typeof window[initFunction] === 'function') {
                console.log(`Executing ${initFunction} function.`);
                window[initFunction]();
            } else {
                console.error(`${initFunction} function not found in ${id}.js.`);
            }
        };

        scriptElement.onerror = () => console.error(`Failed to load ${id}.js`);
        document.body?.appendChild(scriptElement);
    } else {
        console.log(`${id}.js is already loaded`);
        if (typeof window[initFunction] === 'function') {
            console.log(`Re-executing ${initFunction} since ${id}.js is already loaded.`);
            window[initFunction]();
        } else {
            console.warn(`${initFunction} function not found even though the script is loaded.`);
        }
    }
};

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

