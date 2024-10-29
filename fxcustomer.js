// Function to get the FoxyCart customer ID from local storage
function getFoxyCustomerId() {
    try {
        const localFxCustomerId = localStorage.getItem('fx_customerId');
        if (localFxCustomerId) return localFxCustomerId;
    } catch (error) {
        console.error("Error while retrieving fx_customerId:", error);
    }
    return null;
}

// Fetch FoxyCart customer data
async function fetchFoxyCustomerData() {
    const customerId = getFoxyCustomerId();
    if (!customerId) {
        console.error("No customer ID found in local storage.");
        return;
    }

    const apiUrl = `https://sportcorsproxy.herokuapp.com/foxycart/customers/${encodeURIComponent(customerId)}`;
    console.log("Fetching FoxyCart customer data from URL:", apiUrl);

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
        }

        const details = await response.json();
        console.log("FoxyCart data received:", details);

        if (!details) {
            console.error("Details are empty or undefined");
            return;
        }

        const { _embedded, _links, ...filteredDetails } = details;
        if (Object.keys(filteredDetails).length === 0) {
            console.error("Filtered details object is empty after removing _embedded and _links.");
            return;
        }

        localStorage.setItem("userCustomer", JSON.stringify(filteredDetails));
        console.log("Filtered FoxyCart data stored in localStorage under 'userCustomer'");

        updateUserSession(filteredDetails);

    } catch (error) {
        console.error("Error fetching data from FoxyCart API:", error);
    }
}

// Function to update the session state
function updateUserSession(data) {
    try {
        console.log("Updating session state with data:", data);

        const userSession = JSON.parse(localStorage.getItem('userSession') || '{}');
        const updatedSession = { ...userSession, ...data };

        localStorage.setItem('userSession', JSON.stringify(updatedSession));
        console.log('Updated session state:', updatedSession);
    } catch (error) {
        console.error('Error updating session state:', error);
    }
}

// Trigger data fetch from a button
function addRefreshFoxyCustomerButton() {
    const button = document.createElement('button');
    button.innerText = 'Refresh FoxyCart Data';
    button.onclick = fetchFoxyCustomerData;
    document.body.appendChild(button);
}

// Adding button for manual data refresh
addRefreshFoxyCustomerButton();
