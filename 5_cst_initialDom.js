/* =========== start_5_initialDom =========== */

if (!window.domContentLoadedListenerAdded) {
    window.domContentLoadedListenerAdded = true;
    document.addEventListener('DOMContentLoaded', () => {
        if (SessionManager && typeof SessionManager.initializeSession === 'function') {
            SessionManager.initializeSession();
        } else {
            console.error('SessionManager.initializeSession is not a function or is undefined');
        }
        populateFormFromParams(); // Populate the form on page load

        function attachButtonEventListeners() {
            const buttons = [
                { id: 'login-button', handler: () => {
                    console.log('[EventListener] Login button clicked.');
                    if (SessionManager && typeof SessionManager.handleLogin === 'function') {
                        SessionManager.handleLogin();
                        debouncedPushPagesense('login-click', localStorage.getItem('fx_customerId'));
                    } else {
                        console.error('[EventListener] SessionManager.handleLogin is not a function or is undefined.');
                    }
                }},
                { id: 'logout-button', handler: () => {
                    console.log('[EventListener] Logout button clicked.');
                    if (SessionManager && typeof SessionManager.handleLogout === 'function') {
                        SessionManager.handleLogout();
                        debouncedPushPagesense('logout-click', localStorage.getItem('fx_customerId'));
                    } else {
                        console.error('[EventListener] SessionManager.handleLogout is not a function or is undefined.');
                    }
                }},
                { id: 'auth-button', handler: () => {
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
                }}
            ];
        
            buttons.forEach(({ id, handler }) => {
                const button = document.getElementById(id);
                if (button && !button.listenerAdded) {
                    console.log(`[EventListener] Adding click event listener to button: ${id}`);
                    button.addEventListener('click', handler);
                    button.listenerAdded = true;
                } else if (!button) {
                    console.error(`[EventListener] Button with ID: ${id} not found in the DOM.`);
                }
            });
        }

        attachButtonEventListeners();

// Add login button handler programmatically
document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('login-button');
    if (loginButton && !loginButton.listenerAdded) {
        loginButton.addEventListener('click', () => {
            console.log('[EventListener] Login button clicked. Redirecting to login page.');
            window.location.href = '/login';
        });
        loginButton.listenerAdded = true;
    }
});

const observer = new MutationObserver(() => {
    const loginButton = document.getElementById('login-button');
    const logoutButton = document.getElementById('logout-button');
    const statusDiv = document.getElementById('status-div');

    console.log(`[MutationObserver] Observing changes. loginButton found: ${!!loginButton}, logoutButton found: ${!!logoutButton}, statusDiv found: ${!!statusDiv}`);
    
    if (loginButton && logoutButton && statusDiv) {
        observer.disconnect(); // Stop observing once buttons are found
        console.log('[MutationObserver] Buttons found. Stopped observing and invoking buttonMaster.');
        buttonMaster('logged out', 'observer'); // Set initial state to logged out
    }
});

observer.observe(document.body, { childList: true, subtree: true });

        if (SessionManager && typeof SessionManager.isUserAuthenticated === 'function' ? SessionManager.isUserAuthenticated() : false) {
            buttonMaster('logged in', 'DOMContentLoaded');
            debouncedPushPagesense('session-restored', localStorage.getItem('fx_customerId'));
        } else {
            buttonMaster('logged out', 'DOMContentLoaded');
            debouncedPushPagesense('session-initiated', null);
        }
    });
}

/* =========== end_5_initialDom =========== */