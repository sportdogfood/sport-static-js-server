
window.thisUser = {};

function getFriendlyDateTime() {
    const now = new Date();
    return now.toLocaleString(); // You can modify this format as needed
}



// Helper function to update thisUser session
function updateThisUserSession(updateObject) {
    // Check if thisUser exists in localStorage, otherwise initialize it
    let currentSession = JSON.parse(localStorage.getItem("thisUserSession")) || {};
    
    // Log to check current session before updating
    console.log("Current thisUserSession before update:", currentSession);
    
    // Iterate through updateObject and update the session
    for (const key in updateObject) {
        if (updateObject.hasOwnProperty(key)) {
            currentSession[key] = updateObject[key];
        }
    }

    // Log the object that is about to be updated
    console.log("Updating thisUserSession with:", updateObject);
    
    // Save updated session back to localStorage
    localStorage.setItem("thisUserSession", JSON.stringify(currentSession));

    // Also update window.thisUser object
    window.thisUser = {
        ...window.thisUser,
        ...updateObject
    };
    
    // Log to check the final state after the update
    console.log("Updated thisUserSession:", currentSession);
    console.log("Updated window.thisUser:", window.thisUser);
}

// Updates a specific part of thisUserState in localStorage
function updateUserState(key, value) {
    // Retrieve the existing thisUserState or initialize a new empty object
    let thisUserState = JSON.parse(localStorage.getItem("thisUserState")) || {};
    
    // Log to verify what the current state looks like before update
    console.log("Current thisUserState before update:", thisUserState);

    // Update the specific key with the given value
    thisUserState[key] = value;

    // Save the updated state back to localStorage
    localStorage.setItem("thisUserState", JSON.stringify(thisUserState));

    // Also update window.thisUser object for consistent in-memory state
    window.thisUser = {
        ...window.thisUser,
        [key]: value
    };

    // Log to verify the updated state
    console.log("Updated thisUserState:", thisUserState);
    console.log("Updated window.thisUser:", window.thisUser);
}

// Example function to simulate your main flow (initializeAndRun)
function initializeAndRun(calledBy) {
    const updateObject = {
        status: 'logged in',
        lastUpdate: new Date().toLocaleString(),
        calledBy: calledBy
    };

    // Log to show the values before updating
    console.log("Initializing and running. About to update with:", updateObject);

    // Update both the state and session
    updateUserState("status", updateObject.status);
    updateUserState("lastUpdate", updateObject.lastUpdate);
    updateUserState("calledBy", updateObject.calledBy);

    // Optional: You can also update the session here if needed
    updateThisUserSession(updateObject);

    // Synchronize button state after updating user state
    checkAndSyncAuthState();
}
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
    if (params.get('admin') === '1527' && passwordField) {
        if (params.has('sec')) passwordField.value = params.get('sec');
        if (params.has('stn')) passwordField.value = params.get('stn');
    }
}


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

        const responseData = await response.json();

        // Check if session_token and fc_customer_id are present
        if (responseData.session_token && responseData.fc_customer_id) {
            window.fx_customerId_global = responseData.fc_customer_id;

            // Store customer data
            window.thisUser.customerData = responseData;
            window.thisUser.customerEmail = email;

            // Direct DOM update for success message
            const resultElement = document.getElementById('authResult');
            if (resultElement) {
                resultElement.textContent = "Authentication successful! Welcome.";
                resultElement.style.display = 'block';
            }

            // Set fx_customerEmail and fx_customerId in localStorage
            localStorage.setItem("fx_customerEmail", email);
            localStorage.setItem("fx_customerId", responseData.fc_customer_id);

            // Update user state and session
            initializeAndRun('authenticateCustomer');

            // Call initializeAndRun after successful authentication
            window.initializeAndRun('authenticated');

            // Synchronize the button state after updating the user state
            checkAndSyncAuthState();

            // Fetch additional customer data
            await fetchCustomerData(responseData.fc_customer_id);

            // Start timer to automatically load transactions and subscriptions if not triggered manually
            startLazyLoadTimer();
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

// Function to check and synchronize the authentication state
function checkAndSyncAuthState() {
    // Check if user is authenticated based on the indicators
    isAuthenticated = isUserAuthenticated();

    // Store isAuthenticated in localStorage with a timestamp
    const friendlyDate = getFriendlyDateTime();
    localStorage.setItem('isAuthenticated', JSON.stringify({
        value: isAuthenticated,
        timestamp: friendlyDate,
    }));

    // Update button state based on authentication status
    if (isAuthenticated) {
        buttonMaster('logged in', 'checkAndSyncAuthState');
    } else {
        buttonMaster('logged out', 'checkAndSyncAuthState');
    }
}

// Fetch customer data function
async function fetchCustomerData(customerId) {
    const zoomParams = 'attributes,default_billing_address,default_shipping_address,default_payment_method'; 
    const apiUrl = `https://sportcorsproxy.herokuapp.com/foxycart/customers/${encodeURIComponent(customerId)}?zoom=${encodeURIComponent(zoomParams)}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.status} - ${response.statusText}`);
        }

        const responseData = await response.json();

        if (responseData) {
            console.log('Customer data:', responseData);
            localStorage.setItem("thisUserZoom", JSON.stringify(responseData));
            updateUserState('Zoom', 'available');

            // Safely call initializeAndUpdate after receiving valid data
            if (typeof window.initializeAndUpdate === 'function') {
                window.initializeAndUpdate();
            }

            // Extract first_name from responseData if available
            const first_name = responseData?.first_name || 'Unknown';

            // Update session state with customer data
            updateThisUserSession({ first_name: first_name, lastupdate: getFriendlyDateTime() });

            // Load external scripts for geo information
            const geoJsScript = document.createElement('script');
            geoJsScript.src = 'https://get.geojs.io/v1/ip/geo.js';
            geoJsScript.async = true;
            document.head.appendChild(geoJsScript);

            const geoInfoScript = document.createElement('script');
            geoInfoScript.src = 'https://yourusername.github.io/my-static-js-server/geoInfo.js';
            geoInfoScript.async = true;

            // Wait until the geoInfo.js script is loaded before calling initializeGeoInfo
            geoInfoScript.onload = function() {
                if (typeof initializeGeoInfo === 'function') {
                    initializeGeoInfo(customerId);  // Call the function once the script has loaded
                } else {
                    console.error("initializeGeoInfo is not defined after loading the geoInfo.js script");
                }
            };

            document.head.appendChild(geoInfoScript);

            // Check if fx:attributes exists in responseData._embedded
            if (responseData?._embedded?.['fx:attributes']) {
                console.log('fx:attributes found, calling userAttributes function');
                userAttributes(); // Call the userAttributes function
            } else {
                console.log('fx:attributes not found in response data');
            }
        } else {
            console.error('No customer data received');
        }
    } catch (error) {
        console.error('Error fetching customer data:', error);
        throw error; // Ensure the error is caught and retry logic can be applied
    }
}



