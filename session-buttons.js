
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
defineButtonMaster();

