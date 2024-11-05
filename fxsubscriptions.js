console.log('fxsubscriptions.js is executing properly.');

// Function to handle user subscriptions with a single controlled execution
function subscriptionsInit() {
    try {
        // Only proceed if userZoom and fx_customerId are available
        if (!window.userZoom || !window.fx_customerId) {
            console.warn('UserZoom or fx_customerId not available. subscriptionsInit will not run.');
            return;
        }

        // Read from localStorage
        const userZoomRaw = localStorage.getItem('userZoom');
        if (!userZoomRaw) {
            console.error('UserZoom data not available. Initialization aborted.');
            return;
        }

        // Parse userZoom data
        let userZoom = JSON.parse(userZoomRaw);

        // Check if userZoom is available
        if (!userZoom) {
            console.error('UserZoom is not available. Initialization aborted.');
            return;
        }

        // Check if subscriptions have already been processed to avoid re-execution
        let userSession = JSON.parse(localStorage.getItem('userSession')) || {};
        if (userSession['subscriptionsProcessed'] || userZoom._embedded?.['fx:subscriptions']) {
            console.info('Subscriptions have already been processed. Skipping re-execution.');
            return;
        }

        // Assume subscriptions data is retrieved from an API or local data
        const subscriptions = fetchSubscriptionsData(); // Placeholder function for fetching subscriptions data
        const processedSubscriptions = []; // Array to store processed subscriptions for userZoom

        subscriptions.forEach((subscription) => {
            const id = subscription?.id || '';
            const status = subscription?.status ?? null;

            const subscriptionData = {
                subscriptionId: id,
                subscriptionStatus: status,
                lastupdate: getFriendlyDateTime(),
            };

            // Add to userSession
            userSession[`userSubscription_${id}`] = subscriptionData;

            // Add to processedSubscriptions for userZoom
            processedSubscriptions.push(subscriptionData);
        });

        // Mark subscriptions as processed in userSession
        userSession['subscriptionsProcessed'] = true;

        // Update session in localStorage
        localStorage.setItem('userSession', JSON.stringify(userSession));
        console.log("Subscriptions have been successfully processed and stored in userSession.");

        // Add fx:subscriptions to userZoom._embedded, ensuring it is added even if empty
        userZoom._embedded = userZoom._embedded || {};
        userZoom._embedded['fx:subscriptions'] = processedSubscriptions.length > 0 ? processedSubscriptions : [];
        console.log("fx:subscriptions set in userZoom._embedded:", userZoom._embedded['fx:subscriptions']);

        // Update userZoom in localStorage
        localStorage.setItem('userZoom', JSON.stringify(userZoom));
        console.log("Subscriptions have been successfully processed and added to userZoom.");

    } catch (error) {
        console.error('An error occurred in subscriptionsInit:', error);
    }
}

// Helper function to get friendly date and time
function getFriendlyDateTime() {
    const now = new Date();
    return now.toLocaleString();
}

// Placeholder function to simulate fetching subscriptions data
function fetchSubscriptionsData() {
    // Replace with actual API call or data retrieval logic
    return [
        { id: 'sub1', status: 'active' },
        { id: 'sub2', status: 'inactive' }
    ];
}

// Make sure the init function is available globally if needed
window.subscriptionsInit = subscriptionsInit;

// Ensure subscriptionsInit is only run when explicitly called or when userZoom is ready
document.addEventListener('userZoomReady', () => {
    if (window.userZoom && window.fx_customerId) {
        console.log('UserZoom is now available. Triggering subscriptionsInit.');
        window.subscriptionsInit();
    }
});