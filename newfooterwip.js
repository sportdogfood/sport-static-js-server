// Version 1 - Stage 9

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
  
  // Define the SessionManager to handle all session-related tasks
  const SessionManager = {
    session: null, // Placeholder for session data
  
    // Initialize or retrieve the session from localStorage
    initializeSession() {
      console.log("Initializing session...");
      if (!localStorage.getItem("thisUserSession")) {
        this.startSession({
          status: 'logged out', // Default state
          fx_customerId: window.fx_customerId || null,
          userMeta: {
            lastUpdate: getFriendlyDate(),
            lastScriptRun: getFriendlyDate(),
            sessionTime: 0 // Initialize sessionTime in seconds
          },
          userCookies: this.getCookies(), // Initialize userCookies by getting current cookies
          userGeo: this.getUserGeo(), // Initialize userGeo with geolocation data
          userPersona: {}, // Initialize userPersona as an empty object
          userCalc: {}, // Initialize userCalc as an empty object
          userContent: {}, // Initialize userContent as an empty object
  $1      userEvents: [] // Initialize userEvents as an empty array
        });
        console.log("New session started.");
      } else {
        this.getSession();
        console.log("Existing session loaded.", this.session);
      }
      this.getSportUrlCookie();
      this.checkForIdentification(); // Check if we can identify the user based on cookies or window properties
    },
  
    // Retrieve the session from localStorage
    getSession() {
      this.session = JSON.parse(localStorage.getItem("thisUserSession"));
      console.log("Session retrieved from localStorage.", this.session);
    },
  
    // Update the session with new data
    updateSession(newData) {
      if (!this.session) {
        this.getSession(); // Retrieve the session if it's not initialized
      }
      Object.assign(this.session, newData);
      this.session.userMeta.lastUpdate = getFriendlyDate();
      this.updateLocalStorage();
      console.log("Session updated with new data:", newData);
    },
  
    // Start a new session
    startSession(userData) {
      this.session = {
        ...userData,
        userMeta: {
          lastUpdate: getFriendlyDate(),
          lastScriptRun: getFriendlyDate(),
          sessionTime: 0 // Initialize sessionTime in seconds
        },
        userCookies: this.getCookies(), // Initialize userCookies by getting current cookies
        userGeo: this.getUserGeo(), // Initialize userGeo with geolocation data
        userPersona: {}, // Initialize userPersona as an empty object
        userCalc: {}, // Initialize userCalc as an empty object
        userCompare: {}, // Initialize userCompare as an empty object
        userEvents: [] // Initialize userEvents as an empty array
      };
      this.updateLocalStorage();
      console.log("Session started:", this.session);
    },
  
    // End the current session
    endSession() {
      this.session = null;
      localStorage.removeItem("thisUserSession");
      console.log("Session ended and removed from localStorage.");
    },
  
    // Helper to ensure localStorage is always updated with the current session
    updateLocalStorage() {
      if (this.session) {
        localStorage.setItem("thisUserSession", JSON.stringify(this.session));
        console.log("Session stored in localStorage:", this.session);
      }
    },
  
    // Check if the user is authenticated based on cookies and session
    isUserAuthenticated() {
      const cookieExists = document.cookie.includes('fx_customer_sso');
      const cookieCustomerIdExists = document.cookie.includes('fx_customerId');
      const cookieJwtExists = document.cookie.includes('fx_customer_jwt');
  
      const hasValidSession = this.session && this.session.status === 'logged in';
      let indicators = 0;
  
      if (cookieExists) indicators++;
      if (cookieCustomerIdExists) indicators++;
      if (cookieJwtExists) indicators++;
      if (hasValidSession) indicators++;
  
      console.log("Authentication check - indicators:", indicators);
      return indicators >= 2;
    },
  
    // Retrieve sporturl cookie and set global properties if found
    getSportUrlCookie() {
      const cookieString = document.cookie.split('; ').find(row => row.startsWith('sporturl='));
      if (cookieString) {
        const sporturlValue = decodeURIComponent(cookieString.split('=')[1]);
        const urlParams = new URLSearchParams(sporturlValue);
        window.fx_customerId = urlParams.get('cid');
        window.fx_customer_em = urlParams.get('em');
        const timestamp = urlParams.get('ts');
        window.lastvisit = timestamp ? new Date(parseInt(timestamp)).toLocaleString('en-US', { timeZone: 'America/New_York' }) : null;
        console.log("SportURL cookie parsed:", { fx_customerId: window.fx_customerId, fx_customer_em: window.fx_customer_em, lastvisit: window.lastvisit });
      }
    },
  
    // Retrieve all cookies as an object
    getCookies() {
      const cookies = document.cookie.split('; ');
      const cookieObj = {};
      cookies.forEach(cookie => {
        const [name, value] = cookie.split('=');
        cookieObj[name] = decodeURIComponent(value);
      });
      console.log("Cookies retrieved:", cookieObj);
      return cookieObj;
    },
  
    // Mock function to get user geolocation data
    getUserGeo() {
      // Placeholder for real geolocation logic (e.g., using an API)
      const geoData = {
        country: "Unknown",
        region: "Unknown",
        city: "Unknown"
      };
      console.log("Geolocation data retrieved:", geoData);
      return geoData;
    },
  
    // Check for identification using cookies and window properties
    checkForIdentification() {
      const cookies = this.getCookies();
      let identified = false;
      let jwtToken = null;
  
      if (cookies['fx_customer_sso'] || cookies['fx_customerId'] || cookies['fx_customer_jwt'] || cookies['fx_customer'] || cookies['fx_customer_em'] || cookies['sporturl'] || window.fx_customerEmail || window.fx_customerId) {
        identified = true;
        console.log("User identified based on cookies or window properties.");
        // Do something, e.g., update session state or trigger an action
        this.updateSession({ status: 'user-returning' });
        jwtToken = cookies['fx_customer_jwt'] || window.fx_customerJwt; // Get JWT token if available
      }
  
      console.log("Identification check completed. Identified:", identified);
  
      // Trigger to call findCustomer.js if a JWT token is found
      if (identified && jwtToken) {
        console.log("Triggering findCustomer with JWT token.");
        findCustomer(jwtToken);
      }
  
      // Load additional scripts in an attempt to identify the user prior to authentication
      this.loadIdentificationScripts();
    },
  
    // Manage user login
    handleLogin() {
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
    },
  
    // Manage user logout
    handleLogout() {
      // Custom logout process
      const thisUserSession = localStorage.getItem('thisUserSession');
      if (!thisUserSession) {
        console.error('No user session found in localStorage.');
        return;
      }
  
      // Parse the session object
      const sessionObject = JSON.parse(thisUserSession);
  
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
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then((data) => {
          console.log('Logout successfully sent:', data);
          // Additional cleanup after successful logout
          localStorage.removeItem('thisUserSession');
          localStorage.removeItem('fx_customerEmail');
          localStorage.removeItem('fx_customerId');
          localStorage.removeItem('thisUserState');
          localStorage.removeItem('thisUserZoom');
          localStorage.removeItem('thisUserContact');
          localStorage.removeItem('thisUserCustomer');
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('debug_update_fx:subscriptions');
          localStorage.removeItem('debug_update_fx:transactions');
  
          buttonMaster('logged out', 'handleLogout');
          pushPagesense('logout', fx_customerId);
        })
        .catch((error) => {
          console.error('There was an error during the logout process:', error);
        });
    },
  
    // Initialize userCart
    initializeUserCart() {
      console.log("Initializing user cart...");
      // Placeholder function to initialize user cart details if needed.
    },
  
    // Initialize userDesk
    initializeUserDesk() {
      console.log("Initializing user desk details...");
      // Placeholder function to initialize user desk details if needed.
    },
  
    // Initialize userCustomer
    initializeUserCustomer() {
      console.log("Initializing user customer details...");
      // Placeholder function to initialize user customer details if needed.
    },
  
    // Initialize userThrive
    initializeUserThrive() {
      console.log("Initializing user thrive details...");
      // Placeholder function to initialize user thrive details if needed.
    },
  
    // Initialize userAuto
    initializeUserAuto() {
      console.log("Initializing user auto details...");
      // Placeholder function to initialize user auto details if needed.
    },
  
    // Initialize userTrack
    initializeUserTrack() {
      console.log("Initializing user tracking details...");
      // Placeholder function to initialize user tracking details if needed.
    },
  
    // Initialize userTrans
    initializeUserTrans() {
      console.log("Initializing user transaction details...");
      // Placeholder function to initialize user transaction details if needed.
    },
  
    // Initialize userGetAgain
    initializeUserGetAgain() {
      console.log("Initializing user 'get again' details...");
      // Placeholder function to initialize user 'get again' details if needed.
    }
  };
  
  // Load identification scripts before authentication to assist in identifying users
  SessionManager.loadIdentificationScripts = function() {
    const scriptsToLoad = [
      { src: 'https://sportdogfood.github.io/sport-static-js-server/zocontact.js', id: 'zocontact', initFunction: 'zoContactInit' },
      { src: 'https://sportdogfood.github.io/sport-static-js-server/fxcustomer.js', id: 'fxcustomer', initFunction: 'fxCustomerInit' }
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
            window[scriptInfo.initFunction]();
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
          window[scriptInfo.initFunction]();
        } else {
          console.warn(`${scriptInfo.initFunction} function not found even though the script is loaded. Ensure it was correctly attached to the window.`);
        }
      }
    });
  };
  