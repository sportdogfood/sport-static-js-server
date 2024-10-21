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

// Initialize LocalStorage for user state
function initializeUserState() {
  let userState = localStorage.getItem('thisUserState');
  if (!userState) {
    const initialState = {
      status: 'logged out',
      lastUpdate: getFriendlyDate(),
    };
    localStorage.setItem('thisUserState', JSON.stringify(initialState));
  }
}

// Check if the user is logged in by validating multiple indicators
function isUserAuthenticated() {
  // 1. Check if the cookie 'fx_customer_sso' exists
  const cookieExists = document.cookie.includes('fx_customer_sso');

  // 2. Check if the 'fx_customerId' cookie exists
  const cookieCustomerIdExists = document.cookie.includes('fx_customerId');

  // 3. Check if the 'fx_customer_jwt' cookie exists
  const cookieJwtExists = document.cookie.includes('fx_customer_jwt');

  // 4. Check if the 'window.fx_customerId' variable exists and is truthy
  const windowVarExists = typeof window.fx_customerId !== 'undefined' && window.fx_customerId;

  // 5. Check if the 'thisUserSession' key exists in localStorage
  const localStorageSession = localStorage.getItem('thisUserSession');

  // 6. Check if the 'thisUserState' key exists in localStorage and if the status is 'logged in'
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

// Global variable for isAuthenticated state
let isAuthenticated = false;

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
}

// Function to be called externally to initialize and update the UI
function initializeAndRun(Auth = null) {
  // Initialize user state
  initializeUserState();

  // Check if user is authenticated based on the indicators
  isAuthenticated = isUserAuthenticated();

  // Store isAuthenticated in localStorage with a timestamp
  const friendlyDate = getFriendlyDate();
  localStorage.setItem('isAuthenticated', JSON.stringify({
    value: isAuthenticated,
    timestamp: friendlyDate,
  }));

  // If Auth is provided and is true, or if isAuthenticated is true, handle the authenticated state
  if (Auth === 'authenticated' || isAuthenticated) {
    buttonMaster('logged in', 'initializeAndRun');
  } else {
    // Otherwise, update the UI based on the stored state
    const userState = JSON.parse(localStorage.getItem('thisUserState'));
    buttonMaster(userState.status, 'initializeAndRun');
  }
}

// Expose initializeAndRun function to be called externally
window.initializeAndRun = initializeAndRun;

// Set up login button click listener to simulate login (you might have a proper login event elsewhere)
document.getElementById('login-button').addEventListener('click', () => {
  handleLogin();
});

