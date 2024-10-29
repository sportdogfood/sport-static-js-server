/* =========== start_10_eventsAuth =========== */

function attachButtonEventListeners() {
    const buttons = [
        {
            id: 'login-button', handler: () => {
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
            id: 'logout-button', handler: () => {
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
            id: 'auth-button', handler: () => {
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
        if (button) {
            if (!button.listenerAdded) {
                console.log(`[EventListener] Adding click event listener to button: ${id}`);
                button.addEventListener('click', handler);
                button.listenerAdded = true;
            } else {
                console.log(`[EventListener] Button with ID: ${id} already has an event listener.`);
            }
        } else {
            // Log at debug level rather than an error to avoid noise on non-login/logout pages.
            console.debug(`[EventListener] Button with ID: ${id} not found on the current page. Skipping.`);
        }
    });
}

/* =========== end_10_eventsAuth =========== */
