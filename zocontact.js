// Function to manually refresh and restart fetching CRM data
function manualRefreshCRM(fx_customerId) {
    console.log('Manual refresh triggered for CRM data.');
    fetchAndStoreCRMData(fx_customerId);
}

// Function to fetch and store Zoho CRM contact data
async function fetchAndStoreCRMData(fx_customerId) {
    if (!fx_customerId) {
        console.error("CRM Contact ID is not found, unable to proceed.");
        return;
    }

    try {
        const zohoUrl = `https://zohoapi-bdabc2b29c18.herokuapp.com/zoho/Contacts/search?criteria=${encodeURIComponent(`(Foxy_ID:equals:${fx_customerId})`)}`;
        console.log("Fetching CRM data from URL:", zohoUrl);

        const response = await fetch(zohoUrl, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch Zoho data: ${response.status} ${response.statusText}`);
        }

        const details = await response.json();
        if (details.data && details.data.length > 0) {
            const userContact = details.data[0];
            console.log("CRM data retrieved successfully:", userContact);

            // Save data in localStorage
            localStorage.setItem("userContact", JSON.stringify(userContact));
            updateUserSession({
                crm_First_Name: userContact.First_Name || 'Unknown',
                crm_Last_Name: userContact.Last_Name || 'Unknown',
                crm_Email: userContact.Email,
                lastUpdate: getFriendlyDateTime()
            });
        } else {
            console.log("No matching record found for CRM contact.");
        }
    } catch (error) {
        console.error("Error fetching CRM contact data:", error);
    }
}

// Function to update user session
function updateUserSession(data) {
    try {
        const userSession = JSON.parse(localStorage.getItem('userSession') || '{}');
        const updatedSession = { ...userSession, ...data };
        localStorage.setItem('userSession', JSON.stringify(updatedSession));
        console.log('User session updated:', updatedSession);
    } catch (error) {
        console.error("Error updating user session:", error);
    }
}

// Utility function to get friendly date and time format
function getFriendlyDateTime() {
    return new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
}

// Automatically trigger data polling after initial delay
setTimeout(() => {
    const fx_customerId = localStorage.getItem('fx_customerId'); // Fetch the customer ID from local storage
    if (fx_customerId) {
        fetchAndStoreCRMData(fx_customerId);
    } else {
        console.warn("fx_customerId is not available, unable to start CRM data fetching.");
    }
}, 20000); // Delay of 20 seconds

// Add a manual refresh button to trigger data fetching
function addManualRefreshButton() {
    const button = document.createElement('button');
    button.innerText = 'Refresh CRM Data';
    button.onclick = () => {
        const fx_customerId = localStorage.getItem('fx_customerId'); // Fetch the customer ID from local storage
        if (fx_customerId) {
            manualRefreshCRM(fx_customerId);
        } else {
            console.warn("fx_customerId is not available, unable to manually refresh CRM data.");
        }
    };
    document.body.appendChild(button);
}

// Call to add the refresh button
addManualRefreshButton();
