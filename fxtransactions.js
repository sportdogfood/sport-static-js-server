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
        console.log("Before updating userZoom, current userZoom:", window.userZoom);
        window.userZoom = window.userZoom || {};
        window.userZoom._embedded = window.userZoom._embedded || {};

        // Merge existing embedded data without overwriting and add transactions
        window.userZoom._embedded['fx:transactions'] = transactions.length > 0 ? transactions : [];

        console.log("After updating userZoom, current userZoom:", window.userZoom);
        console.log("fx:transactions set in userZoom._embedded:", window.userZoom._embedded['fx:transactions']);

        // Save updated userZoom to localStorage to persist changes
        localStorage.setItem('userZoom', JSON.stringify(window.userZoom));
        console.log("userZoom updated in localStorage.");

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

// Helper function to get friendly date and time
function getFriendlyDateTime() {
    const now = new Date();
    return now.toLocaleString();
}

// Ensure transactionsInit runs only when called explicitly by `fxcustomerzoom.js`
// Removed automatic triggering logic to ensure it does not run unless explicitly requested
