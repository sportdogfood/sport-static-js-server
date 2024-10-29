/* =========== start_13_logout_sessionterminate =========== */
// Manage user logout
SessionManager.handleLogout = function() {
    console.log('[SessionManager] handleLogout called.');
    // Logout logic and removing session data

    const userSession = localStorage.getItem('userSession');
    if (!userSession) {
        console.error('[SessionManager] No user session found in localStorage. Cannot proceed with logout.');
        return;
    }

    const sessionObject = JSON.parse(userSession);
    const fx_customerEmail = localStorage.getItem('fx_customerEmail');
    const fx_customerId = localStorage.getItem('fx_customerId');
    const logoutDate = new Date().toLocaleString('en-US', { timeZone: 'America/New_York', hour12: false });

    const payload = {
        ...sessionObject,
        logoutDate,
        fx_customerEmail,
        fx_customerId,
    };

    console.log('[SessionManager] Logging out with payload:', payload);

    fetch('https://cat-heroku-proxy-51e72e8e9b26.herokuapp.com/proxy/session', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })
    .then((response) => {
        if (!response.ok) {
            throw new Error(`[SessionManager] Network response was not ok (${response.status})`);
        }
        return response.json();
    })
    .then((data) => {
        console.log('[SessionManager] Logout successfully sent:', data);
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
            console.error('[SessionManager] There was an error during the logout process:', error);
        });
    };

// Initialize userZoom 
SessionManager.initializeUserZoom = function() {
    console.log("Initializing userZoom...");

};

// Initialize userCart
SessionManager.initializeUserCart = function() {
    console.log("Initializing user cart...");
  
};

SessionManager.initializeUserDesk = function(customerId) {
  // Ensure fx_customerId
  if (window.fx_customerId && userSession?.userDesk?.ID == null) {
    console.log("Initializing user desk details...");
    
  
    if (typeof UserDesk === 'undefined') {
      var script = document.createElement('script');
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
    console.log("either fx_customerId is invalid or deskID is already present.");
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
/* =========== end_13_logout_sessionterminate =========== */