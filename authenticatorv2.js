// Authentication and session management
async function authenticateCustomer() {
    const email = document.getElementById('em')?.value;
    const password = document.getElementById('passwordInput')?.value;

    if (!email || !password) {
        const resultElement = document.getElementById('authResult');
        if (resultElement) {
            resultElement.textContent = "Please provide both email and password.";
            resultElement.style.display = 'block';
        }
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

        const responseData = await response.json();

        if (responseData.session_token && responseData.fc_customer_id) {
            document.dispatchEvent(new Event('authenticated'));
            window.fx_customerId_global = responseData.fc_customer_id;

            // Store customer data
            window.thisUser.customerData = responseData;
            window.thisUser.customerEmail = email;

            // Direct DOM update for success message
            const resultElement = document.getElementById('authResult');
            if (resultElement) {
                resultElement.textContent = "Authentication successful! Welcome.";
                resultElement.style.display = 'block';
            }

            // Set fx_customerEmail and fx_customerId in localStorage
            localStorage.setItem("fx_customerEmail", email);
            localStorage.setItem("fx_customerId", responseData.fc_customer_id);

            // Set cookies for authenticated user
            document.cookie = `fx_customer=${responseData.fc_auth_token}; path=/;`;
            document.cookie = `fx_customerId=${responseData.fc_customer_id}; path=/;`;
            document.cookie = `fx_customer_em=${email}; path=/;`;
            document.cookie = `fx_customer_jwt=${responseData.jwt}; path=/;`;
            document.cookie = `fx_customer_sso=${responseData.sso}; path=/;`;
            const sportpin = Math.floor(1000 + Math.random() * 9000);
            const timestamp = Date.now();
            const sporturl = `https://www.sportdogfood.com/login&em=${email}&cid=${responseData.fc_customer_id}&pn=${sportpin}&ts=${timestamp}`;
            document.cookie = `sporturl=${encodeURIComponent(sporturl)}; path=/; max-age=${60 * 60 * 24 * 180}`;

            // Update user state and session
            initializeAndRun('authenticateCustomer');

            // Fetch additional customer data
            await fetchCustomerData(responseData.fc_customer_id);

            // Start timer to automatically load transactions and subscriptions if not triggered manually
            // startLazyLoadTimer();
        } else {
            // Direct DOM update for failure message
            const resultElement = document.getElementById('authResult');
            if (resultElement) {
                resultElement.textContent = "Authentication failed: Missing session_token or customer ID.";
                resultElement.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Error during customer authentication:', error);
        
        // Direct DOM update for error message
        const resultElement = document.getElementById('authResult');
        if (resultElement) {
            resultElement.textContent = `Error: ${error.message}`;
            resultElement.style.display = 'block';
        }
    }
}