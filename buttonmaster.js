type="module"
import { handleLogout } from 'https://sportdogfood.github.io/sport-static-js-server/logoutHandler.js';

// Utility to get friendly date format
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

// Global variable for isAuthenticated state
let isAuthenticated = false;

// Check if the user is logged in by validating multiple indicators
function isUserAuthenticated() {
  const cookieExists = document.cookie.includes('fx_customer_sso');
  const cookieCustomerIdExists = document.cookie.includes('fx_customerId');
  const cookieJwtExists = document.cookie.includes('fx_customer_jwt');
  const windowVarExists = typeof window.fx_customerId !== 'undefined' && window.fx_customerId;

  const localStorageSession = localStorage.getItem('thisUserSession');
  const localStorageState = JSON.parse(localStorage.getItem('thisUserState'));

  // Initialize an indicator count
  let indicators = 0;

  // Increment the count for each valid indicator
  if (cookieExists) indicators++;
  if (cookieCustomerIdExists) indicators++;
  if (cookieJwtExists) indicators++;
  if (windowVarExists) indicators++;
  if (localStorageSession) indicators++;
  if (localStorageState && localStorageState.status === 'logged in') indicators++;

  // Assume user is authenticated if at least two indicators are positive
  return indicators >= 2;
}

// Expose isUserAuthenticated globally
window.isUserAuthenticated = isUserAuthenticated;

// Initialize LocalStorage for user state
function initializeUserState() {
  // Retrieve the existing thisUserState from localStorage
  let userState = JSON.parse(localStorage.getItem('thisUserState'));

  // If there's no existing userState, initialize it
  if (!userState || Object.keys(userState).length === 0) {
    const initialState = {
      status: 'logged out',
      lastUpdate: getFriendlyDate(),
    };

    // Set initial state to localStorage
    localStorage.setItem('thisUserState', JSON.stringify(initialState));
  }
}

// Function to manage button display and update status in LocalStorage
function buttonMaster(status, caller) {
  if (status === 'logged out') {
    // Call the imported handleLogout to perform the full logout process
    handleLogout();
  }

  const loginButton = document.getElementById('login-button');
  const logoutButton = document.getElementById('logout-button');
  const statusDiv = document.getElementById('status-div');
  const friendlyDate = getFriendlyDate();

  // Update localStorage with the new status
  const userState = {
    status: status,
    lastUpdate: friendlyDate,
    calledBy: caller,
  };
  localStorage.setItem('thisUserState', JSON.stringify(userState));

  // Update the status div
  statusDiv.textContent = `${status} at ${friendlyDate} by ${caller}`;
  statusDiv.style.display = 'block';

  // Update button visibility based on new status
  if (status === 'logged in') {
    loginButton.style.display = 'none';
    logoutButton.style.display = 'inline';
  } else if (status === 'logged out') {
    loginButton.style.display = 'inline';
    logoutButton.style.display = 'none';
  }
}

// Function to handle login actions
function handleLogin() {
  // Example of setting localStorage key for user state
  const friendlyDate = getFriendlyDate();
  const userState = {
    status: 'logged in',
    lastUpdate: friendlyDate,
    calledBy: 'handleLogin',
  };
  localStorage.setItem('thisUserState', JSON.stringify(userState));

  // Update UI to reflect logged-in status
  const loginButton = document.getElementById('login-button');
  const logoutButton = document.getElementById('logout-button');
  loginButton.style.display = 'none';
  logoutButton.style.display = 'inline';

  // Optionally, set cookies if required
  document.cookie = "fx_customer_sso=true; path=/;";
  document.cookie = `fx_customerId=${window.fx_customerId || ''}; path=/;`;
  document.cookie = `fx_customer_jwt=${someJwtValue || ''}; path=/;`;

  // Update status div
  const statusDiv = document.getElementById('status-div');
  statusDiv.textContent = `logged in at ${friendlyDate} by handleLogin`;
  statusDiv.style.display = 'block';

  // Sync the authentication state after login
  checkAndSyncAuthState();
}

// Function to check and synchronize the authentication state
function checkAndSyncAuthState() {
  // Check if user is authenticated based on the indicators
  if (typeof isUserAuthenticated === 'function') {
    isAuthenticated = isUserAuthenticated();
  } else {
    console.error('isUserAuthenticated function is not defined');
    isAuthenticated = false;
  }

  // Store isAuthenticated in localStorage with a timestamp
  const friendlyDate = getFriendlyDate();
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

// Function to be called externally to initialize and update the UI
function initializeAndRun(Auth = null) {
  // Initialize user state
  initializeUserState();

  // Run authentication check and sync state
  checkAndSyncAuthState();

  // If Auth is provided and is true, handle the authenticated state
  if (Auth === 'authenticated') {
    buttonMaster('logged in', 'initializeAndRun');
  }
}

// Expose initializeAndRun function to be called externally
window.initializeAndRun = initializeAndRun;

// Set up login button click listener to simulate login (you might have a proper login event elsewhere)
document.addEventListener('DOMContentLoaded', () => {
  const loginButton = document.getElementById('login-button');
  if (loginButton) {
    loginButton.addEventListener('click', () => {
      handleLogin();
    });
  }

  // Run the check and sync function on load to ensure the buttons reflect the current auth state
  checkAndSyncAuthState();
});

