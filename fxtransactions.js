console.log('fxtransactions.js is executing properly.');

// Define the function to fetch FoxyCart transactions
async function fetchFoxyCartTransactions(customerId) {
    if (!customerId) {
        console.error("Customer ID is missing or invalid.");
        return { total_items: 0, transactions: [] };
    }

    const proxyUrl = `https://sportcorsproxy.herokuapp.com/foxycart/transactions?customer_id=${customerId}`;

    try {
        const response = await fetch(proxyUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (response.status === 404) {
            console.log("No transactions found for this customer (404 response).");
            return { total_items: 0, transactions: [] };
        }

        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Response data:", data);

        const totalItems = data.total_items || 0;
        const transactions = data.transactions || [];

        if (transactions.length === 0) {
            console.log("No transactions found in response data.");
        }

        // Ensure userZoom and _embedded exist, then add fx:transactions
        window.userZoom = window.userZoom || {};
        window.userZoom._embedded = window.userZoom._embedded || {};
        window.userZoom._embedded['fx:transactions'] = transactions.length > 0 ? transactions : [];

        // Update session state using the global function
        if (typeof window.updateUserSession === 'function') {
            window.updateUserSession({ transactionsFetched: true, lastupdate: getFriendlyDateTime() });
            window.updateUserSession({ transactions_totalItems: totalItems, lastupdate: getFriendlyDateTime() });
        } else {
            console.error("updateUserSession function not found in global scope.");
        }

        return { total_items: totalItems, transactions: transactions };

    } catch (error) {
        console.error("Failed to fetch data from FoxyCart API: ", error);
        return { total_items: 0, transactions: [] };
    }
}

// Define the main initialization function for transactions
function transactionsInit() {
    try {
        // Only proceed if userZoom and fx_customerId are available
        if (!window.userZoom || !window.fx_customerId) {
            console.warn('UserZoom or fx_customerId not available. transactionsInit will not run.');
            return;
        }

        console.log('fxtransactions.js initialization function is called.');

        // Fetch transactions for the customer
        const customerId = window.fx_customerId;
        fetchFoxyCartTransactions(customerId)
            .then(() => {
                console.log('Transactions successfully fetched and processed.');
            })
            .catch((error) => {
                console.error('Error during transactions fetching initialization:', error);
            });
    } catch (error) {
        console.error('An error occurred in transactionsInit:', error);
    }
}

// Attach the function to the global window object for external access
window.fetchFoxyCartTransactions = fetchFoxyCartTransactions;
window.transactionsInit = transactionsInit;

// Helper function to get friendly date and time (assuming it was defined somewhere)
function getFriendlyDateTime() {
    const now = new Date();
    return now.toLocaleString();
}

// Ensure transactionsInit runs only if userZoom and fx_customerId are guaranteed to be available or called explicitly
document.addEventListener('DOMContentLoaded', () => {
    const checkInterval = setInterval(() => {
        if (window.userZoom && window.fx_customerId) {
            console.log('UserZoom and fx_customerId are available. Attempting to initialize transactions.');
            window.transactionsInit();
            clearInterval(checkInterval);
        } else {
            console.warn('Waiting for UserZoom and fx_customerId to be available. transactionsInit will not run automatically until they are both set.');
        }
    }, 5000); // Check every 5 seconds
});
