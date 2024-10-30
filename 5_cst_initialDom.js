/* =========== start_5_initialDom =========== */

if (!window.domContentLoadedListenerAdded) {
    window.domContentLoadedListenerAdded = true;
    document.addEventListener('DOMContentLoaded', () => {
        if (SessionManager && typeof SessionManager.initializeSession === 'function') {
            SessionManager.initializeSession();
        } else {
            console.error('SessionManager.initializeSession is not a function or is undefined');
        }

        // Populate the form only if the current path is '/login'
        const currentPath = window.location.pathname;
        if (currentPath === "/login") {
            populateFormFromParams(); // Populate the form on page load
        }

        // Attach button event listeners
        attachButtonEventListeners();

        // MutationObserver to attach button event listeners if buttons are dynamically added
        const observer = new MutationObserver(() => {
            attachButtonEventListeners();
        });

        observer.observe(document.body, { childList: true, subtree: true });

        // Set initial button state on DOM load
        const initialStatus = localStorage.getItem('fx_customerId') ? 'logged in' : 'logged out';
        buttonMaster(initialStatus, 'initial load');
        debouncedPushPagesense(initialStatus === 'logged in' ? 'session-restored' : 'session-initiated', localStorage.getItem('fx_customerId'));
    });
}

// Function to attach button event listeners
function attachButtonEventListeners() {
    const buttons = [
        {
            id: 'login-button',
            handler: () => {
                console.log('[EventListener] Login button clicked.');
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
                console.log('[EventListener] Logout button clicked.');
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
                console.log('[EventListener] Auth button clicked.');
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
            console.log(`[EventListener] Adding click event listener to button: ${id}`);
            button.addEventListener('click', handler);
            button.listenerAdded = true;
        } else if (!button) {
            console.warn(`[EventListener] Button with ID: ${id} not found in the DOM.`);
        }
    });
}

/* =========== end_5_initialDom =========== */