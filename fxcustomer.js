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
    poll(); // Directly call poll to bypass delay
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
    const apiUrl = `https://sportcorsproxy.herokuapp.com/foxycart/customers/${encodeURIComponent(customerId)}`;
    console.log("Fetching FxCustomer URL:", apiUrl);

    try {
        const fxResponse = await fetch(apiUrl);
        if (!fxResponse.ok) {
            throw new Error(`Failed to fetch FxCustomer data: ${fxResponse.status} ${fxResponse.statusText}`);
        }

        const details = await fxResponse.json();
        console.log("Raw response data:", details);

        // If no details are found, log and return
        if (!details) {
            console.error("Details are empty or undefined");
            return;
        }

        // Remove _embedded and _links from the details object
        const { _embedded, _links, ...filteredDetails } = details;

        // If the filteredDetails object is empty, log the error and stop further actions
        if (Object.keys(filteredDetails).length === 0) {
            console.error("Filtered details object is empty after removing _embedded and _links. Aborting save.");
            return;
        }

        // Store the filtered response in localStorage
        localStorage.setItem("thisUserCustomer", JSON.stringify(filteredDetails));
        console.log("Filtered FxCustomer data stored in localStorage under 'thisUserCustomer'");

        // Extract the necessary fields from filteredDetails
        const { first_name, last_name, email } = filteredDetails;
        console.log("Customer name being used to update session:", first_name); // Add a log here
        
        // Update session state with the customer data
        updateThisUserSession({ first_name, last_name, email, lastupdate: getFriendlyDateTime() });

    } catch (error) {
        console.error("Error fetching data from FxCustomer API:", error);
    }
}

// Function to update the session state with provided data
function updateThisUserSession(data) {
    try {
        console.log("Data passed to updateThisUserSession:", data); // Log the incoming data

        // Retrieve existing session or initialize it if it doesn't exist
        const thisUserSession = JSON.parse(localStorage.getItem('thisUserSession') || '{}');

        // Merge new data with the existing session state
        const updatedSession = { ...thisUserSession, ...data };

        // Store the updated session in localStorage
        localStorage.setItem('thisUserSession', JSON.stringify(updatedSession));
        
        console.log('Updated session state:', updatedSession); // Log the updated session
    } catch (error) {
        console.error('Error updating session state:', error);
    }
}

// Utility function to get the current date and time in a friendly format
function getFriendlyDateTime() {
    const now = new Date();
    return now.toLocaleString(); // Adjust this to your preferred format
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
