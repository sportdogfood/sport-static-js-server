console.log('fxsubscriptions.js is executing properly.');

// Function to handle user subscriptions with a single controlled execution
function subscriptionsInit() {
    try {
        // Ensure `userZoom` and `fx_customerId` are available before proceeding
        if (!window.userZoom || !window.fx_customerId) {
            console.warn('UserZoom or fx_customerId not available. subscriptionsInit will not run.');
            return;
        }

        // Read userZoom data from localStorage
        const userZoomRaw = localStorage.getItem('userZoom');
        if (!userZoomRaw) {
            console.warn('UserZoom data not found in localStorage. Initialization will not proceed.');
            return;
        }

        // Parse userZoom data
        let userZoom = JSON.parse(userZoomRaw);

        // Verify userZoom is valid
        if (!userZoom || typeof userZoom !== 'object') {
            console.warn('Parsed userZoom data is not valid. Initialization will not proceed.');
            return;
        }

        // Avoid re-processing if subscriptions are already processed
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

        // Update session in localStorage without overwriting other properties
        localStorage.setItem('userSession', JSON.stringify(userSession));
        console.log("Subscriptions have been successfully processed and stored in userSession.");

        // Merge `fx:subscriptions` into `userZoom._embedded` without overwriting other properties
        userZoom._embedded = {
            ...userZoom._embedded,
            'fx:subscriptions': processedSubscriptions.length > 0 ? processedSubscriptions : []
        };

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

// Attach the init function to the global window object for external access
window.subscriptionsInit = subscriptionsInit;

// Ensure subscriptionsInit runs only when called explicitly by `fxcustomerzoom.js`
// Removed automatic triggering logic to ensure it does not run unless explicitly requested
