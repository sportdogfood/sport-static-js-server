function attachButtonEventListeners() {
    const buttons = [
        {
            id: 'login-button',
            handler: () => {
                //console.log('[EventListener] Login button clicked.');
                if (SessionManager && typeof SessionManager.handleLogin === 'function') {
                    SessionManager.handleLogin();
                    debouncedPushPagesense('login-click', localStorage.getItem('fx_customerId'));
                } else {
                    console.error('[EventListener] SessionManager.handleLogin is not a function or is undefined.');
                }
            }
        },
        {
            id: 'logout-button',
            handler: () => {
               // console.log('[EventListener] Logout button clicked.');
                if (SessionManager && typeof SessionManager.handleLogout === 'function') {
                    SessionManager.handleLogout();
                    debouncedPushPagesense('logout-click', localStorage.getItem('fx_customerId'));
                } else {
                    console.error('[EventListener] SessionManager.handleLogout is not a function or is undefined.');
                }
            }
        },
        {
            id: 'auth-button',
            handler: () => {
               // console.log('[EventListener] Auth button clicked.');
                if (typeof authenticateCustomer === 'function') {
                    authenticateCustomer()
                        .then(() => {
                            debouncedPushPagesense('auth-click', null);
                        })
                        .catch((error) => {
                            console.error('[EventListener] Error during authenticateCustomer:', error);
                        });
                } else {
                    console.error('[EventListener] authenticateCustomer is not a function or is undefined.');
                }
            }
        }
    ];

    buttons.forEach(({ id, handler }) => {
        const button = document.getElementById(id);
        if (button && !button.listenerAdded) {
           // console.log(`[EventListener] Adding click event listener to button: ${id}`);
            button.addEventListener('click', handler);
            button.listenerAdded = true;
        } else if (!button) {
            console.warn(`[EventListener] Button with ID: ${id} not found in the DOM.`);
        }
    });
}

