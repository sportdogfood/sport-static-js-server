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
    // Ensure fx_customerId
    if (window.fx_customerId && (!this.session.userDesk || !this.session.userDesk.ID)) {
        console.log("Initializing user desk details...");

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
    } else {
        console.log("Either fx_customerId is invalid or deskID is already present.");
    }
};

// Initialize userCustomer
SessionManager.initializeUserCustomer = function() {
    console.log("Initializing user customer details...");
    // Placeholder
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
