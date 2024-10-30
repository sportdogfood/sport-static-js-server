/* =========== start_13.2_user_initialization =========== */

// Initialize userZoom 
SessionManager.initializeUserZoom = function() {
    console.log("Initializing userZoom...");
};

// Initialize userCart
SessionManager.initializeUserCart = function() {
    console.log("Initializing user cart...");
};

// Initialize userDesk
SessionManager.initializeUserDesk = function(customerId) {
    console.log("Attempting to initialize user desk details...");

    if (!window.fx_customerId) {
        console.error("No valid customer ID found. Initialization aborted.");
        return;
    }

    // Check if UserDesk library is already loaded
    if (typeof UserDesk === 'undefined') {
        const script = document.createElement('script');
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
};

// Initialize userCustomer
SessionManager.initializeUserCustomer = function() {
    console.log("Initializing user customer details...");

    if (localStorage.getItem('userCustomer') === null) {
        const script = document.createElement('script');
        script.src = 'https://sportdogfood.github.io/sport-static-js-server/fxcustomer.js'; 
        script.id = 'fxcustomer';

        script.onload = function() {
            console.log("fxcustomer.js loaded successfully");
            if (typeof fxCustomerInit === 'function') {
                fxCustomerInit();
            } else {
                console.error("fxCustomerInit function not found in fxcustomer.js");
            }
        };

        script.onerror = function() {
            console.error("Failed to load fxcustomer.js");
        };

        document.head.appendChild(script);
    } else {
        console.log("userCustomer already exists in local storage.");
    }
};

// Initialize userContact
SessionManager.initializeUserContact = function() {
    console.log("Initializing user contact details...");

    if (localStorage.getItem('userContact') === null) {
        const script = document.createElement('script');
        script.src = 'https://sportdogfood.github.io/sport-static-js-server/zocontact.js';
        script.id = 'zocontact';

        script.onload = function() {
            console.log("zocontact.js loaded successfully");
            if (typeof zoContactInit === 'function') {
                zoContactInit();
            } else {
                console.error("zoContactInit function not found in zocontact.js");
            }
        };

        script.onerror = function() {
            console.error("Failed to load zocontact.js");
        };

        document.head.appendChild(script);
    } else {
        console.log("userContact already exists in local storage.");
    }
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

/* =========== end_13.2_user_initialization =========== */
