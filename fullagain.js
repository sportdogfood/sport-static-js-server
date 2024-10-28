
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

// Reorder1: Session Initialization & Management

// Define the SessionManager to handle all session-related tasks
const SessionManager = {
    session: null, // Placeholder for session data

    // Initialize or retrieve the session from localStorage
    initializeSession() {
        console.log("Initializing session...");
        if (!localStorage.getItem("userSession")) {
            this.startSession({
                status: 'logged out', // Default state
                fx_customerId: window.fx_customerId || null,
                userMeta: {
                    lastUpdate: getFriendlyDate(),
                    lastScriptRun: getFriendlyDate(),
                    sessionTime: 0 // Initialize sessionTime in seconds
                },
                userCookies: this.getCookies(), // Initialize userCookies by getting current cookies
                userGeo: {}, // Initialize userGeo as an empty object, will be updated later asynchronously
                userPersona: {}, // Initialize userPersona as an empty object
                userCalc: {}, // Initialize userCalc as an empty object
                userContent: {}, // Initialize userContent as an empty object
                userEvents: [] // Initialize userEvents as an empty array
            });
            console.log("New session started.");
        } else {
            this.getSession();
            console.log("Existing session loaded.", this.session);
        }
        this.getSportUrlCookie();
        this.initializeCustomerIdentifiers(); // Initialize fx_customerId and fx_customerEmail globally
        this.checkForIdentification(); // Check if we can identify the user based on cookies or window properties
        this.updateUserGeo(); // Fetch geolocation data using GeoJS
    },

    // Initialize or retrieve customer identifiers globally
    initializeCustomerIdentifiers() {
        const customerId = localStorage.getItem("fx_customerId") || this.getCookies()["fx_customerId"] || window.fx_customerId;
        const customerEmail = localStorage.getItem("fx_customerEmail") || this.getCookies()["fx_customer_em"] || window.fx_customerEmail;

        if (customerId) {
            window.fx_customerId = customerId;
            if (this.session) this.session.fx_customerId = customerId;
        }

        if (customerEmail) {
            window.fx_customerEmail = customerEmail;
            if (this.session) this.session.fx_customerEmail = customerEmail;
        }

        console.log("Customer Identifiers initialized:", { fx_customerId: window.fx_customerId, fx_customerEmail: window.fx_customerEmail });
    },

    // Retrieve the session from localStorage
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
                lastUpdate: getFriendlyDate(),
                lastScriptRun: getFriendlyDate(),
                sessionTime: 0 // Initialize sessionTime in seconds
            },
            userCookies: this.getCookies(), // Initialize userCookies by getting current cookies
            userGeo: {}, // Initialize userGeo as an empty object, will be updated later asynchronously
            userPersona: {}, // Initialize userPersona as an empty object
            userCalc: {}, // Initialize userCalc as an empty object
            userCompare: {}, // Initialize userCompare as an empty object
            userEvents: [] // Initialize userEvents as an empty array
        };
        this.updateLocalStorage();
        console.log("Session started:", this.session);
    },

    // End the current session
    endSession() {
        this.session = null;
        localStorage.removeItem("userSession");
        console.log("Session ended and removed from localStorage.");
    },

    // Helper to ensure localStorage is always updated with the current session
    updateLocalStorage() {
        if (this.session) {
            localStorage.setItem("userSession", JSON.stringify(this.session));
            console.log("Session stored in localStorage:", this.session);
        }
    },

    // Retrieve sporturl cookie and set global properties if found
    getSportUrlCookie() {
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
    },

    // Retrieve all cookies as an object
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
    },

    // Asynchronously fetch user geolocation data using GeoJS
    updateUserGeo() {
        const script = document.createElement('script');
        script.src = "https://get.geojs.io/v1/ip/geo.js";
        script.async = true;
        script.onload = () => {
            if (typeof geoip === 'function') {
                console.log("GeoJS script loaded successfully, fetching geolocation data...");
            }
        };
        document.body.appendChild(script);

        // Define the geoip callback function that GeoJS calls automatically
        window.geoip = (json) => {
            const geoData = {
                geoIP: json.ip,
                geoCountry: json.country,
                geoRegion: json.region,
                geoCity: json.city,
                geoTimeZone: json.timezone
            };
            console.log("Geolocation data fetched:", geoData);
            this.updateSession({ userGeo: geoData });
        };
    },

    // Check for identification using cookies and window properties
    checkForIdentification() {
        const cookies = this.getCookies();
        let identified = false;
        let jwtToken = null;

        if (cookies['fx_customer_sso'] || cookies['fx_customerId'] || cookies['fx_customer_jwt'] || cookies['fx_customer'] || cookies['fx_customer_em'] || cookies['sporturl'] || window.fx_customerEmail || window.fx_customerId) {
            identified = true;
            console.log("User identified based on cookies or window properties.");
            // Update session state
            this.updateSession({ status: 'user-returning' });
            jwtToken = cookies['fx_customer_jwt'] || window.fx_customerJwt; // Get JWT token if available
        }

        console.log("Identification check completed. Identified:", identified);

        // Trigger to call findCustomer.js if a JWT token is found
        if (identified && jwtToken) {
            console.log("Triggering findCustomer with JWT token.");
            // Ensure that findCustomer is defined elsewhere in your codebase
            if (typeof findCustomer === 'function') {
                findCustomer(jwtToken);
            } else {
                console.error("findCustomer function is not defined.");
            }
        }

        // Load additional scripts in an attempt to identify the user prior to authentication
        this.loadIdentificationScripts();
    },

    // Load identification scripts before authentication to assist in identifying users
    loadIdentificationScripts() {
        const scriptsToLoad = [
            { src: 'https://sportdogfood.github.io/sport-static-js-server/zocontact.js', id: 'zocontact', initFunction: 'zoContactInit' },
            { src: 'https://sportdogfood.github.io/sport-static-js-server/fxcustomer.js', id: 'fxcustomer', initFunction: 'fxCustomerInit' }
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
                        window[scriptInfo.initFunction](); // Call the initialization function defined in each script
                    } else {
                        console.log(`Creating placeholder function for ${scriptInfo.initFunction}.`);
                        window[scriptInfo.initFunction] = function() {
                            console.warn(`${scriptInfo.initFunction} is a placeholder and has no effect.`);
                        };
                    }
                };

                scriptElement.onerror = () => {
                    console.error(`Failed to load ${scriptInfo.id}.js`);
                };

                if (document.body) {
                    document.body.appendChild(scriptElement);
                } else {
                    console.error("document.body is null, unable to append script element.");
                }
            } else {
                console.log(`${scriptInfo.id}.js is already loaded`);
                if (typeof window[scriptInfo.initFunction] === 'function') {
                    console.log(`Re-executing ${scriptInfo.initFunction} since ${scriptInfo.id}.js is already loaded.`);
                    window[scriptInfo.initFunction](); // Call the initialization function in case the script was loaded but not initialized
                } else {
                    console.log(`Creating placeholder function for ${scriptInfo.initFunction}.`);
                    window[scriptInfo.initFunction] = function() {
                        console.warn(`${scriptInfo.initFunction} is a placeholder and has no effect.`);
                    };
                }
            }
        });
    }
};

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

        if (params.has('sec') && secField) {
            secField.value = params.get('sec');
        }

        if (params.has('stn') && stnField) {
            stnField.value = params.get('stn');
        }
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
        if (SessionManager && typeof SessionManager.isUserAuthenticated === 'function' ? SessionManager.isUserAuthenticated() : false) {
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

// Initialize buttonMaster to make it globally accessible
defineButtonMaster();


// Reorder2: User Interaction Management & Event Handling

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

        if (params.has('sec') && secField) {
            secField.value = params.get('sec');
        }

        if (params.has('stn') && stnField) {
            stnField.value = params.get('stn');
        }
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
//const debouncedPushPagesense = debounce(pushPagesense, 2000);

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

// Reorder3: Authentication Handling

// Function to authenticate the customer
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

    document.cookie = `fx_customer=${responseData.fc_auth_token}; path=/; Secure; SameSite=Strict`;
    document.cookie = `fx_customerId=${responseData.fc_customer_id}; path=/; Secure; SameSite=Strict`;
    document.cookie = `fx_customer_em=${encodeURIComponent(email)}; path=/; Secure; SameSite=Strict`;
    document.cookie = `fx_customer_jwt=${responseData.jwt}; path=/; Secure; SameSite=Strict`;
    document.cookie = `fx_customer_sso=${responseData.sso}; path=/; Secure; SameSite=Strict`;

    const sportpin = Math.floor(1000 + Math.random() * 9000);
    const timestamp = Date.now();
    const sporturl = `https://www.sportdogfood.com/login&em=${encodeURIComponent(email)}&cid=${responseData.fc_customer_id}&pn=${sportpin}&ts=${timestamp}`;
    document.cookie = `sporturl=${encodeURIComponent(sporturl)}; path=/; max-age=${60 * 60 * 24 * 180}; Secure; SameSite=Strict`;

    fetchCustomerData(responseData.fc_customer_id);
    debouncedPushPagesense('login-success', responseData.fc_customer_id);

    // Load PageSense script dynamically after successful authentication
    loadPageSenseScript();
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
                console.warn(`${scriptInfo.initFunction} function not found even though the script is loaded. Ensure it was correctly attached to the window.`);
            }
        }
    });
});

