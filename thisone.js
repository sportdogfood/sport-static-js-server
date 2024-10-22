 type="module"
import { handleLogout as importedHandleLogout } from 'https://sportdogfood.github.io/sport-static-js-server/logoutHandler.js';

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
  },

  // Manage user logout
  handleLogout() {
    importedHandleLogout(); // Imported logout function for extra steps

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
  }
};

// Global user object
window.thisUser = {};

// Function to manage button display and update status in the UI
function buttonMaster(status, caller) {
  const loginButton = document.getElementById('login-button');
  const logoutButton = document.getElementById('logout-button');
  const statusDiv = document.getElementById('status-div');
  const friendlyDate = getFriendlyDate();

  statusDiv.textContent = `${status} at ${friendlyDate} by ${caller}`;
  statusDiv.style.display = 'block';

  if (status === 'logged in') {
    loginButton.style.display = 'none';
    logoutButton.style.display = 'inline';
  } else if (status === 'logged out') {
    loginButton.style.display = 'inline';
    logoutButton.style.display = 'none';
  }
}

// User Attributes Function to update user attributes
async function userAttributes() {
  try {
    const thisUserZoom = JSON.parse(localStorage.getItem('thisUserZoom'));

    if (!thisUserZoom || !thisUserZoom._embedded?.['fx:attributes']) {
      throw new Error('thisUserZoom or fx:attributes not available');
    }

    const attributes = thisUserZoom._embedded['fx:attributes'];

    if (!Array.isArray(attributes)) {
      throw new Error('fx:attributes is not an array as expected');
    }

    let thisUserSession = JSON.parse(localStorage.getItem('thisUserSession')) || {};

    attributes.forEach((attribute, index) => {
      const name = attribute?.name || '';
      let value = attribute?.value ?? null;

      const href = attribute?._links?.self?.href;
      const fxAtt = extractIdFromHref(href);
      const lastupdate = getFriendlyDate();

      if (typeof value !== 'string' && typeof value !== 'number') {
        value = String(value);
      }

      const attributeData = {
        attributeName: name,
        attributeValue: value,
        fxAtt,
        lastupdate,
      };

      switch (name.toLowerCase()) {
        case 'zoho_crm_id':
          thisUserSession.zoho_crm_id = attributeData;
          break;
        case 'loyalty_points':
          thisUserSession.loyalty_points = attributeData;
          break;
        case 'loyalty_level':
          thisUserSession.loyalty_level = attributeData;
          break;
        default:
          thisUserSession[`userAttribute_${index}`] = attributeData;
          break;
      }
    });

    SessionManager.updateSession(thisUserSession);
  } catch (error) {
    console.error('An error occurred in userAttributes:', error);
  }
}

// Function to authenticate customer (needs full implementation)
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
      window.fx_customerId_global = responseData.fc_customer_id;

      window.thisUser.customerData = responseData;
      window.thisUser.customerEmail = email;

      const resultElement = document.getElementById('authResult');
      if (resultElement) {
        resultElement.textContent = "Authentication successful! Welcome.";
        resultElement.style.display = 'block';
      }

      localStorage.setItem("fx_customerEmail", email);
      localStorage.setItem("fx_customerId", responseData.fc_customer_id);

      SessionManager.updateUserState("status", 'logged in');
      SessionManager.updateUserState("lastUpdate", getFriendlyDate());
      SessionManager.updateUserState("calledBy", 'authenticateCustomer');

      await fetchCustomerData(responseData.fc_customer_id);
    } else {
      const resultElement = document.getElementById('authResult');
      if (resultElement) {
        resultElement.textContent = "Authentication failed: Missing session_token or customer ID.";
        resultElement.style.display = 'block';
      }
    }
  } catch (error) {
 
    console.error('An error occurred in userAttributes:', error);
}
}

// Function to authenticate customer
async function authenticateCustomer() {
// (authentication logic, similar to previous scripts)
// Updates session using `SessionManager.updateSession()`
}

document.addEventListener('DOMContentLoaded', () => {
SessionManager.initializeSession();

const loginButton = document.getElementById('login-button');
if (loginButton) {
  loginButton.addEventListener('click', () => {
    authenticateCustomer();
  });
}

const logoutButton = document.getElementById('logout-button');
if (logoutButton) {
  logoutButton.addEventListener('click', () => {
    SessionManager.handleLogout();
  });
}

if (SessionManager.isUserAuthenticated()) {
  buttonMaster('logged in', 'DOMContentLoaded');
} else {
  buttonMaster('logged out', 'DOMContentLoaded');
}
});

