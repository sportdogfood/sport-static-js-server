// Utility functions shared across the project
export function getFriendlyDate() {
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
  
  export function buttonMaster(status, caller) {
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
  