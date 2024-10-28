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
        // Assuming 'sec' and 'stn' are different fields; adjust selectors as needed
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
document.addEventListener('DOMContentLoaded', () => {
    SessionManager.initializeSession();
    populateFormFromParams(); // Populate the form on page load

    const loginButton = document.getElementById('login-button');
    if (loginButton) {
        loginButton.addEventListener('click', () => {
            SessionManager.handleLogin();
        });
    }

    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            SessionManager.handleLogout();
        });
    }

    const authButton = document.getElementById('auth-button');
    if (authButton) {
        authButton.addEventListener('click', () => {
            authenticateCustomer();
        });
    }

    if (SessionManager.isUserAuthenticated()) {
        buttonMaster('logged in', 'DOMContentLoaded');
    } else {
        buttonMaster('logged out', 'DOMContentLoaded');
    }
});

// Authentication and session management
async function authenticateCustomer() {
    const email = document.getElementById('em')?.value;
    const password = document.getElementById('passwordInput')?.value;

    if (!email || !password) {
        const resultElement = document.getElementById('authResult');
        if (resultElement) {
            resultElement.textContent = "Please provide both email and password.";
            resultElement.style.display = 'block';
        }
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
            document.dispatchEvent(new Event('authenticated'));
            window.fx_customerId = responseData.fc_customer_id;

            // Store customer data
            window.userCustomerData = responseData;
            window.userCustomerEmail = email;

            // Direct DOM update for success message
            const resultElement = document.getElementById('authResult');
            if (resultElement) {
                resultElement.textContent = "Authentication successful! Welcome.";
                resultElement.style.display = 'block';
            }

            // Set fx_customerEmail and fx_customerId in localStorage
            localStorage.setItem("fx_customerEmail", email);
            localStorage.setItem("fx_customerId", responseData.fc_customer_id);

            // Set cookies for authenticated user
            document.cookie = `fx_customer=${responseData.fc_auth_token}; path=/; Secure; SameSite=Strict`;
            document.cookie = `fx_customerId=${responseData.fc_customer_id}; path=/; Secure; SameSite=Strict`;
            document.cookie = `fx_customer_em=${encodeURIComponent(email)}; path=/; Secure; SameSite=Strict`;
            document.cookie = `fx_customer_jwt=${responseData.jwt}; path=/; Secure; SameSite=Strict`;
            document.cookie = `fx_customer_sso=${responseData.sso}; path=/; Secure; SameSite=Strict`;

            const sportpin = Math.floor(1000 + Math.random() * 9000);
            const timestamp = Date.now();
            const sporturl = `https://www.sportdogfood.com/login&em=${encodeURIComponent(email)}&cid=${responseData.fc_customer_id}&pn=${sportpin}&ts=${timestamp}`;
            document.cookie = `sporturl=${encodeURIComponent(sporturl)}; path=/; max-age=${60 * 60 * 24 * 180}; Secure; SameSite=Strict`;

            // Update user state and session
            // Removed initializeAndRun as it's undefined. If needed, define it appropriately.
            // initializeAndRun('authenticateCustomer');

            // Fetch additional customer data
            await fetchCustomerData(responseData.fc_customer_id);

        } else {
            // Direct DOM update for failure message
            const resultElement = document.getElementById('authResult');
            if (resultElement) {
                resultElement.textContent = "Authentication failed: Missing session_token or customer ID.";
                resultElement.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Error during customer authentication:', error);

        // Direct DOM update for error message
        const resultElement = document.getElementById('authResult');
        if (resultElement) {
            resultElement.textContent = `Error: ${error.message}`;
            resultElement.style.display = 'block';
        }
    }
}

// Define buttonMaster to manage button states
defineButtonMaster();
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

// Function to handle user attributes
function userAttributes() {
    try {
        const userZoom = JSON.parse(localStorage.getItem('userZoom'));
        if (!userZoom || !userZoom._embedded?.['fx:attributes']) {
            throw new Error('User attributes not available');
        }
        const attributes = userZoom._embedded['fx:attributes'];

        let userSession = JSON.parse(localStorage.getItem('userSession')) || {};

        attributes.forEach((attribute) => {
            const name = attribute?.name || '';
            const value = attribute?.value ?? null;

            const attributeData = {
                attributeName: name,
                attributeValue: value,
                lastupdate: getFriendlyDateTime(),
            };

            userSession[`userAttribute_${name}`] = attributeData;
        });

        // Update session
        localStorage.setItem('userSession', JSON.stringify(userSession));
    } catch (error) {
        console.error('An error occurred in userAttributes:', error);
    }
}

// Function to push Pagesense tracking
function pushPagesense(actionType, customerId) {
    console.log('Pagesense tracking for action:', actionType, 'Customer ID:', customerId);
    // Implement Pagesense-related tracking or interaction here based on action type
}

// Helper function to update _embedded data in localStorage
function updateEmbeddedData(key, data) {
    let userZoom = JSON.parse(localStorage.getItem('userZoom')) || {};

    if (!userZoom._embedded) {
        userZoom._embedded = {};
    }

    userZoom._embedded[key] = data;

    // Log the update for visibility
    console.log(`Updating _embedded with key: ${key}, data:`, data);

    // Update the localStorage
    localStorage.setItem('userZoom', JSON.stringify(userZoom));

    // Set a new localStorage item to confirm the update (for debugging purposes)
    localStorage.setItem(`debug_update_${key}`, JSON.stringify(data));
    console.log(`Set debug_update_${key} in localStorage:`, data);
}

// Attach `updateEmbeddedData` to `window` to make it globally accessible
window.updateEmbeddedData = updateEmbeddedData;

document.addEventListener('authenticated', () => {
    const scriptsToLoad = [
        { src: 'https://sportdogfood.github.io/sport-static-js-server/fxcustomerzoom.js', id: 'fxcustomerzoom', initFunction: 'customerZoomInit' },
        { src: 'https://sportdogfood.github.io/sport-static-js-server/fxsubscriptions.js', id: 'fxsubscriptions', initFunction: 'subscriptionsInit' },
        { src: 'https://sportdogfood.github.io/sport-static-js-server/fxtransactions.js', id: 'fxtransactions', initFunction: 'transactionsInit' }
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
                    console.error(`${scriptInfo.initFunction} function not found in ${scriptInfo.id}.js.`);
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
                console.warn(`${scriptInfo.initFunction} function not found even though the script is loaded. Ensure it was correctly attached to the window.`);
            }
        }
    });
});

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

