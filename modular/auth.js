// auth.js
import { getCookies, setCookie, saveToLocalStorage, generateSporturl } from './utils.js';
import { evaluateUser } from './user.js';
import { handleLogout, sendSessionWebhook } from './sessionManager.js'; // Imported from sessionManager.js

/**
 * Authenticate customer with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 */
export async function authenticateCustomer(email, password) {
    if (!email || !password) {
        displayAuthResult("Please provide both email and password.");
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
            handleSuccessfulAuthentication(responseData, email);
        } else {
            displayAuthResult("Authentication failed: Missing session_token or customer ID.");
        }
    } catch (error) {
        console.error('Error during customer authentication:', error);
        displayAuthResult(`Error: ${error.message}`);
    }
}

/**
 * Display authentication result message
 * @param {string} message - Message to display
 */
export function displayAuthResult(message) {
    const resultElement = document.getElementById('authResult');
    if (resultElement) {
        resultElement.textContent = message;
        console.log(`Authentication Result: ${message}`);
    }
}

/**
 * Handle successful authentication
 * @param {object} responseData - Data from authentication response
 * @param {string} email - User's email
 */
export function handleSuccessfulAuthentication(responseData, email) {
    console.log('Authentication successful. Processing response data.');

    // Step 1: Extract relevant data from authentication response
    const { fc_customer_id, jwt, session_token, expires_in, sso, fc_auth_token } = responseData;

    // Step 2: Update global variables and user session data
    window.fx_customerId = fc_customer_id;
    window.jwt = jwt; // If needed globally
    window.session_token = session_token; // If needed globally

    // Update userMeta
    window.userMeta = {
        ...window.userMeta,
        fx_customerId: fc_customer_id,
        jwt: jwt,
        sessionToken: session_token,
        authTokenExpiration: new Date(Date.now() + expires_in * 1000), // Calculate expiration time
    };

    // Log the updated values for debugging
    console.log('Updated userMeta after authentication:', window.userMeta);

    // Step 3: Update Local Storage if needed
    saveToLocalStorage(); // Save the updated userMeta to persist between sessions

    // Step 4: Dispatch custom event indicating user has been authenticated
    const authEvent = new CustomEvent('userAuthenticated', { detail: { fx_customerId: fc_customer_id } });
    window.dispatchEvent(authEvent);

    // Step 5: Initialize or Update User Session
    if (!window.userSession) {
        initializeUserSession();
    } else {
        window.userSession.lastUpdated = getFriendlyDateTime();
    }

    // Step 6: Set Cookies with Authentication Data
    const cookieAttributes = "path=/; Secure; SameSite=Lax";
    document.cookie = `fx_customer=${fc_auth_token}; ${cookieAttributes}`;
    document.cookie = `fx_customerId=${fc_customer_id}; ${cookieAttributes}`;
    document.cookie = `fx_customer_em=${encodeURIComponent(email)}; ${cookieAttributes}`;
    document.cookie = `fx_customer_jwt=${jwt}; ${cookieAttributes}`;
    document.cookie = `fx_customer_sso=${sso}; ${cookieAttributes}`;
    console.log("Cookies set successfully.");

    // Step 7: Read the updated cookies
    const cookies = getCookies();
    console.log('Updated cookies:', cookies);

    // Step 8: Update userMeta with new data from cookies
    window.userMeta = {
        ...window.userMeta,
        fx_customerId: cookies['fx_customerId'] || null,
        fx_customer_em: cookies['fx_customer_em'] || null,
        // ... other userMeta properties
    };

    // Step 9: Re-evaluate user state based on updated cookies
    evaluateUser(cookies, window.userMeta.geoData);

    // Step 10: Update UI elements
    updateUIAfterAuth();

    console.log('Authentication process completed.');
}

/**
 * Initialize or update user session
 */
export function initializeUserSession() {
    window.userSession = {
        lastUpdated: getFriendlyDateTime(),
        sessionId: generateRandom4DigitNumber(),
        sessionState: {
            timeStarted: getFriendlyDateTime(),
            secondsSpent: 0
        }
    };
    saveToLocalStorage();
    console.log('User session initialized:', window.userSession);
}

/**
 * Update UI elements after authentication
 */
function updateUIAfterAuth() {
    const modalOverlay = document.getElementById('modalOverlay');
    const loginButton = document.getElementById('login-button');
    const logoutButton = document.getElementById('logout-button');

    if (modalOverlay) {
        modalOverlay.classList.remove('active');
    }
    if (loginButton) {
        loginButton.style.display = 'none';
    }
    if (logoutButton) {
        logoutButton.style.display = 'inline';
    }

    // Update user state after authentication
    // This function is defined in sessionManager.js and should be imported if needed
    // However, to avoid circular dependencies, you may trigger an event or handle it differently
    // For simplicity, assume it's handled via the 'userStateChanged' event

    console.log('UI updated after authentication.');
}
