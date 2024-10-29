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
  },  // <---- Stage 1: Session Initialization and Retrieval ---->

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
  },  // <---- Stage 2: Updating Session Data ---->

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
  },  // <---- Stage 3: Starting and Ending Sessions ---->

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
  },  // <---- Stage 4: User Authentication Check ---->

  // Manage user login
  handleLogin() {
    this.updateSession({ status: 'logged in', calledBy: 'handleLogin' });
    buttonMaster('logged in', 'handleLogin');
    pushPagesense('login', this.session.fx_customerId);
  },  // <---- Stage 5: Handle User Login ---->

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
  },  // <---- Stage 6: Handle User Logout ---->

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
  }  // <---- Stage 7: Manage Cookies and Retrieve Information ---->
};

// <---- Stage 8: General Global Setup and Helper Functions ---->
// Global user object
window.thisUser = {};

// Helper function to get the current date and time in a friendly format
function getFriendlyDateTime() {
    const now = new Date();
    return now.toLocaleString(); // You can modify this format as needed
}

// Attach `initializeAndRun` to `window` to make it globally accessible
window.initializeAndRun = initializeAndRun;

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
});  // <---- Stage 9: DOM Content Loaded Event Listener ---->

