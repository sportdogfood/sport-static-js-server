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

        // Properly update fx:transactions in _embedded using the global function
        if (typeof window.updateEmbeddedData === 'function') {
            window.updateEmbeddedData('fx:transactions', transactions);
        } else {
            console.error("updateEmbeddedData function not found in global scope.");
        }

        // Update session state using the global function
        if (typeof window.updateThisUserSession === 'function') {
            window.updateThisUserSession({ transactionsFetched: true, lastupdate: getFriendlyDateTime() });
            window.updateThisUserSession({ transactions_totalItems: totalItems, lastupdate: getFriendlyDateTime() });
        } else {
            console.error("updateThisUserSession function not found in global scope.");
        }

        return { total_items: totalItems, transactions: transactions };

    } catch (error) {
        console.error("Failed to fetch data from FoxyCart API: ", error);
        return { total_items: 0, transactions: [] };
    }
}

// Define the main initialization function for transactions
function transactionsInit() {
    console.log('fxtransactions.js initialization function is called.');

    // Ensure that the customer ID is available before proceeding
    const customerId = window.fx_customerId;
    if (!customerId) {
        console.error('No customer ID found. Cannot initialize transactions fetching.');
        return;
    }

    // Fetch transactions for the customer
    fetchFoxyCartTransactions(customerId)
        .then(() => {
            console.log('Transactions successfully fetched and processed.');
        })
        .catch((error) => {
            console.error('Error during transactions fetching initialization:', error);
        });
}

// Attach the function to the global window object for external access
window.fetchFoxyCartTransactions = fetchFoxyCartTransactions;
window.transactionsInit = transactionsInit;
