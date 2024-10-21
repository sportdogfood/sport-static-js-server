// Counter to track retries for CRM fetch 
let retryCountCRM = 0;
const maxRetries = 4; // Maximum number of retries for fetching CRM data
let pollingCount = 0;
const maxPollingAttempts = 4; // Maximum number of polling attempts for CRM data

// Helper function to get the desired value from the variable chain
const getCRMValueFromChain = () => {
    try {
        const localContactId = localStorage.getItem('fx_customerId');
        const thisUserContact = JSON.parse(localStorage.getItem('thisUserContact') || 'null');
        const thisUser = JSON.parse(localStorage.getItem('thisUser') || 'null');

        if (localContactId) {
            console.log("Retrieved CRM ID from fx_customerId:", localContactId);
            return localContactId;
        }
        if (thisUserContact && thisUserContact.id) {
            console.log("Retrieved CRM ID from thisUserContact.id:", thisUserContact.id);
            return thisUserContact.id;
        }
        if (thisUser && thisUser.fx_customerId) {
            console.log("Retrieved CRM ID from thisUser.fx_customerId:", thisUser.fx_customerId);
            return thisUser.fx_customerId;
        }
    } catch (error) {
        console.error("Error while getting CRM value from chain:", error);
    }

    return null; // Return null if no ID is found
};

// Function to manually refresh and restart the fetching process
export function manualRefreshCRM() {
    console.log('Manual refresh triggered for CRM data.');
    retryCountCRM = 0;
    pollingCount = 0;
    poll(); // Start polling immediately on manual refresh
}

// Function to check and poll Zoho CRM contact data
export async function checkAndPollCRMContact() {
    // Start the polling process after a delay of 45 seconds
    setTimeout(poll, 45000);
}

// Poll for CRM data with retry mechanism
async function poll() {
    if (retryCountCRM >= maxRetries) {
        console.log("Retry limit reached for CRM contact, aborting.");
        return;
    }

    let crmContactId = getCRMValueFromChain();
    if (!crmContactId) {
        retryCountCRM++;
        if (retryCountCRM < maxRetries) {
            console.log(`CRM contact ID not found, retrying in 5 seconds (Attempt ${retryCountCRM}/${maxRetries})`);
            setTimeout(poll, 5000); // Retry after 5 seconds if not found
        } else {
            console.error("CRM Contact ID still missing after retries. Aborting.");
        }
        return;
    }

    if (pollingCount < maxPollingAttempts) {
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
                } else {
                    console.log("Failed to store Zoho contact data.");
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

// Function to update the session state with provided data
function updateThisUserSession(data) {
    try {
        // Retrieve existing session or initialize it if it doesn't exist
        const thisUserSession = JSON.parse(localStorage.getItem('thisUserSession') || '{}');

        // Merge new data with the existing session state
        const updatedSession = { ...thisUserSession, ...data };

        // Store the updated session in localStorage
        localStorage.setItem('thisUserSession', JSON.stringify(updatedSession));
        
        console.log('Updated session state:', updatedSession);
    } catch (error) {
        console.error('Error updating session state:', error);
    }
}

// Utility function to get the current date and time in a friendly US/EDT format
function formatFriendlyDateUS(dateString) {
    const options = { 
        timeZone: 'America/New_York', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: 'numeric', 
        minute: 'numeric', 
        second: 'numeric' 
    };
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', options).format(date);
}

// Utility function to get the current date and time in a friendly format for last update
function getFriendlyDateTime() {
    const now = new Date();
    return now.toLocaleString(); // Adjust this to your preferred format
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
        console.log("Zoho API response details:", details);

        if (details.data && details.data.length > 0) {
            console.log(`Found ${details.data.length} record(s) in Zoho CRM response.`);

            const thisUserContact = details.data[0];
            console.log("Zoho contact data retrieved successfully:", thisUserContact);

            // Map all required fields with the 'crm_' prefix
            const sessionData = {
                crm_Approved_Military: thisUserContact?.Approved_Military,
                crm_Breed_1_name: thisUserContact?.['Breed_1.name'],
                crm_Dashboard_Id_id: thisUserContact?.['Dashboard_Id.id'],
                crm_Email: thisUserContact?.Email,
                crm_Desk_ID: thisUserContact?.Desk_ID,
                crm_First_Name: thisUserContact?.First_Name || 'Unknown',
                crm_Foxy_ID: thisUserContact?.Foxy_ID || 'Unknown',
                crm_Full_Name: thisUserContact?.Full_Name,
                crm_Last_Name: thisUserContact?.Last_Name,
                
                // Convert Last_Visited_Time and Last_Activity_Time to a friendly format
                crm_Last_Visited_Time: formatFriendlyDateUS(thisUserContact?.Last_Visited_Time),
                crm_Last_Activity_Time: formatFriendlyDateUS(thisUserContact?.Last_Activity_Time),
                
                crm_Lifetime_Spend: thisUserContact?.Lifetime_Spend,
                crm_Loyalty_Coupon: thisUserContact?.Loyalty_Coupon,
                crm_Loyalty_Level: thisUserContact?.Loyalty_Level,
                crm_Loyalty_Points: thisUserContact?.Loyalty_Points,
                crm_Mailing_State: thisUserContact?.Mailing_State,
                crm_Mailing_Zip: thisUserContact?.Mailing_Zip,
                crm_Member_Since: formatFriendlyDateUS(thisUserContact?.Member_Since), // Convert Member_Since to friendly date
                crm_Saved_Shipping_id: thisUserContact?.['Saved_Shipping.id'],
                crm_Shipping_State: thisUserContact?.Shipping_State,
                crm_State_is: thisUserContact?.State_is,
                crm_Thrive_id: thisUserContact?.['Thrive.id'],
                crm_UGC_id: thisUserContact?.['UGC.id'],
                crm_desk_cf_foxy_id: thisUserContact?.desk_cf_foxy_id,
                crm_id: thisUserContact?.id,
                lastupdate: getFriendlyDateTime() // Current date and time
            };

            // Update session state with the customer data
            updateThisUserSession(sessionData);

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
