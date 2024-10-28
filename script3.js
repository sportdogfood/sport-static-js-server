// Script 3: User Login, Logout, and Additional Initializations

// Manage user login
SessionManager.handleLogin = function() {
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
    console.log("Initializing user desk details...");
    
    // Load the userdesk.js script dynamically if it's not already loaded
    if (typeof UserDesk === 'undefined') {
        var script = document.createElement('script');
        script.src = '/path/to/userdesk.js'; // Update the path as needed
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

// Attach the SessionManager to window to make it globally accessible
window.SessionManager = SessionManager;
