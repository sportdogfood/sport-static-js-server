window.pushPagesense = function(event, fx_customerId) {
    console.log('Pagesense Event:', event, 'Customer ID:', fx_customerId);
};

// Script 1: User Interaction Management and Event Handling

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
document.addEventListener('DOMContentLoaded', () => {
    SessionManager.initializeSession();
    populateFormFromParams(); // Populate the form on page load

    const loginButton = document.getElementById('login-button');
    if (loginButton) {
        loginButton.addEventListener('click', () => {
            SessionManager.handleLogin();
            window.pushPagesense('login-click', localStorage.getItem('fx_customerId'));
        });
    }

    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            SessionManager.handleLogout();
            window.pushPagesense('logout-click', localStorage.getItem('fx_customerId'));
        });
    }

    const authButton = document.getElementById('auth-button');
    if (authButton) {
        authButton.addEventListener('click', () => {
            authenticateCustomer();
            window.pushPagesense('auth-click', null);
        });
    }

    if (SessionManager.isUserAuthenticated()) {
        buttonMaster('logged in', 'DOMContentLoaded');
        window.pushPagesense('session-restored', localStorage.getItem('fx_customerId'));
    } else {
        buttonMaster('logged out', 'DOMContentLoaded');
        window.pushPagesense('session-initiated', null);
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

            window.userCustomerData = responseData;
            window.userCustomerEmail = email;

            const resultElement = document.getElementById('authResult');
            if (resultElement) {
                resultElement.textContent = "Authentication successful! Welcome.";
                resultElement.style.display = 'block';
            }

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

            await fetchCustomerData(responseData.fc_customer_id);
            
            // Push a successful login event to Pagesense
            window.pushPagesense('login-success', responseData.fc_customer_id);

        } else {
            const resultElement = document.getElementById('authResult');
            if (resultElement) {
                resultElement.textContent = "Authentication failed: Missing session_token or customer ID.";
                resultElement.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Error during customer authentication:', error);
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

// Function to push Pagesense tracking
function pushPagesense(actionType, customerId) {
    window.pushPagesense(actionType, customerId);
    console.log('Pagesense tracking for action:', actionType, 'Customer ID:', customerId);
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
        { src: 'https://sportdogfood.github.io/sport-static-js-server/fxtransactions.js', id: 'fxtransactions', initFunction: 'transactionsInit' },
        { src: 'https://sportdogfood.github.io/sport-static-js-server/fxAttributes.js', id: 'fxattributes', initFunction: 'fxAttributesInit' }
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

// Placeholder for fetchCustomerData
document.addEventListener('authenticated', () => {
    console.log('User authenticated event received.');
});
