// sessionAuth.js

import { getFriendlyDateTime, generateRandom4DigitNumber } from './sessionUtils.js';
import sessionFC from './sessionFC.js'; // Ensure access to sessionFC

const sessionAuth = {
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
                window.userSession.lastUpdated = getFriendlyDateTime();
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

            // Load authenticated user scripts via sessionFC
            sessionFC.loadAuthenticatedUserScripts();

            console.log('Authentication process completed.');
        },

        /**
         * Initialize user session data
         */
        initializeUserSession() {
            window.userSession = {
                lastUpdated: getFriendlyDateTime(),
                sessionId: generateRandom4DigitNumber(),
                sessionState: {
                    timeStarted: getFriendlyDateTime(),
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
                lastUpdated: getFriendlyDateTime(),
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
            console.log(`[sessionAuth] Cookie set: ${name}=${value}; expires=${expires}`);
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
        }
    };

    export default sessionAuth;
