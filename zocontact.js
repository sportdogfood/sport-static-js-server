// Counter to track retries for CRM fetch
let retryCountCRM = 0;
const maxRetries = 4; // Maximum number of retries
let pollingCount = 0;
const maxPollingAttempts = 4; // Maximum number of polling attempts

// Function to manually refresh and restart the fetching process
export function manualRefreshCRM() {
    console.log('Manual refresh triggered for CRM data.');
    retryCountCRM = 0;
    pollingCount = 0;
    checkAndPollCRMContact();
}

// Function to check and poll Zoho CRM contact data
export async function checkAndPollCRMContact() {
    // Helper function to get the desired value from the variable chain
    const getCRMValueFromChain = () => {
        const localContactId = localStorage.getItem('crm_contactId');
        const thisUserContact = localStorage.getItem('thisUserContact');
        const thisUser = localStorage.getItem('thisUser');

        if (localContactId) return localContactId;
        if (thisUserContact && JSON.parse(thisUserContact).Contact_ID) return JSON.parse(thisUserContact).Contact_ID;
        if (thisUser && JSON.parse(thisUser).crm_contactId) return JSON.parse(thisUser).crm_contactId;

        return null; // Return null if no ID is found
    };

    // Poll for CRM data with retry mechanism
    async function poll() {
        if (retryCountCRM >= maxRetries) {
            console.log("Retry limit reached for CRM contact, aborting.");
            return;
        }

        let crmContactId = getCRMValueFromChain();

        if (!crmContactId && retryCountCRM < maxRetries) {
            retryCountCRM++;
            console.log(`CRM contact ID not found, retrying in 5 seconds (Attempt ${retryCountCRM}/${maxRetries})`);
            setTimeout(poll, 5000); // Retry after 5 seconds if not found
            return;
        }

        if (crmContactId && pollingCount < maxPollingAttempts) {
            pollingCount++;
            console.log(`Polling start - Cycle #${pollingCount} for CRM contact data.`);

            try {
                const existingData = localStorage.getItem('thisUserContact');
                if (!existingData) {
                    // Fetch Zoho Contact Data and store it in localStorage
                    const responseData = await fetchZohoContact(crmContactId);
                    if (responseData) {
                        localStorage.setItem("thisUserContact", JSON.stringify(responseData));
                        console.log("Zoho contact data stored in localStorage under 'thisUserContact'.");
                    }
                } else {
                    console.log('CRM contact data already exists in localStorage.');
                }

                // If data is still not found, retry
                if (!existingData && pollingCount < maxPollingAttempts) {
                    setTimeout(poll, 5000); // Retry after 5 seconds
                }

            } catch (error) {
                console.error(`Error during CRM polling attempt ${pollingCount}:`, error);
                if (pollingCount < maxPollingAttempts) {
                    setTimeout(poll, 5000); // Retry after 5 seconds if an error occurs
                }
            }
        } else if (pollingCount >= maxPollingAttempts) {
            console.log('Maximum polling attempts reached for CRM data.');
        }
    }

    // Start the polling process after an initial delay of 45 seconds
    setTimeout(poll, 45000);
}

// Function for fetching Zoho contact data
async function fetchZohoContact(fx_customerId) {
    const zohoUrl = `https://zohoapi-bdabc2b29c18.herokuapp.com/zoho/Contacts/search?criteria=(Foxy_ID:equals:${fx_customerId})`;
    console.log("Zoho URL:", zohoUrl);

    try {
        const zohoResponse = await fetch(zohoUrl);
        if (!zohoResponse.ok) {
            throw new Error(`Failed to fetch Zoho data: ${zohoResponse.status} ${zohoResponse.statusText}`);
        }

        const details = await zohoResponse.json();
        if (details.data && details.data.length > 0) {
            const thisUserContact = details.data[0];
            console.log("Zoho contact data retrieved successfully.");
            return thisUserContact; // Return the fetched contact details
        } else {
            console.log(`No matching record found for Foxy_ID: ${fx_customerId} in Contacts`);
            return null; // No data found
        }
    } catch (error) {
        console.error("Error fetching data from Zoho API:", error);
        return null; // Return null in case of error
    }
}

// Automatically call `checkAndPollCRMContact` after an initial delay
setTimeout(() => {
    checkAndPollCRMContact();
}, 20000); // Delay of 20 seconds

// Add a manual refresh button to the page if needed
export function addManualRefreshButton() {
    const refreshButtonCRM = document.createElement('button');
    refreshButtonCRM.innerText = 'Refresh CRM Data';
    refreshButtonCRM.onclick = manualRefreshCRM;
    document.body.appendChild(refreshButtonCRM);
}

// Call to add the refresh button
addManualRefreshButton();
