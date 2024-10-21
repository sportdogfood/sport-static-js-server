// Function to handle logout event
function handleLogout() {
    // Retrieve thisUserSession from localStorage
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
        // Additional cleanup, e.g., removing items from localStorage after a successful logout
        localStorage.removeItem('thisUserSession');
        localStorage.removeItem('fx_customerEmail');
        localStorage.removeItem('fx_customerId');
        //fx_customerEmail,thisUserState,thisUserZoom, thisUserContact, thisUserCustomer, isAuthenticated, debug_update_fx:subscriptions,debug_update_fx:transactions 

      })
      .catch((error) => {
        console.error('There was an error during the logout process:', error);
      });
  }
  
  // Export the handleLogout function so it can be called from another script
  export { handleLogout };
  