// Reorder4: Login & Logout Workflow

// Manage user login
SessionManager.handleLogin = function() {
    this.updateSession({ status: 'logged in', calledBy: 'handleLogin' });
    buttonMaster('logged in', 'handleLogin');
    pushPagesense('login', this.session.fx_customerId);

    // If the customer is authenticated, initialize user-specific data
    if (window.fx_customerId) {
        console.log("Authenticated user found, initializing user data...");
        this.initializeUserZoom();
        this.initializeUserCart();
        this.initializeUserDesk();
        this.initializeUserCustomer();
        this.initializeUserThrive();
    }
};

// Manage user logout
SessionManager.handleLogout = function() {
    // Custom logout process
    const userSession = localStorage.getItem('userSession');
    if (!userSession) {
        console.error('No user session found in localStorage.');
        return;
    }

    // Parse the session object
    const sessionObject = JSON.parse(userSession);

    // Retrieve fx_customerEmail and fx_customerId from localStorage
    const fx_customerEmail = localStorage.getItem('fx_customerEmail');
    const fx_customerId = localStorage.getItem('fx_customerId');

    // Get the current logout date in ISO US time format
    const logoutDate = new Date().toLocaleString('en-US', { timeZone: 'America/New_York', hour12: false });

    // Construct payload
    const payload = {
        ...sessionObject,
        logoutDate,
        fx_customerEmail,
        fx_customerId,
    };

    // Proxy endpoint URL
    const proxyUrl = 'https://cat-heroku-proxy-51e72e8e9b26.herokuapp.com/proxy/session';

    // Send the payload to the proxy server
    fetch(proxyUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Network response was not ok (${response.status})`);
            }
            return response.json();
        })
        .then((data) => {
            console.log('Logout successfully sent:', data);
            // Additional cleanup after successful logout
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
            console.error('There was an error during the logout process:', error);
        });
};

// Initialize userZoom (Placeholder function; define as needed)
SessionManager.initializeUserZoom = function() {
    console.log("Initializing userZoom...");
    // Implement initialization logic here
};

// Initialize userCart
SessionManager.initializeUserCart = function() {
    console.log("Initializing user cart...");
    // Placeholder function to initialize user cart details if needed.
};

SessionManager.initializeUserDesk = function(customerId) {
  // Ensure fx_customerId is valid and userSession.userDesk.deskID is not present
  if (window.fx_customerId && userSession?.userDesk?.ID == null) {
    console.log("Initializing user desk details...");
    
    // Load the userdesk.js script dynamically if it's not already loaded
    if (typeof UserDesk === 'undefined') {
      var script = document.createElement('script');
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
  } else {
    console.log("Skipping user desk initialization: either fx_customerId is invalid or deskID is already present.");
  }
};

// Initialize userCustomer
SessionManager.initializeUserCustomer = function() {
    console.log("Initializing user customer details...");
    // Placeholder function to initialize user customer details if needed.
};

// Initialize userThrive
SessionManager.initializeUserThrive = function() {
    console.log("Initializing user thrive details...");
    // Placeholder function to initialize user thrive details if needed.
};

// Initialize userAuto
SessionManager.initializeUserAuto = function() {
    console.log("Initializing user auto details...");
    // Placeholder function to initialize user auto details if needed.
};

// Initialize userTrack
SessionManager.initializeUserTrack = function() {
    console.log("Initializing user tracking details...");
    // Placeholder function to initialize user tracking details if needed.
};

// Initialize userTrans
SessionManager.initializeUserTrans = function() {
    console.log("Initializing user transaction details...");
    // Placeholder function to initialize user transaction details if needed.
};

// Initialize userGetAgain
SessionManager.initializeUserGetAgain = function() {
    console.log("Initializing user 'get again' details...");
    // Placeholder function to initialize user 'get again' details if needed.
};


// Reorder6: Dynamic Script Loading & Authentication Events

// Event listener for when the user is authenticated
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
                console.warn(`${scriptInfo.initFunction} function not found even though the script is loaded. Ensure it was correctly attached to the window.`);
            }
        }
    });
});

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
