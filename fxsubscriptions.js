console.log('fxsubscriptions.js is executing properly.');

// Function to handle user subscriptions with a single controlled execution
function subscriptionsInit() {
    try {
        // Ensure `fx_customerId` is available before proceeding
        if (!window.fx_customerId) {
            console.warn('fx_customerId not available. subscriptionsInit will not run.');
            return;
        }

        // Avoid re-processing if subscriptions are already processed
        let userSession = JSON.parse(localStorage.getItem('userSession')) || {};
        if (userSession['subscriptionsProcessed']) {
            console.info('Subscriptions have already been processed. Skipping re-execution.');
            return;
        }

        // Assume subscriptions data is retrieved from an API or local data
        const subscriptions = fetchSubscriptionsData(); // Placeholder function for fetching subscriptions data
        const activeSubscriptions = []; // Array to store active subscriptions only

        subscriptions.forEach((subscription) => {
            const id = subscription?.id || '';
            const status = subscription?.status ?? null;

            if (status === 'active') {
                const subscriptionData = {
                    subscriptionId: id,
                    subscriptionStatus: status,
                    lastupdate: getFriendlyDateTime(),
                };

                // Add active subscriptions to the list
                activeSubscriptions.push(subscriptionData);
            }
        });

        // Mark subscriptions as processed in userSession
        userSession['subscriptionsProcessed'] = true;

        // Update session in localStorage without overwriting other properties
        localStorage.setItem('userSession', JSON.stringify(userSession));
        console.log("Subscriptions have been successfully processed and stored in userSession.");

        // Create and save the userSubscriptions in localStorage
        const userSubscriptions = {
            'fx:subscriptions': activeSubscriptions.length > 0 ? activeSubscriptions : [],
            lastUpdated: getFriendlyDateTime(),
            totalItems: activeSubscriptions.length,
        };

        // Save userSubscriptions to localStorage
        localStorage.setItem('userSubscriptions', JSON.stringify(userSubscriptions));
        console.log("Active subscriptions have been successfully processed and added to userSubscriptions.");

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
        { id: 'sub2', status: 'inactive' },
        { id: 'sub3', status: 'active' }
    ];
}

// Attach the init function to the global window object for external access
window.subscriptionsInit = subscriptionsInit;

// Ensure subscriptionsInit runs only when called explicitly by `fxcustomerzoom.js`
// Removed automatic triggering logic to e