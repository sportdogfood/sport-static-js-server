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
        // Remove all related data from localStorage
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