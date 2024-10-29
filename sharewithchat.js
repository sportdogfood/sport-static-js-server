
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

// Attach updateEmbeddedData 
window.updateEmbeddedData = updateEmbeddedData;

const SessionManager = {
    session: null, // Placeholder for session data

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
        this.getSportUrlCookie();
        this.initializeCustomerIdentifiers(); 
        this.checkForIdentification(); 
        this.updateUserGeo(); 
    },

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
                lastUpdate: getFriendlyDate(),
                lastScriptRun: getFriendlyDate(),
                sessionTime: 0 // Initialize sessionTime in seconds
            },
            userCookies: this.getCookies(), // Initialize 
            userGeo: {}, // Initialize 
            userPersona: {}, // Initialize 
            userCalc: {}, // Initialize 
            userCompare: {}, // Initialize 
            userEvents: [] // Initialize y
        };
        this.updateLocalStorage();
        console.log("Session started:", this.session);
    },

    endSession() {
        this.session = null;
        localStorage.removeItem("userSession");
        console.log("Session ended and removed from localStorage.");
    },

    // Helper to ensure localStorage
    updateLocalStorage() {
        if (this.session) {
            localStorage.setItem("userSession", JSON.stringify(this.session));
            console.log("Session stored in localStorage:", this.session);
        }
    },

    // Retrieve sporturl 
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

    // Asynchronously fetch user 
    updateUserGeo() {
        const script = document.createElement('script');
        script.src = "https://get.geojs.io/v1/ip/geo.js";
        script.async = true;
        script.onload = () => {
            if (typeof geoip === 'function') {
                console.log("GeoJS script ");
            }
        };
        document.body.appendChild(script);

        // Define the geoip 
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

checkForIdentification() {
    const cookies = this.getCookies();
    let identified = false;
    let jwtToken = null;
    let ssoToken = null;

    // Check if fx_customer_sso exists
    if (cookies['fx_customer_sso']) {
        ssoToken = cookies['fx_customer_sso'];
        console.log("SSO token found. Processing fx_customer_sso...");
        
        const urlParams = new URLSearchParams(ssoToken.split('?')[1]);
        const fcCustomerId = urlParams.get('fc_customer_id');
        const fcAuthToken = urlParams.get('fc_auth_token');

        // Set cookies for fc_customer_id and fc_auth_token
        if (fcCustomerId) {
            document.cookie = `fc_customer_id=${fcCustomerId}; path=/;`; 
        }
        if (fcAuthToken) {
            document.cookie = `fc_auth_token=${fcAuthToken}; path=/;`; 
        }

        // If fx_customer_id is null and fc_customer_id is not null, set fx_customer_id
        if (!cookies['fx_customer_id'] && fcCustomerId) {
            document.cookie = `fx_customer_id=${fcCustomerId}; path=/;`;
        }
    }

    // Check for  
    if (cookies['fx_customer_sso'] || cookies['fx_customerId'] || cookies['fx_customer_jwt'] || cookies['fx_customer'] || cookies['fx_customer_em'] || cookies['sporturl'] || window.fx_customerEmail || window.fx_customerId) {
        identified = true;
        console.log("User identified based on cookies or window properties.");
        
        // Update session state
        this.updateSession({ status: 'user-returning' });
        jwtToken = cookies['fx_customer_jwt'] || window.fx_customerJwt; 
        ssoToken = cookies['fx_customer_sso']; 
    }

    // If window.fx_customerId is still null and fx_customer_id exists, 
    if (!window.fx_customerId && cookies['fx_customer_id']) {
        window.fx_customerId = cookies['fx_customer_id'];
    }

    console.log("Identification check completed. Identified:", identified);

    // Placeholder for userCart 
    if (identified && (jwtToken || ssoToken)) {
        console.log("JWT or SSO token found. Setting up userCart...");
        this.initializeUserCartPlaceholder();
    }

    // Trigger findCustomer 
    if (identified && cookies['fx_customerId']) {
        console.log("Attempting to find customer details with fx_customerId.");
        this.findCustomer(cookies['fx_customerId']);
    }

    // Load additional scripts in an attempt 
    this.loadIdentificationScripts();
},

// Placeholder function to initialize userCart
initializeUserCartPlaceholder() {
    console.log("Placeholder: Initializing userCart...");
   
},

   // Function to handle finding customer 
findCustomer() {
    // Attempt to get customer ID from window object
    const customerId = window.fx_customerId;

    // Return early if no customer ID is found
    if (!customerId) {
        console.error("Customer ID is not defined in window properties");
        return; // Return
    }

    console.log(`Attempting to find customer with ID: ${customerId}`);

    // Load the fxcustomer.js 
    if (!document.getElementById('fxcustomer')) {
        const scriptElement = document.createElement('script');
        scriptElement.src = 'https://sportdogfood.github.io/sport-static-js-server/fxcustomer.js';
        scriptElement.id = 'fxcustomer';

        scriptElement.onload = () => {
            console.log("fxcustomer.js loaded successfully");
            this.initiateCustomerFetch(customerId);
        };

        scriptElement.onerror = () => {
            console.error("Failed to load fxcustomer.js.");
            // Continue identification 
            this.continueIdentificationChecks();
        };

        document.body.appendChild(scriptElement);
    } else {
        console.log("fxcustomer.js is already loaded.");
        this.initiateCustomerFetch(customerId);
    }
},

// Function to initiate 
initiateCustomerFetch(customerId) {
    if (typeof fxCustomerInit === 'function') {
        fxCustomerInit(customerId)
            .then(response => {
                if (response && response.ok) {
                    console.log("Customer found, updating session.");
                    this.updateSession({ userCustomer: response.data });
                } else {
                    console.error("Failed to find customer with fxcustomer.js.");
                    // Continue with
                    this.continueIdentificationChecks();
                }
            })
            .catch(error => {
                console.error("Error in fetching customer data", error);
                // Continue with other checks if needed
                this.continueIdentificationChecks();
            });
    } else {
        console.error("not defined in fxcustomer.js.");
        // Continue identification checks 
        this.continueIdentificationChecks();
    }
},

continueIdentificationChecks() {
    console.log("Continuing with additional ");
    // Placeholder 
},

    // Load identification 
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
                        window[scriptInfo.initFunction](); 
                    } else {
                        console.log(`Creating placeholder function for ${scriptInfo.initFunction}.`);
                        window[scriptInfo.initFunction] = function() {
                            console.warn(`${scriptInfo.initFunction} `);
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
                    window[scriptInfo.initFunction](); // Call the initialization
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

window.SessionManager = SessionManager;

function populateFormFromParams() {
    const params = new URLSearchParams(window.location.search);
    const loginForm = document.getElementById('loginForm');

    if (!loginForm) {
        console.error("Login form not found");
        return;
    }

    // Populate form 
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

if (!window.domContentLoadedListenerAdded) {
    window.domContentLoadedListenerAdded = true;
    document.addEventListener('DOMContentLoaded', () => {
        if (SessionManager && typeof SessionManager.initializeSession === 'function') {
            SessionManager.initializeSession();
        } else {
            console.error('SessionManager.initializeSession is not a function or is undefined');
        }
        populateFormFromParams(); // Populate the form on page load

        function attachButtonEventListeners() {
            const buttons = [
                { id: 'login-button', handler: () => {
                    console.log('[EventListener] Login button clicked.');
                    if (SessionManager && typeof SessionManager.handleLogin === 'function') {
                        SessionManager.handleLogin();
                        debouncedPushPagesense('login-click', localStorage.getItem('fx_customerId'));
                    } else {
                        console.error('[EventListener] SessionManager.handleLogin is not a function or is undefined.');
                    }
                }},
                { id: 'logout-button', handler: () => {
                    console.log('[EventListener] Logout button clicked.');
                    if (SessionManager && typeof SessionManager.handleLogout === 'function') {
                        SessionManager.handleLogout();
                        debouncedPushPagesense('logout-click', localStorage.getItem('fx_customerId'));
                    } else {
                        console.error('[EventListener] SessionManager.handleLogout is not a function or is undefined.');
                    }
                }},
                { id: 'auth-button', handler: () => {
                    console.log('[EventListener] Auth button clicked.');
                    if (typeof authenticateCustomer === 'function') {
                        authenticateCustomer().then(() => {
                            debouncedPushPagesense('auth-click', null);
                        }).catch((error) => {
                            console.error('[EventListener] Error during authenticateCustomer:', error);
                        });
                    } else {
                        console.error('[EventListener] authenticateCustomer is not a function or is undefined.');
                    }
                }}
            ];
        
            buttons.forEach(({ id, handler }) => {
                const button = document.getElementById(id);
                if (button && !button.listenerAdded) {
                    console.log(`[EventListener] Adding click event listener to button: ${id}`);
                    button.addEventListener('click', handler);
                    button.listenerAdded = true;
                } else if (!button) {
                    console.error(`[EventListener] Button with ID: ${id} not found in the DOM.`);
                }
            });
        }

        attachButtonEventListeners();

// Add login button handler programmatically
document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('login-button');
    if (loginButton && !loginButton.listenerAdded) {
        loginButton.addEventListener('click', () => {
            console.log('[EventListener] Login button clicked. Redirecting to login page.');
            window.location.href = '/login';
        });
        loginButton.listenerAdded = true;
    }
});

const observer = new MutationObserver(() => {
    const loginButton = document.getElementById('login-button');
    const logoutButton = document.getElementById('logout-button');
    const statusDiv = document.getElementById('status-div');

    console.log(`[MutationObserver] Observing changes. loginButton found: ${!!loginButton}, logoutButton found: ${!!logoutButton}, statusDiv found: ${!!statusDiv}`);
    
    if (loginButton && logoutButton && statusDiv) {
        observer.disconnect(); // Stop observing once buttons are found
        console.log('[MutationObserver] Buttons found. Stopped observing and invoking buttonMaster.');
        buttonMaster('logged out', 'observer'); // Set initial state to logged out
    }
});

observer.observe(document.body, { childList: true, subtree: true });

        if (SessionManager && typeof SessionManager.isUserAuthenticated === 'function' ? SessionManager.isUserAuthenticated() : false) {
            buttonMaster('logged in', 'DOMContentLoaded');
            debouncedPushPagesense('session-restored', localStorage.getItem('fx_customerId'));
        } else {
            buttonMaster('logged out', 'DOMContentLoaded');
            debouncedPushPagesense('session-initiated', null);
        }
    });
}

// Define buttonMaster


// Add login, logout,
document.addEventListener('DOMContentLoaded', () => {
    attachButtonEventListeners();

    // Initial call to buttonMaster
    const initialStatus = localStorage.getItem('fx_customerId') ? 'logged in' : 'logged out';
    buttonMaster(initialStatus, 'initial load');
});




function attachButtonEventListeners() {
    const buttons = [
        {
            id: 'login-button', handler: () => {
                console.log('[EventListener] Login button clicked.');
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
                console.log('[EventListener] Logout button clicked.');
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
                console.log('[EventListener] Auth button clicked.');
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
            console.log(`[EventListener] Adding click event listener to button: ${id}`);
            button.addEventListener('click', handler);
            button.listenerAdded = true;
        } else if (!button) {
            console.error(`[EventListener] Button with ID: ${id} not found in the DOM.`);
        }
    });
}


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

// Define the buttonMaster
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

    // Set up MutationObserver for further dynamic changes
    const observer = new MutationObserver(() => {
        const loginButton = document.getElementById('login-button');
        const logoutButton = document.getElementById('logout-button');
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


function debounce(func, delay) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}

// Debounced version of pushPagesense
//const debouncedPushPagesense = debounce(pushPagesense, 2000);

// Function to 
function pushPagesense(actionType, customerId) {
    // Prevent recursive 
    if (window.pushPagesenseLock) {
        console.warn('PushPagesense is currently locked to prevent recursion for action:', actionType);
        return;
    }

    // Ensure that 
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

// Function to authenticate 
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

// Function to display
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

    // Load PageSense 
    loadPageSenseScript();
}

// Function to
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
  
}






// Manage user logout
SessionManager.handleLogout = function() {
    console.log('[SessionManager] handleLogout called.');
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

// Initialize userZoom 
SessionManager.initializeUserZoom = function() {
    console.log("Initializing userZoom...");

};

// Initialize userCart
SessionManager.initializeUserCart = function() {
    console.log("Initializing user cart...");
  
};

SessionManager.initializeUserDesk = function(customerId) {
  // Ensure fx_customerId
  if (window.fx_customerId && userSession?.userDesk?.ID == null) {
    console.log("Initializing user desk details...");
    
  
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
    console.log("either fx_customerId is invalid or deskID is already present.");
  }
};

// Initialize userCustomer
SessionManager.initializeUserCustomer = function() {
    console.log("Initializing user customer details...");
    // Placeholder 
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

// Function to load 
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
