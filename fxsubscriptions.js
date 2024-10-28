console.log('fxsubscriptions.js is executing properly.');

// Define the function to fetch FoxyCart subscriptions
async function fetchFoxyCartSubscriptions(customerId) {
    if (!customerId) {
        console.error("Customer ID is missing or invalid.");
        return { total_items: 0, subscriptions: [] };
    }

    const proxyUrl = `https://sportcorsproxy.herokuapp.com/foxycart/subscriptions?customer_id=${customerId}`;

    try {
        const response = await fetch(proxyUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (response.status === 404) {
            console.log("No active subscriptions found for this customer (404 response).");
            return { total_items: 0, subscriptions: [] };
        }

        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Response data:", data);

        const totalItems = data.total_items || 0;
        const subscriptions = data.subscriptions || [];

        if (subscriptions.length === 0) {
            console.log("No subscriptions found in response data.");
        }

        // Properly update fx:subscriptions in _embedded using the global function
        if (typeof window.updateEmbeddedData === 'function') {
            window.updateEmbeddedData('fx:subscriptions', subscriptions);
        } else {
            console.error("updateEmbeddedData function not found in global scope.");
        }

        // Update session state using the global function
        if (typeof window.updateUserSession === 'function') {
            window.updateUserSession({ subscriptionsFetched: true, lastupdate: getFriendlyDateTime() });
            window.updateUserSession({ subscriptions_totalItems: totalItems, lastupdate: getFriendlyDateTime() });
        } else {
            console.error("updateUserSession function not found in global scope.");
        }

        return { total_items: totalItems, subscriptions: subscriptions };

    } catch (error) {
        console.error("Failed to fetch data from FoxyCart API: ", error);
        return { total_items: 0, subscriptions: [] };
    }
}

// Define the main initialization function for subscriptions
function subscriptionsInit() {
    console.log('fxsubscriptions.js initialization function is called.');

    // Ensure that the customer ID is available before proceeding
    const customerId = window.fx_customerId;
    if (!customerId) {
        console.error('No customer ID found. Cannot initialize subscriptions fetching.');
        return;
    }

    // Fetch subscriptions for the customer
    fetchFoxyCartSubscriptions(customerId)
      .then(() => {
        console.log('Subscriptions successfully fetched and processed.');
      })
      .catch((error) => {
        console.error('Error during subscriptions fetching initialization:', error);
      });
}

// Attach the function to the global window object for external access
window.fetchFoxyCartSubscriptions = fetchFoxyCartSubscriptions;
window.subscriptionsInit = subscriptionsInit;
