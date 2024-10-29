/* =========== start_11_sessionAuthHandle =========== */
// Function to authenticate customer
async function authenticateCustomer() {
    const email = document.getElementById('em')?.value;
    const password = document.getElementById('passwordInput')?.value;

    if (!email || !password) {
        displayAuthResult("Please provide both email and password.");
        return;
    }

    const apiUrl = 'https://sportcorsproxy.herokuapp.com/foxycart/customer/authenticate';
    const payload = { email, password };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Network response was not ok (${response.status})`);
        }

        const responseData = await response.json();

        if (responseData.session_token && responseData.fc_customer_id) {
            handleSuccessfulAuthentication(responseData, email);
        } else {
            displayAuthResult("Authentication failed: Missing session_token or customer ID.");
        }
    } catch (error) {
        console.error('Error during customer authentication:', error);
        displayAuthResult(`Error: ${error.message}`);
    }
}
/* =========== end_11_sessionAuthHandle =========== */