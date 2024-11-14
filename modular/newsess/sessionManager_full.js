// sessionManager.js

/**
 * Session Init Module
 */
const sessionInit = {
    getFriendlyDateTime() {
        const options = {
            timeZone: 'America/New_York',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        return new Date().toLocaleString('en-US', options);
    },

    init() {
        console.log('Session initialized.');
    },
    update() {
        console.log('Session updated.');
    },
    refresh() {
        console.log('Session refreshed.');
    }
};

/**
 * Session Meta Module
 */
const sessionMeta = {
    getCookies() {
        const cookies = {};
        document.cookie.split(';').forEach(function (cookie) {
            const [name, value] = cookie.trim().split('=');
            cookies[name] = decodeURIComponent(value);
        });
        console.log("Current cookies:", cookies);
        return cookies;
    },

    getFriendlyDateTime() {
        const options = {
            timeZone: 'America/New_York',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        return new Date().toLocaleString('en-US', options);
    },

    metaInit() {
        console.log('Session Meta initialized.');
    },
    getGeo() {
        console.log('Getting Geo data.');
    },
    getPageLo() {
        console.log('Getting Page Load data.');
    },
    getCart() {
        console.log('Getting Cart data.');
    },
    startTimer() {
        console.log('Timer started.');
    },
    metaEval() {
        this.getGeo();
        this.getCookies();
        console.log('Meta evaluated.');
    },
    metaButtons() {
        console.log('Meta buttons handled.');
    },
    metaUpdates() {
        console.log('Meta updated.');
    },
    metaFunctions() {
        console.log('Meta functions executed.');
    },
    update() {
        this.metaUpdates();
        console.log('Session Meta updated.');
    },
    refresh() {
        this.metaEval();
        console.log('Session Meta refreshed.');
    },

    /**
     * Load External EvaluateCustomerState Script
     */
    async loadEvaluateCustomerStateScript() {
        if (!document.getElementById('evaluatecustomerstate-script') && !window.evaluateCustomerStateLoading) {
            window.evaluateCustomerStateLoading = true;

            const scriptElement = document.createElement('script');
            scriptElement.src = "https://sportdogfood.github.io/sport-static-js-server/evaluatecustomerstate.js";
            scriptElement.id = 'evaluatecustomerstate-script';
            scriptElement.async = true;

            scriptElement.onload = function () {
                console.log("EvaluateCustomerState script loaded successfully.");
                window.evaluateCustomerStateLoaded = true;
                window.evaluateCustomerStateLoading = false;
            };

            scriptElement.onerror = function () {
                console.error("Failed to load EvaluateCustomerState script.");
                window.evaluateCustomerStateLoading = false;
            };

            document.body.appendChild(scriptElement);
            console.log("Attempting to load EvaluateCustomerState script dynamically.");
        } else {
            console.log("EvaluateCustomerState script is already loading or has been loaded.");
        }
    },

    /**
     * Load external PageSense script
     */
    async loadPageSenseScript() {
        if (!document.getElementById('pagesense-script') && !window.pagesenseScriptLoading) {
            window.pagesenseScriptLoading = true;

            const scriptElement = document.createElement('script');
            scriptElement.src = "https://sportdogfood.github.io/sport-static-js-server/session-pagesense.js";
            scriptElement.id = 'pagesense-script';
            scriptElement.async = true;

            scriptElement.onload = function () {
                console.log("PageSense script loaded successfully from session-pagesense.js.");
                window.pagesenseScriptLoaded = true;
                window.pagesenseScriptLoading = false;
            };

            scriptElement.onerror = function () {
                console.error("Failed to load PageSense script from session-pagesense.js.");
                window.pagesenseScriptLoading = false;
            };

            document.body.appendChild(scriptElement);
            console.log("Attempting to load PageSense script dynamically from session-pagesense.js.");
        } else {
            console.log("PageSense script is already loading or has been loaded.");
        }
    }
};

/**
 * Session IAM Module
 */
const sessionIAM = {
    getCookies() {
        const cookies = {};
        document.cookie.split(';').forEach(function (cookie) {
            const [name, value] = cookie.trim().split('=');
            cookies[name] = decodeURIComponent(value);
        });
        console.log("Current cookies:", cookies);
        return cookies;
    },

    generateRandom4DigitNumber() {
        return Math.floor(1000 + Math.random() * 9000).toString();
    },

    getFriendlyDateTime() {
        const options = {
            timeZone: 'America/New_York',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        return new Date().toLocaleString('en-US', options);
    },

    iamInit() {
        console.log('Session IAM initialized.');
    },
    iamEval() {
        sessionMeta.metaEval();
        console.log('IAM evaluated.');
    },
    iamButtons() {
        console.log('IAM buttons handled.');
    },
    iamUpdate() {
        console.log('IAM updated.');
    },
    iamFunctions() {
        console.log('IAM functions executed.');
    },
    update() {
        this.iamUpdate();
        console.log('Session IAM updated.');
    },
    refresh() {
        this.iamEval();
        console.log('Session IAM refreshed.');
    }
};

/**
 * Session PageLo Module
 */
const sessionPageLo = {
    getFriendlyDateTime() {
        const options = {
            timeZone: 'America/New_York',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        return new Date().toLocaleString('en-US', options);
    },

    pageInit() {
        console.log('Session PageLo initialized.');
    },
    pageLoEval() {
        sessionIAM.iamEval();
        console.log('PageLo evaluated.');
    },
    pageButtons() {
        console.log('PageLo buttons handled.');
    },
    pageUpdates() {
        console.log('PageLo updated.');
    },
    pageLoFunctions() {
        console.log('PageLo functions executed.');
    },
    update() {
        this.pageUpdates();
        console.log('Session PageLo updated.');
    },
    refresh() {
        this.pageLoEval();
        console.log('Session PageLo refreshed.');
    }
};

/**
 * Session PageLoEl Module
 */
const sessionPageLoEl = {
    getFriendlyDateTime() {
        const options = {
            timeZone: 'America/New_York',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        return new Date().toLocaleString('en-US', options);
    },

    getCookies() {
        const cookies = {};
        document.cookie.split(';').forEach(function (cookie) {
            const [name, value] = cookie.trim().split('=');
            cookies[name] = decodeURIComponent(value);
        });
        console.log("Current cookies:", cookies);
        return cookies;
    },

    pageLoElInit() {
        console.log('Session PageLoEl initialized.');
    },
    pageLoElEval() {
        sessionPageLo.pageLoEval();
        console.log('PageLoEl evaluated.');
    },
    pageLoEButtons() {
        console.log('PageLoEl buttons handled.');
    },
    pageLoEUpdates() {
        console.log('PageLoEl updated.');
    },
    pageLoElFunctions() {
        console.log('PageLoEl functions executed.');
    },
    update() {
        this.pageLoEUpdates();
        console.log('Session PageLoEl updated.');
    },
    refresh() {
        this.pageLoElEval();
        console.log('Session PageLoEl refreshed.');
    }
};

/**
 * Session Enrich Module
 */
const sessionEnrich = {
    getFriendlyDateTime() {
        const options = {
            timeZone: 'America/New_York',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        return new Date().toLocaleString('en-US', options);
    },

    enrichInit() {
        console.log('Session Enrich initialized.');
    },
    enrichEval() {
        console.log('Enrich evaluated.');
    },
    enrichSockets() {
        console.log('Enrich sockets handled.');
    },
    enrichHooks() {
        console.log('Enrich hooks handled.');
    },
    enrichUpdates() {
        console.log('Enrich updated.');
    },
    enrichFunctions() {
        console.log('Enrich functions executed.');
    },
    update() {
        this.enrichUpdates();
        console.log('Session Enrich updated.');
    },
    refresh() {
        this.enrichEval();
        console.log('Session Enrich refreshed.');
    }
};

/**
 * Session Timer Module
 */
const sessionTimer = {
    getFriendlyDateTime() {
        const options = {
            timeZone: 'America/New_York',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        return new Date().toLocaleString('en-US', options);
    },

    generateRandom4DigitNumber() {
        return Math.floor(1000 + Math.random() * 9000).toString();
    },

    startTimerInit() {
        console.log('Session Timer initialized.');
    },
    startTimer() {
        console.log('Timer started.');
    },
    evaluateTimer() {
        console.log('Timer evaluated.');
    },
    updateTimer() {
        console.log('Timer updated.');
    },
    update() {
        this.updateTimer();
        console.log('Session Timer updated.');
    },
    refresh() {
        this.evaluateTimer();
        console.log('Session Timer refreshed.');
    },

    /**
     * Setup Idle Detection (Assuming this is part of sessionTimer)
     */
    setupIdleDetection() {
        // Implement idle detection logic here
        console.log('Idle detection setup.');
    },

    /**
     * Start Session Assist Polling (Assuming this is part of sessionTimer)
     */
    startSessionAssistPolling() {
        // Implement session assist polling logic here
        console.log('Session assist polling started.');
    }
};

/**
 * Session Geo Module
 */
const sessionGeo = {
    getCookies() {
        const cookies = {};
        document.cookie.split(';').forEach(function (cookie) {
            const [name, value] = cookie.trim().split('=');
            cookies[name] = decodeURIComponent(value);
        });
        console.log("Current cookies:", cookies);
        return cookies;
    },

    saveToLocalStorage() {
        localStorage.setItem('userMeta', JSON.stringify(window.userMeta));
        localStorage.setItem('userState', JSON.stringify(window.userState));
        localStorage.setItem('userSession', JSON.stringify(window.userSession));
        localStorage.setItem('fx_customerId', window.fx_customerId || '');
        localStorage.setItem('fx_customer_em', window.fx_customer_em || '');
        console.log("State saved to localStorage:", {
            userMeta: window.userMeta,
            userState: window.userState,
            userSession: window.userSession,
            fx_customerId: window.fx_customerId,
            fx_customer_em: window.fx_customer_em
        });
    },

    generateRandom4DigitNumber() {
        return Math.floor(1000 + Math.random() * 9000).toString();
    },

    getFriendlyDateTime() {
        const options = {
            timeZone: 'America/New_York',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        return new Date().toLocaleString('en-US', options);
    },

    async loadGeoLocationData() {
        if (window.geoDataFetched && window.userMeta?.geoData) {
            console.log("Geolocation data already fetched.");
            return window.userMeta.geoData;
        }

        try {
            const response = await fetch('https://ipv4.geojs.io/v1/ip/geo.json');
            const json = await response.json();
            console.log("Geolocation data fetched successfully:", json);

            const geoData = {
                ip: json.ip,
                country: json.country,
                region: json.region,
                city: json.city,
                timezone: json.timezone,
            };

            window.userMeta = window.userMeta || {};
            window.userMeta.geoData = geoData;
            window.geoDataFetched = true;

            this.saveToLocalStorage();

            return geoData;
        } catch (error) {
            console.error("Geolocation fetch failed:", error);
            return null;
        }
    },

    async refreshGeoLocationData() {
        window.geoDataFetched = false;
        const geoData = await this.loadGeoLocationData();
        console.log("Geolocation data refreshed:", geoData);
        window.userMeta.geoData = geoData;
        this.saveToLocalStorage();
    },

    geoInit() {
        console.log('Session Geo initialized.');
        this.geoFunctions.loadGeoLocationData();
    },
    geoEval() {
        console.log('Geo evaluated.');
    },
    geoButtons() {
        console.log('Geo buttons handled.');
    },
    geoUpdates() {
        console.log('Geo updated.');
    },
    geoFunctions: {
        async loadGeoLocationData() {
            if (window.geoDataFetched && window.userMeta?.geoData) {
                console.log("Geolocation data already fetched.");
                return window.userMeta.geoData;
            }

            try {
                const response = await fetch('https://ipv4.geojs.io/v1/ip/geo.json');
                const json = await response.json();
                console.log("Geolocation data fetched successfully:", json);

                const geoData = {
                    ip: json.ip,
                    country: json.country,
                    region: json.region,
                    city: json.city,
                    timezone: json.timezone,
                };

                window.userMeta = window.userMeta || {};
                window.userMeta.geoData = geoData;
                window.geoDataFetched = true;

                this.saveToLocalStorage();

                return geoData;
            } catch (error) {
                console.error("Geolocation fetch failed:", error);
                return null;
            }
        },

        async refreshGeoLocationData() {
            window.geoDataFetched = false;
            const geoData = await this.loadGeoLocationData();
            console.log("Geolocation data refreshed:", geoData);
            window.userMeta.geoData = geoData;
            this.saveToLocalStorage();
        }
    },

    update() {
        this.geoUpdates();
        console.log('Session Geo updated.');
    },
    refresh() {
        this.geoFunctions.refreshGeoLocationData();
        console.log('Session Geo refreshed.');
    },

    /**
     * Refresh CustomerZoom functionality
     */
    async refreshCustomerZoom() {
        try {
            console.log('Refreshing CustomerZoom...');
            if (typeof window.customerzoomInit === 'function') {
                window.customerzoomInit();
                console.log('CustomerZoom refreshed successfully.');
            } else {
                console.warn('customerzoomInit function not found.');
            }
        } catch (error) {
            console.error('Error refreshing CustomerZoom:', error);
        }
    }
};

/**
 * Session Cookies Module
 */
const sessionCookies = {
    getCookies() {
        const cookies = {};
        document.cookie.split(';').forEach(function (cookie) {
            const [name, value] = cookie.trim().split('=');
            cookies[name] = decodeURIComponent(value);
        });
        console.log("Current cookies:", cookies);
        return cookies;
    },

    setCookie(name, value, days) {
        const expires = days ? '; expires=' + new Date(Date.now() + days * 864e5).toUTCString() : '';
        document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/; Secure; SameSite=Strict`;
        console.log(`Cookie set: ${name}=${value}; expires=${expires}`);
    },

    saveToLocalStorage() {
        localStorage.setItem('userMeta', JSON.stringify(window.userMeta));
        localStorage.setItem('userState', JSON.stringify(window.userState));
        localStorage.setItem('userSession', JSON.stringify(window.userSession));
        localStorage.setItem('fx_customerId', window.fx_customerId || '');
        localStorage.setItem('fx_customer_em', window.fx_customer_em || '');
        console.log("State saved to localStorage:", {
            userMeta: window.userMeta,
            userState: window.userState,
            userSession: window.userSession,
            fx_customerId: window.fx_customerId,
            fx_customer_em: window.fx_customer_em
        });
    },

    generateRandom4DigitNumber() {
        return Math.floor(1000 + Math.random() * 9000).toString();
    },

    getFriendlyDateTime() {
        const options = {
            timeZone: 'America/New_York',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        return new Date().toLocaleString('en-US', options);
    },

    async loadGeoLocationData() {
        if (window.geoDataFetched && window.userMeta?.geoData) {
            console.log("Geolocation data already fetched.");
            return window.userMeta.geoData;
        }

        try {
            const response = await fetch('https://ipv4.geojs.io/v1/ip/geo.json');
            const json = await response.json();
            console.log("Geolocation data fetched successfully:", json);

            const geoData = {
                ip: json.ip,
                country: json.country,
                region: json.region,
                city: json.city,
                timezone: json.timezone,
            };

            window.userMeta = window.userMeta || {};
            window.userMeta.geoData = geoData;
            window.geoDataFetched = true;

            this.saveToLocalStorage();

            return geoData;
        } catch (error) {
            console.error("Geolocation fetch failed:", error);
            return null;
        }
    },

    async refreshGeoLocationData() {
        window.geoDataFetched = false;
        const geoData = await this.loadGeoLocationData();
        console.log("Geolocation data refreshed:", geoData);
        window.userMeta.geoData = geoData;
        this.saveToLocalStorage();
    },

    cookiesInit() {
        console.log('Session Cookies initialized.');
    },
    getCookiesMethod() {
        this.getCookies();
        console.log('Retrieving cookies.');
    },
    updateCookies() {
        console.log('Cookies updated.');
    },
    update() {
        this.updateCookies();
        console.log('Session Cookies updated.');
    },
    refresh() {
        this.getCookiesMethod();
        console.log('Session Cookies refreshed.');
    }
};

/**
 * Session MakeCookies Module
 */
const sessionMakeCookies = {
    setCookie(name, value, days) {
        const expires = days ? '; expires=' + new Date(Date.now() + days * 864e5).toUTCString() : '';
        document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/; Secure; SameSite=Strict`;
        console.log(`Cookie set: ${name}=${value}; expires=${expires}`);
    },

    getCookies() {
        const cookies = {};
        document.cookie.split(';').forEach(function (cookie) {
            const [name, value] = cookie.trim().split('=');
            cookies[name] = decodeURIComponent(value);
        });
        console.log("Current cookies:", cookies);
        return cookies;
    },

    makeCookieInit() {
        console.log('Session MakeCookies initialized.');
    },
    makeCookies() {
        console.log('Making cookies.');
    },
    updateMakeCookies() {
        console.log('MakeCookies updated.');
    },
    update() {
        this.updateMakeCookies();
        console.log('Session MakeCookies updated.');
    },
    refresh() {
        this.makeCookies();
        console.log('Session MakeCookies refreshed.');
    }
};

/**
 * Session Auth Module
 */
const sessionAuth = {
    getCookies() {
        const cookies = {};
        document.cookie.split(';').forEach(function (cookie) {
            const [name, value] = cookie.trim().split('=');
            cookies[name] = decodeURIComponent(value);
        });
        console.log("Current cookies:", cookies);
        return cookies;
    },

    saveToLocalStorage() {
        localStorage.setItem('userMeta', JSON.stringify(window.userMeta));
        localStorage.setItem('userState', JSON.stringify(window.userState));
        localStorage.setItem('userSession', JSON.stringify(window.userSession));
        localStorage.setItem('fx_customerId', window.fx_customerId || '');
        localStorage.setItem('fx_customer_em', window.fx_customer_em || '');
        console.log("State saved to localStorage:", {
            userMeta: window.userMeta,
            userState: window.userState,
            userSession: window.userSession,
            fx_customerId: window.fx_customerId,
            fx_customer_em: window.fx_customer_em
        });
    },

    generateRandom4DigitNumber() {
        return Math.floor(1000 + Math.random() * 9000).toString();
    },

    getFriendlyDateTime() {
        const options = {
            timeZone: 'America/New_York',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        return new Date().toLocaleString('en-US', options);
    },

    generateSporturl(customerEmail, customerId) {
        const randomPin = this.generateRandom4DigitNumber();
        const currentTimestamp = Date.now().toString();
        return `https://www.sportdogfood.com/login?em=${encodeURIComponent(customerEmail)}&cid=${encodeURIComponent(customerId)}&pn=${encodeURIComponent(randomPin)}&ts=${encodeURIComponent(currentTimestamp)}`;
    },

    setCookie(name, value, days) {
        const expires = days ? '; expires=' + new Date(Date.now() + days * 864e5).toUTCString() : '';
        document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/; Secure; SameSite=Strict`;
        console.log(`Cookie set: ${name}=${value}; expires=${expires}`);
    },

    clearAuthenticationData() {
        const cookiesToRemove = [
            'fx_customer', 'fx_customerId', 'fx_customer_em', 'fx_customer_jwt', 'fx_customer_sso',
            'sporturl', 'fx_customerPin', 'fx_customerLastVisit', 'fx_customerEm',
            'fx_customerEmail', 'fc_customer_id', 'fc_auth_token'
        ];

        cookiesToRemove.forEach((cookieName) => {
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; Secure; SameSite=Strict;`;
            console.log(`Attempted to remove cookie: ${cookieName}`);
        });

        const localStorageItems = [
            'fx_customerEmail', 'fx_customerId', 'userAttributesProcessed',
            'userZoom', 'userTransactions', 'userSubscriptions',
            'userState', 'userMeta', 'userSession'
        ];

        localStorageItems.forEach(item => {
            localStorage.removeItem(item);
            console.log(`Removed localStorage item: ${item}`);
        });

        window.fx_customerId = null;
        window.fx_customer_em = null;
        window.fx_customerEmail = null;
        window.fx_customerEm = null;

        window.userMeta = {};
        window.userSession = {};

        console.log('Authentication data cleared.');
    },

    authInit() {
        console.log('Session Auth initialized.');
    },
    authEval(email, password) {
        this.authFunctions.authenticateCustomer(email, password);
        console.log('Auth evaluated.');
    },
    authButtons() {
        console.log('Auth buttons handled.');
    },
    authUpdates() {
        console.log('Auth updated.');
    },
    authFunctions: {
        /**
         * Authenticate customer with email and password
         * @param {string} email - User's email
         * @param {string} password - User's password
         */
        async authenticateCustomer(email, password) {
            if (!email || !password) {
                this.displayAuthResult("Please provide both email and password.");
                return;
            }
    
            try {
                const response = await fetch('https://sportcorsproxy.herokuapp.com/foxycart/customer/authenticate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
    
                if (!response.ok) {
                    throw new Error(`Network response was not ok (${response.status})`);
                }
    
                const responseData = await response.json();
                if (responseData.session_token && responseData.fc_customer_id) {
                    this.handleSuccessfulAuthentication(responseData, email);
                } else {
                    this.displayAuthResult("Authentication failed: Missing session_token or customer ID.");
                }
            } catch (error) {
                console.error('Error during customer authentication:', error);
                this.displayAuthResult(`Error: ${error.message}`);
            }
        },
    
        /**
         * Display authentication result message
         * @param {string} message - Message to display
         */
        displayAuthResult(message) {
            const resultElement = document.getElementById('authResult');
            if (resultElement) {
                resultElement.textContent = message;
                console.log(`Authentication Result: ${message}`);
            } else {
                console.warn('authResult element not found in the DOM.');
            }
        },
    
        /**
         * Handle successful authentication
         * @param {object} responseData - Data from authentication response
         * @param {string} email - User's email
         */
        handleSuccessfulAuthentication(responseData, email) {
            console.log('Authentication successful. Processing response data.');
    
            const { fc_customer_id, jwt, session_token, expires_in, sso, fc_auth_token } = responseData;
    
            // Update global variables
            window.fx_customerId = fc_customer_id;
            window.jwt = jwt;
            window.session_token = session_token;
    
            // Update userMeta with authentication data
            window.userMeta = {
                ...window.userMeta,
                fx_customerId: fc_customer_id,
                jwt: jwt,
                sessionToken: session_token,
                authTokenExpiration: new Date(Date.now() + expires_in * 1000),
            };
    
            console.log('Updated userMeta after authentication:', window.userMeta);
    
            // Save updated state to localStorage
            this.saveToLocalStorage();
    
            // Dispatch custom event indicating successful authentication
            const authEvent = new CustomEvent('userAuthenticated', { detail: { fx_customerId: fc_customer_id } });
            window.dispatchEvent(authEvent);
    
            // Initialize user session if it doesn't exist
            if (!window.userSession) {
                this.initializeUserSession();
            } else {
                window.userSession.lastUpdated = this.getFriendlyDateTime();
            }
    
            // Set authentication-related cookies
            const cookieAttributes = "path=/; Secure; SameSite=Lax";
            this.setCookie('fx_customer', fc_auth_token, 7);
            this.setCookie('fx_customerId', fc_customer_id, 7);
            this.setCookie('fx_customer_em', encodeURIComponent(email), 7);
            this.setCookie('fx_customer_jwt', jwt, 7);
            this.setCookie('fx_customer_sso', sso, 7);
            console.log("Cookies set successfully.");
    
            // Retrieve updated cookies
            const cookies = this.getCookies();
            console.log('Updated cookies:', cookies);
    
            // Update userMeta with new cookie data
            window.userMeta = {
                ...window.userMeta,
                fx_customerId: cookies['fx_customerId'] || null,
                fx_customer_em: cookies['fx_customer_em'] || null,
                // ... other userMeta properties if needed
            };
    
            // Re-evaluate user authentication status
            this.evaluateUser(cookies, window.userMeta.geoData);
    
            // Update UI elements based on authentication
            this.updateUIAfterAuth();
    
            console.log('Authentication process completed.');
        },
    
        /**
         * Initialize user session data
         */
        initializeUserSession() {
            window.userSession = {
                lastUpdated: this.getFriendlyDateTime(),
                sessionId: this.generateRandom4DigitNumber(),
                sessionState: {
                    timeStarted: this.getFriendlyDateTime(),
                    secondsSpent: 0
                }
            };
            this.saveToLocalStorage();
            console.log('User session initialized:', window.userSession);
        },
    
        /**
         * Update UI elements after authentication
         */
        updateUIAfterAuth() {
            const modalOverlay = document.getElementById('modalOverlay');
            const loginButton = document.getElementById('login-button');
            const logoutButton = document.getElementById('logout-button');
    
            if (modalOverlay) {
                modalOverlay.classList.remove('active');
            } else {
                console.warn('modalOverlay element not found in the DOM.');
            }
    
            if (loginButton) {
                loginButton.style.display = 'none';
            } else {
                console.warn('login-button element not found in the DOM.');
            }
    
            if (logoutButton) {
                logoutButton.style.display = 'inline';
            } else {
                console.warn('logout-button element not found in the DOM.');
            }
    
            // Dispatch userStateChanged event to inform other modules/UI components
            const userStateEvent = new CustomEvent('userStateChanged', { detail: { state: 'customer', subState: 'user-logged-in' } });
            window.dispatchEvent(userStateEvent);
    
            console.log('UI updated after authentication.');
        },
    
        /**
         * Evaluate user based on cookies and geolocation data
         * @param {object} cookies - Parsed cookies
         * @param {object} geoData - Geolocation data
         */
        evaluateUser(cookies, geoData) {
            console.log('Evaluating user...');
    
            window.userMeta = {
                ...window.userMeta,
                lastUpdated: this.getFriendlyDateTime(),
                fx_customerId: cookies['fx_customerId'] || null,
                fx_customer_em: cookies['fx_customer_em'] || null,
                // Add other cookie data as needed
            };
    
            if (geoData) {
                window.userMeta.geoData = geoData;
            }
    
            if (cookies['fx_customer_sso'] && cookies['fx_customerId']) {
                window.userAuth = 'authenticated';
                window.userState = {
                    state: 'customer',
                    subState: 'user-logged-in'
                };
            } else {
                window.userAuth = '';
                window.userState = {
                    state: 'visitor',
                    subState: ''
                };
            }
    
            // Dispatch userStateChanged event to inform other modules/UI components
            const event = new CustomEvent('userStateChanged', { detail: window.userState });
            window.dispatchEvent(event);
    
            console.log('User evaluation completed:', window.userState, window.userAuth);
        },
    
        /**
         * Save the current state to localStorage
         */
        saveToLocalStorage() {
            localStorage.setItem('userMeta', JSON.stringify(window.userMeta));
            localStorage.setItem('userState', JSON.stringify(window.userState));
            localStorage.setItem('userSession', JSON.stringify(window.userSession));
            localStorage.setItem('fx_customerId', window.fx_customerId || '');
            localStorage.setItem('fx_customer_em', window.fx_customer_em || '');
            console.log("State saved to localStorage:", {
                userMeta: window.userMeta,
                userState: window.userState,
                userSession: window.userSession,
                fx_customerId: window.fx_customerId,
                fx_customer_em: window.fx_customer_em
            });
        },
    
        /**
         * Set a cookie with given name, value, and expiration in days
         * @param {string} name - Cookie name
         * @param {string} value - Cookie value
         * @param {number} days - Expiration in days
         */
        setCookie(name, value, days) {
            const expires = days ? '; expires=' + new Date(Date.now() + days * 864e5).toUTCString() : '';
            document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/; Secure; SameSite=Strict`;
            console.log(`Cookie set: ${name}=${value}; expires=${expires}`);
        },
    
        /**
         * Get all cookies as an object
         * @returns {object} - Parsed cookies
         */
        getCookies() {
            const cookies = {};
            document.cookie.split(';').forEach(function (cookie) {
                const [name, value] = cookie.trim().split('=');
                cookies[name] = decodeURIComponent(value);
            });
            console.log("Current cookies:", cookies);
            return cookies;
        },
    
        /**
         * Generate a random 4-digit number
         * @returns {string} - 4-digit random number as a string
         */
        generateRandom4DigitNumber() {
            return Math.floor(1000 + Math.random() * 9000).toString();
        }
    },
    
};

/**
 * Session End Module
 */
const sessionEnd = {
    setCookie(name, value, days) {
        const expires = days ? '; expires=' + new Date(Date.now() + days * 864e5).toUTCString() : '';
        document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/; Secure; SameSite=Strict`;
        console.log(`Cookie set: ${name}=${value}; expires=${expires}`);
    },

    getCookies() {
        const cookies = {};
        document.cookie.split(';').forEach(function (cookie) {
            const [name, value] = cookie.trim().split('=');
            cookies[name] = decodeURIComponent(value);
        });
        console.log("Current cookies:", cookies);
        return cookies;
    },

    saveToLocalStorage() {
        localStorage.setItem('userMeta', JSON.stringify(window.userMeta));
        localStorage.setItem('userState', JSON.stringify(window.userState));
        localStorage.setItem('userSession', JSON.stringify(window.userSession));
        localStorage.setItem('fx_customerId', window.fx_customerId || '');
        localStorage.setItem('fx_customer_em', window.fx_customer_em || '');
        console.log("State saved to localStorage:", {
            userMeta: window.userMeta,
            userState: window.userState,
            userSession: window.userSession,
            fx_customerId: window.fx_customerId,
            fx_customer_em: window.fx_customer_em
        });
    },

    clearAuthenticationData() {
        const cookiesToRemove = [
            'fx_customer', 'fx_customerId', 'fx_customer_em', 'fx_customer_jwt', 'fx_customer_sso',
            'sporturl', 'fx_customerPin', 'fx_customerLastVisit', 'fx_customerEm',
            'fx_customerEmail', 'fc_customer_id', 'fc_auth_token'
        ];

        cookiesToRemove.forEach((cookieName) => {
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; Secure; SameSite=Strict;`;
            console.log(`Attempted to remove cookie: ${cookieName}`);
        });

        const localStorageItems = [
            'fx_customerEmail', 'fx_customerId', 'userAttributesProcessed',
            'userZoom', 'userTransactions', 'userSubscriptions',
            'userState', 'userMeta', 'userSession'
        ];

        localStorageItems.forEach(item => {
            localStorage.removeItem(item);
            console.log(`Removed localStorage item: ${item}`);
        });

        window.fx_customerId = null;
        window.fx_customer_em = null;
        window.fx_customerEmail = null;
        window.fx_customerEm = null;

        window.userMeta = {};
        window.userSession = {};

        console.log('Authentication data cleared.');
    },

    endInit() {
        console.log('Session End initialized.');
    },
    endEval() {
        console.log('End session evaluated.');
    },
    makeCookies() {
        console.log('Making cookies on session end.');
    },
    endLocal() {
        console.log('Local session ended.');
    },
    endSession() {
        console.log('Session ended.');
    },
    endButtons() {
        console.log('End session buttons handled.');
    },
    endUpdates() {
        console.log('End session updated.');
    },
    endFunctions() {
        console.log('End session functions executed.');
    },
    update() {
        this.endUpdates();
        console.log('Session End updated.');
    },
    refresh() {
        this.endEval();
        console.log('Session End refreshed.');
    },

    /**
     * Handle user logout
     */
    handleLogout() {
        this.clearAuthenticationData();
        console.log('User has been logged out.');

        const logoutEvent = new CustomEvent('userLoggedOut');
        window.dispatchEvent(logoutEvent);

        // Additional logout procedures can be added here
    }
};

/**
 * Session FC Module
 * Handles initialization of FC, event listeners, and loading authenticated user scripts.
 */
const sessionFC = {
    /**
     * Initialize FC and set up event listeners
     */
    init() {
        console.log('Initializing FC module.');
        this.setupFCInitialization();
    },

    /**
     * Set up FC initialization and event listeners
     */
    setupFCInitialization() {
        // Ensure FC is initialized properly before use
        window.FC = window.FC || {};
        window.is_subscription_modification = window.is_subscription_modification || false;

        // Function to get friendly date/time in US/EDT format
        this.getFriendlyDateTime = () => {
            const options = {
                timeZone: 'America/New_York',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            };
            return new Date().toLocaleString('en-US', options);
        };

        // Initialize FC.onLoad
        window.FC.onLoad = () => {
            console.log('FC.onLoad triggered.');
            this.setupFCClientReady();
        };

        console.log('FC module initialized and FC.onLoad set.');
    },

    /**
     * Set up FC.client.on('ready.done') event listener
     */
    setupFCClientReady() {
        if (window.FC.client && typeof window.FC.client.on === 'function') {
            window.FC.client.on('ready.done', () => {
                console.log('FC.client.on("ready.done") triggered.');
                this.handleFCReady();
            });
            console.log('FC.client.on("ready.done") event listener set.');
        } else {
            console.error('FC.client.on is not a function. FC library may not be loaded correctly.');
        }
    },

    /**
     * Handle FC ready event
     */
    handleFCReady() {
        console.log('Handling FC ready event.');
        this.retrieveFcsid();
    },

    /**
     * Retrieve fcsid from FC and store in localStorage
     */
    retrieveFcsid() {
        if (window.FC.json && window.FC.json.session_id) {
            const fcsid = window.FC.json.session_id;
            console.log('Successfully retrieved fcsid:', fcsid);
            localStorage.setItem('fcsid', fcsid);
        } else {
            console.error('Failed to retrieve fcsid. FC.json.session_id is not available.');
        }
    },

    /**
     * Load authenticated user scripts after successful authentication
     */
    loadAuthenticatedUserScripts() {
        const authenticatedScripts = [
            {
                src: 'https://sportdogfood.github.io/sport-static-js-server/fxcustomerzoom.js',
                id: 'fxcustomerzoom',
                initFunction: 'customerzoomInit'
            },
            {
                src: 'https://sportdogfood.github.io/sport-static-js-server/fxsubscriptions.js',
                id: 'fxsubscriptions',
                initFunction: 'subscriptionsInit'
            },
            {
                src: 'https://sportdogfood.github.io/sport-static-js-server/fxtransactions.js',
                id: 'fxtransactions',
                initFunction: 'transactionsInit'
            },
            {
                src: 'https://sportdogfood.github.io/sport-static-js-server/fxattributes.js',
                id: 'fxattributes',
                initFunction: 'attributesInit'
            }
        ];

        authenticatedScripts.forEach(scriptInfo => {
            this.loadScript(scriptInfo);
        });
    },

    /**
     * Dynamically load a script and execute its initialization function
     * @param {object} scriptInfo - Information about the script to load
     */
    loadScript(scriptInfo) {
        if (!document.getElementById(scriptInfo.id)) {
            const scriptElement = document.createElement('script');
            scriptElement.src = scriptInfo.src;
            scriptElement.id = scriptInfo.id;
            scriptElement.async = true;

            scriptElement.onload = () => {
                console.log(`${scriptInfo.id}.js loaded successfully.`);
                if (typeof window[scriptInfo.initFunction] === 'function') {
                    try {
                        window[scriptInfo.initFunction]();
                        console.log(`${scriptInfo.initFunction} executed successfully.`);
                    } catch (error) {
                        console.error(`Error executing ${scriptInfo.initFunction}:`, error);
                    }
                } else {
                    console.error(`${scriptInfo.initFunction} is not a function or not defined in ${scriptInfo.id}.js.`);
                }
            };

            scriptElement.onerror = () => {
                console.error(`Failed to load script: ${scriptInfo.src}`);
            };

            document.body.appendChild(scriptElement);
            console.log(`Attempting to load script: ${scriptInfo.src}`);
        } else {
            console.log(`${scriptInfo.id}.js is already loaded.`);
            // Optionally, re-execute the initialization function if necessary
            if (typeof window[scriptInfo.initFunction] === 'function') {
                try {
                    window[scriptInfo.initFunction]();
                    console.log(`${scriptInfo.initFunction} re-executed successfully.`);
                } catch (error) {
                    console.error(`Error re-executing ${scriptInfo.initFunction}:`, error);
                }
            } else {
                console.warn(`${scriptInfo.initFunction} is not defined in the already loaded ${scriptInfo.id}.js.`);
            }
        }
    }
};



