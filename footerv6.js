type="module"

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
    if (!localStorage.getItem("thisUserSession")) {
      this.startSession({
        status: 'logged out', // Default state
        breed: false,
        reviews: false,
        comments: false,
        dogs: false,
        favorites: false,
        activities: false,
        likes: false,
        dislikes: false,
        weight: 60,
        lifestage: "adult",
        activity: "active",
        fx_customerId: window.fx_customerId || null,
        lastScriptRun: getFriendlyDate(),
        lastUpdate: getFriendlyDate()
      });
    } else {
      this.getSession();
    }
    this.getSportUrlCookie();
  },

  // Retrieve the session from localStorage
  getSession() {
    this.session = JSON.parse(localStorage.getItem("thisUserSession"));
  },

  // Update the session with new data
  updateSession(newData) {
    if (!this.session) {
      this.getSession(); // Retrieve the session if it's not initialized
    }
    Object.assign(this.session, newData);
    this.session.lastUpdate = getFriendlyDate();
    this.updateLocalStorage();
  },

  // Start a new session
  startSession(userData) {
    this.session = {
      ...userData,
      lastUpdate: getFriendlyDate(),
      lastScriptRun: getFriendlyDate()
    };
    this.updateLocalStorage();
  },

  // End the current session
  endSession() {
    this.session = null;
    localStorage.removeItem("thisUserSession");
  },

  // Helper to ensure localStorage is always updated with the current session
  updateLocalStorage() {
    if (this.session) {
      localStorage.setItem("thisUserSession", JSON.stringify(this.session));
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

    return indicators >= 2;
  },

  // Manage user login
  handleLogin() {
    this.updateSession({ status: 'logged in', calledBy: 'handleLogin' });
    buttonMaster('logged in', 'handleLogin');
    pushPagesense('login', this.session.fx_customerId);
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

  // Update a specific part of the user state in localStorage
  updateUserState(key, value) {
    let thisUserState = JSON.parse(localStorage.getItem("thisUserState")) || {};
    thisUserState[key] = value;
    localStorage.setItem("thisUserState", JSON.stringify(thisUserState));
    window.thisUser = { ...window.thisUser, [key]: value };
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
    }
  }
};

// Global user object
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

    // Set window.isAuthenticated to true or false
    window.isAuthenticated = updateObject.status === 'logged in';
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

        if (responseData.session_token && responseData.fc_customer_id) {
            document.dispatchEvent(new Event('authenticated'));
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

            // Set cookies for authenticated user
            document.cookie = `fx_customer=${responseData.fc_auth_token}; path=/;`;
            document.cookie = `fx_customerId=${responseData.fc_customer_id}; path=/;`;
            document.cookie = `fx_customer_em=${email}; path=/;`;
            document.cookie = `fx_customer_jwt=${responseData.jwt}; path=/;`;
            document.cookie = `fx_customer_sso=${responseData.sso}; path=/;`;
            const sportpin = Math.floor(1000 + Math.random() * 9000);
            const timestamp = Date.now();
            const sporturl = `https://www.sportdogfood.com/login&em=${email}&cid=${responseData.fc_customer_id}&pn=${sportpin}&ts=${timestamp}`;
            document.cookie = `sporturl=${encodeURIComponent(sporturl)}; path=/; max-age=${60 * 60 * 24 * 180}`;

            // Update user state and session
            initializeAndRun('authenticateCustomer');

            // Fetch additional customer data
            await fetchCustomerData(responseData.fc_customer_id);

            // Start timer to automatically load transactions and subscriptions if not triggered manually
            // startLazyLoadTimer();
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

// Function to fetch additional customer data
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

            // Store customer data in localStorage
            localStorage.setItem("thisUserZoom", JSON.stringify(responseData));
            updateUserState('Zoom', 'available');

            // Safely call initializeAndUpdate if it exists
            if (typeof window.initializeAndUpdate === 'function') {
                window.initializeAndUpdate();
            }

            // Extract first_name from responseData if available
            const first_name = responseData?.first_name || 'Unknown';

            // Update session state with customer data
            updateThisUserSession({ first_name: first_name, lastupdate: getFriendlyDateTime() });

            // Check if fx:attributes exists in responseData._embedded
            if (responseData?._embedded?.['fx:attributes']) {
                console.log('fx:attributes found, calling userAttributes function');
                userAttributes();

                // Call pushPagesense with customerId
                pushPagesense('login', customerId);
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

// Function to handle user attributes
function userAttributes() {
  try {
    const thisUserZoom = JSON.parse(localStorage.getItem('thisUserZoom'));
    if (!thisUserZoom || !thisUserZoom._embedded?.['fx:attributes']) {
      throw new Error('User attributes not available');
    }
    const attributes = thisUserZoom._embedded['fx:attributes'];

    let thisUserSession = JSON.parse(localStorage.getItem('thisUserSession')) || {};
    
    attributes.forEach((attribute) => {
      const name = attribute?.name || '';
      const value = attribute?.value ?? null;

      const attributeData = {
        attributeName: name,
        attributeValue: value,
        lastupdate: getFriendlyDateTime(),
      };
      
      thisUserSession[`userAttribute_${name}`] = attributeData;
    });

    // Update session
    localStorage.setItem('thisUserSession', JSON.stringify(thisUserSession));
  } catch (error) {
    console.error('An error occurred in userAttributes:', error);
  }
}

// Function to push Pagesense tracking
function pushPagesense(actionType, customerId) {
  console.log('Pagesense tracking for action:', actionType, 'Customer ID:', customerId);
  // Implement Pagesense-related tracking or interaction here based on action type
}

// Event listeners for DOM content loaded
document.addEventListener('authenticated', () => {
  const customerZoomScript = document.createElement('script');
  customerZoomScript.type = 'module';
  customerZoomScript.src = 'https://sportdogfood.github.io/sport-static-js-server/fxcustomerzoom.js';
  document.body.appendChild(customerZoomScript);

  const subscriptionsScript = document.createElement('script');
  subscriptionsScript.type = 'module';
  subscriptionsScript.src = 'https://sportdogfood.github.io/sport-static-js-server/fxsubscriptions.js';
  document.body.appendChild(subscriptionsScript);

  const transactionsScript = document.createElement('script');
  transactionsScript.type = 'module';
  transactionsScript.src = 'https://sportdogfood.github.io/sport-static-js-server/fxtransactions.js';
  document.body.appendChild(transactionsScript);
});

// Event listeners for DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
  SessionManager.initializeSession();

  const loginButton = document.getElementById('login-button');
  if (loginButton) {
    loginButton.addEventListener('click', () => {
      window.location.href = '/login';
    });
  }

  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      SessionManager.handleLogout();
    });
  }

  const authButton = document.getElementById('auth-button');
  if (authButton) {
    authButton.addEventListener('click', () => {
      authenticateCustomer();
    });
  }

  if (SessionManager.isUserAuthenticated()) {
    buttonMaster('logged in', 'DOMContentLoaded');
  } else {
    buttonMaster('logged out', 'DOMContentLoaded');
  }
});

