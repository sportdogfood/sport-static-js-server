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
    if (!localStorage.getItem('userCustomer')) {
        console.log("Initializing user customer details...");
        const scriptInfo = {
            src: 'https://sportdogfood.github.io/sport-static-js-server/fxcustomer.js',
            id: 'fxcustomer',
            initFunction: 'fxCustomerInit'
        };

        loadAndExecuteScript(scriptInfo);
    }
};

// Initialize userContact
SessionManager.initializeUserContact = function() {
    if (!localStorage.getItem('userContact')) {
        console.log("Initializing user contact details...");
        const scriptInfo = {
            src: 'https://sportdogfood.github.io/sport-static-js-server/zocontact.js',
            id: 'zocontact',
            initFunction: 'zoContactInit'
        };

        loadAndExecuteScript(scriptInfo);
    }
};

// Helper to load scripts and execute initialization functions
function loadAndExecuteScript({ src, id, initFunction }) {
    if (!document.getElementById(id)) {
        const scriptElement = document.createElement('script');
        scriptElement.src = src;
        scriptElement.id = id;

        scriptElement.onload = () => {
            console.log(`${id}.js loaded successfully`);
            if (typeof window[initFunction] === 'function') {
                window[initFunction]();
            } else {
                console.error(`${initFunction} function not found in ${id}.js`);
            }
        };

        scriptElement.onerror = () => {
            console.error(`Failed to load ${id}.js`);
        };

        document.head.appendChild(scriptElement);
    } else {
        console.log(`${id}.js is already loaded.`);
        if (typeof window[initFunction] === 'function') {
            window[initFunction]();
        } else {
            console.error(`${initFunction} function not found`);
        }
    }
}

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
};

/* =========== end_13.2_user_initialization =========== */
