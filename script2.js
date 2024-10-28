// Script 2: Session Management, Customer Identification, and Authentication

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
