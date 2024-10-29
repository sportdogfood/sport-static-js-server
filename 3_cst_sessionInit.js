/* =========== start_3_sessionInit =========== */

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
            userEvents: [] // Initialize
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

    // Asynchronously fetch user geo-location
    updateUserGeo() {
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

        // Check for identification
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

        // Placeholder for userCart initialization
        if (identified && (jwtToken || ssoToken)) {
            console.log("JWT or SSO token found. Setting up userCart...");
            this.initializeUserCartPlaceholder();
        }

        // Trigger findCustomer if identified
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
        const customerId = window.fx_customerId;

        if (!customerId) {
            console.error("Customer ID is not defined in window properties");
            return;
        }

        console.log(`Attempting to find customer with ID: ${customerId}`);

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
                this.continueIdentificationChecks();
            };

            document.body.appendChild(scriptElement);
        } else {
            console.log("fxcustomer.js is already loaded.");
            this.initiateCustomerFetch(customerId);
        }
    },

    // Function to initiate customer fetch
    initiateCustomerFetch(customerId) {
        if (typeof fxCustomerInit === 'function') {
            fxCustomerInit(customerId)
                .then(response => {
                    if (response && response.ok) {
                        console.log("Customer found, updating session.");
                        this.updateSession({ userCustomer: response.data });
                    } else {
                        console.error("Failed to find customer with fxcustomer.js.");
                        this.continueIdentificationChecks();
                    }
                })
                .catch(error => {
                    console.error("Error in fetching customer data", error);
                    this.continueIdentificationChecks();
                });
        } else {
            console.error("fxCustomerInit is not defined in fxcustomer.js.");
            this.continueIdentificationChecks();
        }
    },

    continueIdentificationChecks() {
        console.log("Continuing with additional identification checks.");
    },

    // Load identification scripts
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
                            console.warn(`${scriptInfo.initFunction} is a placeholder and has no effect.`);
                        };
                    }
                };

                scriptElement.onerror = () => {
                    console.error(`Failed to load ${scriptInfo.id}.js`);
                };

                document.body.appendChild(scriptElement);
            } else {
                console.log(`${scriptInfo.id}.js is already loaded.`);
                if (typeof window[scriptInfo.initFunction] === 'function') {
                    console.log(`Re-executing ${scriptInfo.initFunction} since ${scriptInfo.id}.js is already loaded.`);
                    window[scriptInfo.initFunction]();
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

/* =========== end_3_sessionInit =========== */