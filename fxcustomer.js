// Fetch FoxyCart customer data
async function fetchFoxyCustomerData(customerId) {
    if (!customerId) {
        console.error("No customer ID provided.");
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

        // Store the filtered details in localStorage
        localStorage.setItem("userCustomer", JSON.stringify(filteredDetails));
        console.log("Filtered FoxyCart data stored in localStorage under 'userCustomer'");

        // Update the session with the filtered details
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

        // Store the updated session in localStorage
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
    button.onclick = () => {
        // Fetch fx_customerId from localStorage
        const customerId = localStorage.getItem('fx_customerId');
        if (customerId) {
            fetchFoxyCustomerData(customerId);
        } else {
            console.error("Cannot refresh: fx_customerId not found in localStorage");
        }
    };
    document.body.appendChild(button);
}

// Adding button for manual data refresh
addRefreshFoxyCustomerButton();

// Function to initialize FoxyCart customer data
function fxCustomerInit(customerId) {
    console.log("Initializing FoxyCart data for customer:", customerId);
    fetchFoxyCustomerData(customerId);
}

// Public API (if needed)
window.fxCustomerInit = fxCustomerInit;