// Helper function to update _embedded in localStorage
function updateEmbeddedData(key, data) {
    let thisUserZoom = JSON.parse(localStorage.getItem('thisUserZoom')) || {};
    if (!thisUserZoom._embedded) {
        thisUserZoom._embedded = {};
    }
    thisUserZoom._embedded[key] = data;

    // Log the update for visibility
    console.log(`Updating _embedded with key: ${key}, data:`, data);

    // Update the localStorage
    localStorage.setItem('thisUserZoom', JSON.stringify(thisUserZoom));

    // Set a new localStorage item to confirm the update (for debugging purposes)
    localStorage.setItem(`debug_update_${key}`, JSON.stringify(data));
    console.log(`Set debug_update_${key} in localStorage:`, data);
}

// Cleanup function to remove legacy keys from localStorage
function cleanupLocalStorage() {
    const legacyKeys = ['fxTransactions', 'fxSubscriptions'];
    legacyKeys.forEach((key) => {
        if (localStorage.getItem(key)) {
            localStorage.removeItem(key);
            console.log(`Removed legacy key: ${key}`);
        }
    });
}

// Fetch FoxyCart Transactions function
async function fetchFoxyCartTransactions(customerId) {
    cleanupLocalStorage(); // Ensure old keys are removed before fetching

    if (!customerId) {
        console.error("Customer ID is missing or invalid.");
        return { total_items: 0, transactions: [] };
    }

    const proxyUrl = `https://sportcorsproxy.herokuapp.com/foxycart/transactions?customer_id=${customerId}`;

    try {
        const response = await fetch(proxyUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (response.status === 404) {
            console.log("No transactions found for this customer (404 response).");
            return { total_items: 0, transactions: [] };
        }

        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Response data:", data);

        const totalItems = data.total_items || 0;
        const transactions = data.transactions || [];

        if (transactions.length === 0) {
            console.log("No transactions found in response data.");
        }

        // Properly update fx:transactions in _embedded
        updateEmbeddedData('fx:transactions', transactions);
        
        // Update session state
        updateThisUserSession({ transactionsFetched: true, lastupdate: getFriendlyDateTime() });
        updateThisUserSession({ transactions_totalItems: totalItems, lastupdate: getFriendlyDateTime() });

        return { total_items: totalItems, transactions: transactions };

    } catch (error) {
        console.error("Failed to fetch data from FoxyCart API: ", error);
        return { total_items: 0, transactions: [] };
    }
}

// Fetch FoxyCart Subscriptions function
async function fetchFoxyCartSubscriptions(customerId) {
    cleanupLocalStorage(); // Ensure old keys are removed before fetching

    if (!customerId) {
        console.error("Customer ID is missing or invalid.");
        return { total_items: 0, subscriptions: [] };
    }

    const proxyUrl = `https://sportcorsproxy.herokuapp.com/foxycart/subscriptions?customer_id=${customerId}`;

    try {
        const response = await fetch(proxyUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (response.status === 404) {
            console.log("No active subscriptions found for this customer (404 response).");
            return { total_items: 0, subscriptions: [] };
        }

        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Response data:", data);

        const totalItems = data.total_items || 0;
        const subscriptions = data.subscriptions || [];

        if (subscriptions.length === 0) {
            console.log("No subscriptions found in response data.");
        }

        // Properly update fx:subscriptions in _embedded
        updateEmbeddedData('fx:subscriptions', subscriptions);

        // Update session state
        updateThisUserSession({ subscriptionsFetched: true, lastupdate: getFriendlyDateTime() });
        updateThisUserSession({ subscriptions_totalItems: totalItems, lastupdate: getFriendlyDateTime() });

        return { total_items: totalItems, subscriptions: subscriptions };

    } catch (error) {
        console.error("Failed to fetch data from FoxyCart API: ", error);
        return { total_items: 0, subscriptions: [] };
    }
}

// Lazy load timer function
let lazyLoadTimeout;
function startLazyLoadTimer() {
    lazyLoadTimeout = setTimeout(async () => {
        console.log('Lazy load timeout reached, loading transactions and subscriptions automatically.');
        const customerId = localStorage.getItem('fx_customerId');
        if (customerId) {
            await fetchFoxyCartTransactions(customerId);
            await fetchFoxyCartSubscriptions(customerId);

        } else {
            console.error('No customer ID found for automatic loading of transactions and subscriptions.');
        }
    }, 10000); // Set to 10 seconds for demonstration; adjust as needed
}

// Call initializeAndRun to test
initializeAndRun('initializeAndRun');

