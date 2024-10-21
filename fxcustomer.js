// Counter to track retries for FoxyCart fetch
let retryCountFoxy = 0;
const maxRetries = 4; // Maximum number of retries for fetching data
let pollingCountFoxy = 0;
const maxPollingAttemptsFoxy = 4; // Maximum number of polling attempts

// Function to manually refresh and restart the fetching process
export function manualRefreshFoxy() {
    console.log('Manual refresh triggered for FoxyCart data.');
    retryCountFoxy = 0;
    pollingCountFoxy = 0;
    checkAndPollFoxyCustomer();
}

// Function to check and poll FoxyCart customer data
export async function checkAndPollFoxyCustomer() {
    // Helper function to get the desired value from the variable chain
    const getValueFromChain = () => {
        try {
            const localFxCustomerId = localStorage.getItem('fx_customerId');
            const thisUser = JSON.parse(localStorage.getItem('thisUser') || 'null');
            const thisUserContact = JSON.parse(localStorage.getItem('thisUserContact') || 'null');

            if (localFxCustomerId) return localFxCustomerId;
            if (thisUser && thisUser.fx_customerId) return thisUser.fx_customerId;
            if (thisUserContact && thisUserContact.Foxy_ID) return thisUserContact.Foxy_ID;

        } catch (error) {
            console.error("Error while getting value from chain:", error);
        }

        return null; // Return null if none of the values are found
    };

    // Poll for FoxyCart data with retry mechanism
    async function poll() {
        if (retryCountFoxy >= maxRetries) {
            console.log("Retry limit reached for FoxyCart customer, aborting.");
            return;
        }

        let fxCustomerId = getValueFromChain();

        if (!fxCustomerId && retryCountFoxy < maxRetries) {
            retryCountFoxy++;
            console.log(`FoxyCart customer ID not found, retrying in 5 seconds (Attempt ${retryCountFoxy}/${maxRetries})`);
            setTimeout(poll, 5000); // Retry after 5 seconds if not found
            return;
        }

        if (fxCustomerId && pollingCountFoxy < maxPollingAttemptsFoxy) {
            pollingCountFoxy++;
            console.log(`Polling start - Cycle #${pollingCountFoxy} for FoxyCart customer data.`);

            try {
                const existingData = localStorage.getItem('thisUserCustomer');
                if (!existingData) {
                    // Fetch FoxyCart Customer Data and store it in localStorage
                    await fetchFxCustomer(fxCustomerId);
                } else {
                    console.log('FoxyCart customer data already exists in localStorage.');
                }

                // If data is still not found, retry
                if (!existingData && pollingCountFoxy < maxPollingAttemptsFoxy) {
                    setTimeout(poll, 5000); // Retry after 5 seconds
                }

            } catch (error) {
                console.error(`Error during FoxyCart polling attempt ${pollingCountFoxy}:`, error);
                if (pollingCountFoxy < maxPollingAttemptsFoxy) {
                    setTimeout(poll, 5000); // Retry after 5 seconds if an error occurs
                }
            }
        } else if (pollingCountFoxy >= maxPollingAttemptsFoxy) {
            console.log('Maximum polling attempts reached for FoxyCart data.');
        }
    }

    // Start the polling process after an initial delay of 45 seconds
    setTimeout(poll, 45000);
}

// Fetch function for FoxyCart customer data
export async function fetchFxCustomer(customerId) {
    const zoomParams = 'attributes,default_billing_address,default_shipping_address,default_payment_method';
    const apiUrl = `https://sportcorsproxy.herokuapp.com/foxycart/customers/${encodeURIComponent(customerId)}?zoom=${encodeURIComponent(zoomParams)}`;
    console.log("Fetching FxCustomer URL:", apiUrl);

    try {
        const fxResponse = await fetch(apiUrl);
        if (!fxResponse.ok) {
            throw new Error(`Failed to fetch FxCustomer data: ${fxResponse.status} ${fxResponse.statusText}`);
        }

        const details = await fxResponse.json();
        if (details._embedded && details._embedded['fx:customer']) {
            const thisUserCustomer = details._embedded['fx:customer'];
            localStorage.setItem("thisUserCustomer", JSON.stringify(thisUserCustomer));
            console.log("FxCustomer data stored in localStorage under 'thisUserCustomer'");
        } else {
            console.log(`No matching record found for customerId: ${customerId} in FxCustomer`);
        }
    } catch (error) {
        console.error("Error fetching data from FxCustomer API:", error);
    }
}

// Automatically call `checkAndPollFoxyCustomer` after an initial delay
setTimeout(() => {
    checkAndPollFoxyCustomer();
}, 20000); // Delay of 20 seconds

// Add a manual refresh button to the page if needed
export function addManualRefreshButton() {
    const refreshButtonFoxy = document.createElement('button');
    refreshButtonFoxy.innerText = 'Refresh FoxyCart Data';
    refreshButtonFoxy.onclick = manualRefreshFoxy;
    document.body.appendChild(refreshButtonFoxy);
}

// Call to add the refresh button
addManualRefreshButton();