// Function to attach button event listeners
function attachButtonEventListeners() {
    const buttons = [
        {
            id: 'login-button',
            handler: () => {
              //  console.log('[EventListener] Login button clicked.');
                if (SessionManager && typeof SessionManager.handleLogin === 'function') {
                    SessionManager.handleLogin();
                    debouncedPushPagesense('login-click', localStorage.getItem('fx_customerId'));
                } else {
                    console.error('[EventListener] SessionManager.handleLogin is not a function or is undefined.');
                }
            }
        },
        {
            id: 'logout-button',
            handler: () => {
              //  console.log('[EventListener] Logout button clicked.');
                if (SessionManager && typeof SessionManager.handleLogout === 'function') {
                    SessionManager.handleLogout();
                    debouncedPushPagesense('logout-click', localStorage.getItem('fx_customerId'));
                } else {
                    console.error('[EventListener] SessionManager.handleLogout is not a function or is undefined.');
                }
            }
        },
        {
            id: 'auth-button',
            handler: () => {
               // console.log('[EventListener] Auth button clicked.');
                if (typeof authenticateCustomer === 'function') {
                    authenticateCustomer().then(() => {
                        debouncedPushPagesense('auth-click', null);
                    }).catch((error) => {
                        console.error('[EventListener] Error during authenticateCustomer:', error);
                    });
                } else {
                    console.error('[EventListener] authenticateCustomer is not a function or is undefined.');
                }
            }
        }
    ];

    buttons.forEach(({ id, handler }) => {
        const button = document.getElementById(id);
        if (button && !button.listenerAdded) {
         //   console.log(`[EventListener] Adding click event listener to button: ${id}`);
            button.addEventListener('click', handler);
            button.listenerAdded = true;
        } else if (!button) {
            console.warn(`[EventListener] Button with ID: ${id} not found in the DOM.`);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (SessionManager && typeof SessionManager.initializeSession === 'function') {
        SessionManager.initializeSession();
    } else {
        console.error('SessionManager.initializeSession is not a function or is undefined');
    }
    
    populateFormFromParams(); // Populate the form on page load

    // Function to attach button event listeners
    function attachButtonEventListeners() {
        const buttons = [
            {
                id: 'login-button',
                handler: () => {
                    if (SessionManager && typeof SessionManager.handleLogin === 'function') {
                        SessionManager.handleLogin();
                        debouncedPushPagesense('login-click', localStorage.getItem('fx_customerId'));
                    } else {
                        console.error('SessionManager.handleLogin is not a function or is undefined');
                    }
                }
            },
            {
                id: 'logout-button',
                handler: () => {
                    if (SessionManager && typeof SessionManager.handleLogout === 'function') {
                        SessionManager.handleLogout();
                        debouncedPushPagesense('logout-click', localStorage.getItem('fx_customerId'));
                    } else {
                        console.error('SessionManager.handleLogout is not a function or is undefined');
                    }
                }
            },
            {
                id: 'auth-button',
                handler: () => {
                    if (typeof authenticateCustomer === 'function') {
                        authenticateCustomer()
                            .then(() => {
                                debouncedPushPagesense('auth-click', null);
                            })
                            .catch((error) => {
                                console.error('Error during authenticateCustomer:', error);
                            });
                    } else {
                        console.error('authenticateCustomer is not a function or is undefined');
                    }
                }
            }
        ];

        buttons.forEach(({ id, handler }) => {
            const button = document.getElementById(id);
            if (button && !button.listenerAdded) {
                button.addEventListener('click', handler);
                button.listenerAdded = true;
            }
        });
    }

    // Attach event listeners initially
    attachButtonEventListeners();

    const observer = new MutationObserver(() => {
        const loginButton = document.getElementById('login-button');
        const logoutButton = document.getElementById('logout-button');
        const statusDiv = document.getElementById('status-div');
    
        if (loginButton && logoutButton) {
            observer.disconnect(); // Stop observing once buttons are found
            attachButtonEventListeners(); // Attach event listeners to buttons
            buttonMaster(SessionManager && typeof SessionManager.isUserAuthenticated === 'function' && SessionManager.isUserAuthenticated() ? 'logged in' : 'logged out', 'observer');
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Handle session state on load
    if (SessionManager && (typeof SessionManager.isUserAuthenticated === 'function' && SessionManager.isUserAuthenticated())) {
        buttonMaster('logged in', 'DOMContentLoaded');
        debouncedPushPagesense('session-restored', localStorage.getItem('fx_customerId'));
    } else {
        buttonMaster('logged out', 'DOMContentLoaded');
        debouncedPushPagesense('session-initiated', null);
    }
});

function attachButtonEventListeners() {
    const buttons = [
        {
            id: 'login-button', handler: () => {
               // console.log('[EventListener] Login button clicked.');
                if (SessionManager && typeof SessionManager.handleLogin === 'function') {
                    SessionManager.handleLogin();
                    debouncedPushPagesense('login-click', localStorage.getItem('fx_customerId'));
                } else {
                    console.error('[EventListener] SessionManager.handleLogin is not a function or is undefined.');
                }
            }
        },
        {
            id: 'logout-button', handler: () => {
              //  console.log('[EventListener] Logout button clicked.');
                if (SessionManager && typeof SessionManager.handleLogout === 'function') {
                    SessionManager.handleLogout();
                    debouncedPushPagesense('logout-click', localStorage.getItem('fx_customerId'));
                } else {
                    console.error('[EventListener] SessionManager.handleLogout is not a function or is undefined.');
                }
            }
        },
        {
            id: 'auth-button', handler: () => {
              //  console.log('[EventListener] Auth button clicked.');
                if (typeof authenticateCustomer === 'function') {
                    authenticateCustomer().then(() => {
                        debouncedPushPagesense('auth-click', null);
                    }).catch((error) => {
                        console.error('[EventListener] Error during authenticateCustomer:', error);
                    });
                } else {
                    console.error('[EventListener] authenticateCustomer is not a function or is undefined.');
                }
            }
        }
    ];

    buttons.forEach(({ id, handler }) => {
        const button = document.getElementById(id);
        if (button) {
            if (!button.listenerAdded) {
              //  console.log(`[EventListener] Adding click event listener to button: ${id}`);
                button.addEventListener('click', handler);
                button.listenerAdded = true;
            } else {
              //  console.log(`[EventListener] Button with ID: ${id} already has an event listener.`);
            }
        } else {
            // Log at debug level rather than an error to avoid noise on non-login/logout pages.
            console.debug(`[EventListener] Button with ID: ${id} not found on the current page. Skipping.`);
        }
    });
}