// Helper function to get friendly date and time format
function getFriendlyDateTime() {
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
                userGeo: this.getUserGeo(), // Initialize userGeo with geolocation data
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
            userGeo: this.getUserGeo(), // Initialize userGeo with geolocation data
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

    // Check if the user is authenticated based on cookies and session
    isUserAuthenticated() {
        const cookieExists = document.cookie.includes('fx_customer_sso');
        const cookieCustomerIdExists = document.cookie.includes('fx_customerId');
        const cookieJwtExists = document.cookie.includes('fx_customer_jwt');

        const hasValidSession = this.session && this.session.status === 'logged in';
        let indicators = 0;

        if (cookieExists) indicators++;
        if (cookieCustomerIdExists) indicators++;
        if (cookieJwtExists) indicators++;
        if (hasValidSession) indicators++;

        console.log("Authentication check - indicators:", indicators);
        return indicators >= 2;
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

    // Mock function to get user geolocation data
    getUserGeo() {
        // Placeholder for real geolocation logic (e.g., using an API)
        const geoData = {
            country: "Unknown",
            region: "Unknown",
            city: "Unknown"
        };
        console.log("Geolocation data retrieved:", geoData);
        return geoData;
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

    // Manage user login
    handleLogin() {
        this.updateSession({ status: 'logged in', calledBy: 'handleLogin' });
        buttonMaster('logged in', 'handleLogin');
        pushPagesense('login', this.session.fx_customerId);

        // If the customer is authenticated, initialize userZoom
        if (window.fx_customerId) {
            console.log("Authenticated user found, initializing userZoom...");
            this.initializeUserZoom();
            this.initializeUserCart();
            this.initializeUserDesk();
            this.initializeUserCustomer();
            this.initializeUserThrive();
        }
    },

    // Manage user logout
    handleLogout() {
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
    },

    // Initialize userZoom (Placeholder function; define as needed)
    initializeUserZoom() {
        console.log("Initializing userZoom...");
        // Implement initialization logic here
    },

    // Initialize userCart
    initializeUserCart() {
        console.log("Initializing user cart...");
        // Placeholder function to initialize user cart details if needed.
    },

    // Initialize userDesk
    initializeUserDesk() {
        console.log("Initializing user desk details...");
        // Placeholder function to initialize user desk details if needed.
    },

    // Initialize userCustomer
    initializeUserCustomer() {
        console.log("Initializing user customer details...");
        // Placeholder function to initialize user customer details if needed.
    },

    // Initialize userThrive
    initializeUserThrive() {
        console.log("Initializing user thrive details...");
        // Placeholder function to initialize user thrive details if needed.
    },

    // Initialize userAuto
    initializeUserAuto() {
        console.log("Initializing user auto details...");
        // Placeholder function to initialize user auto details if needed.
    },

    // Initialize userTrack
    initializeUserTrack() {
        console.log("Initializing user tracking details...");
        // Placeholder function to initialize user tracking details if needed.
    },

    // Initialize userTrans
    initializeUserTrans() {
        console.log("Initializing user transaction details...");
        // Placeholder function to initialize user transaction details if needed.
    },

    // Initialize userGetAgain
    initializeUserGetAgain() {
        console.log("Initializing user 'get again' details...");
        // Placeholder function to initialize user 'get again' details if needed.
    }
};

// Load identification scripts before authentication to assist in identifying users
SessionManager.loadIdentificationScripts = function() {
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
                    console.error(`${scriptInfo.initFunction} function not found in ${scriptInfo.id}.js.`);
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
                console.warn(`${scriptInfo.initFunction} function not found even though the script is loaded. Ensure it was correctly attached to the window.`);
            }
        }
    });
};

// Ensure that fetchCustomerData is defined. Placeholder function:
async function fetchCustomerData(customerId) {
    console.log(`Fetching additional data for customer ID: ${customerId}`);
    // Implement the actual data fetching logic here
}

// Remove undefined function calls or define them as needed
// For example, if initializeAndRun is required, define it:
function initializeAndRun(context) {
    console.log(`Initializing and running context: ${context}`);
    // Implement the actual initialization logic here
}

// Ensure that findCustomer is defined if it's being used
function findCustomer(jwtToken) {
    console.log(`Finding customer with JWT token: ${jwtToken}`);
    // Implement the actual find customer logic here
}
