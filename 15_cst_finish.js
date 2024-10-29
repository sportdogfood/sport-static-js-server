

// Add login, logout,
document.addEventListener('DOMContentLoaded', () => {
    attachButtonEventListeners();

    // Initial call to buttonMaster
    const initialStatus = localStorage.getItem('fx_customerId') ? 'logged in' : 'logged out';
    buttonMaster(initialStatus, 'initial load');
});



// Function to display
function displayAuthResult(message) {
    const resultElement = document.getElementById('authResult');
    if (resultElement) {
        resultElement.textContent = message;
        resultElement.style.display = 'block';
    }
}


    // Placeholder for fetchCustomerData
    async function fetchCustomerData(customerId) {
        console.log(`Fetching additional data for customer ID: ${customerId}`);
      
    }

