
/* =========== start_8_sessionUserLogin =========== */

SessionManager.handleLogin = function () {
    console.log('[SessionManager] handleLogin called.');
    this.updateSession({ status: 'logged in', calledBy: 'handleLogin' });
    buttonMaster('logged in', 'handleLogin');
    pushPagesense('login', this.session.fx_customerId);

    if (window.fx_customerId) {
        console.log('[SessionManager] Authenticated user found, initializing user data...');
        this.initializeUserZoom();
        this.initializeUserCart();
        this.initializeUserDesk();
        this.initializeUserCustomer();
        this.initializeUserThrive();
    } else {
        console.error('[SessionManager] fx_customerId is not set. Skipping user data initialization.');
    }
};
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
/* =========== end_8_sessionUserLogin =========== */