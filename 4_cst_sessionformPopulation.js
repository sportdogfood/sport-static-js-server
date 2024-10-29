/* =========== start_4_sessionformPopulation =========== */

document.addEventListener('DOMContentLoaded', () => {
    const currentPath = window.location.pathname;

    if (currentPath === "/login") {
        // Run form population only on the login page
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            populateFormFromParams();
        } else {
            console.warn("Login form not found on /login page.");
        }
    }

    // Attach event listeners to buttons on the page
    attachButtonEventListeners();
});

function populateFormFromParams() {
    const params = new URLSearchParams(window.location.search);
    const loginForm = document.getElementById('loginForm');

    if (!loginForm) {
        console.warn("Login form not found, skipping form population.");
        return;
    }

    // Populate form fields
    const emailField = loginForm.querySelector('#em');
    const passwordField = loginForm.querySelector('#passwordInput');
    const customerIdField = loginForm.querySelector('#cid');

    if (params.has('em') && emailField) emailField.value = params.get('em');
    if (params.has('pw') && passwordField) passwordField.value = params.get('pw');
    if (params.has('cid') && customerIdField) customerIdField.value = params.get('cid');

    // Specific checks for admin
    if (params.get('admin') === '1527') {
        const secField = loginForm.querySelector('#sec');
        const stnField = loginForm.querySelector('#stn');

        if (params.has('sec') && secField) {
            secField.value = params.get('sec');
        }

        if (params.has('stn') && stnField) {
            stnField.value = params.get('stn');
        }
    }
}

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
            console.log(`[EventListener] Adding click event listener to button: ${id}`);
            button.addEventListener('click', handler);
            button.listenerAdded = true;
        } else if (!button) {
            console.warn(`[EventListener] Button with ID: ${id} not found in the DOM.`);
        }
    });
}

/* =========== end_4_sessionformPopulation =========== */
