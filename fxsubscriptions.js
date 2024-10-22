// Fetch FoxyCart Subscriptions function
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

        // Properly update fx:subscriptions in _embedded
        updateEmbeddedData('fx:subscriptions', subscriptions);

        // Update session state
        updateThisUserSession({ subscriptionsFetched: true, lastupdate: getFriendlyDateTime() });
        updateThisUserSession({ subscriptions_totalItems: totalItems, lastupdate: getFriendlyDateTime() });

        return { total_items: totalItems, subscriptions: subscriptions };

    } catch (error) {
        console.error("Failed to fetch data from FoxyCart API: ", error);
        return { total_items: 0, subscriptions: [] };
    }
}
