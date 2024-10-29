/* =========== start_12_authsuccess =========== */
// Function to handle successful authentication
function handleSuccessfulAuthentication(responseData, email) {
    document.dispatchEvent(new Event('authenticated'));
    window.fx_customerId = responseData.fc_customer_id;

    window.userCustomerData = responseData;
    window.userCustomerEmail = email;

    displayAuthResult("Authentication successful! Welcome.");

    // Store customer data in localStorage for session persistence
    localStorage.setItem("fx_customerEmail", email);
    localStorage.setItem("fx_customerId", responseData.fc_customer_id);

    // Set cookies for secure customer identification
    const cookieAttributes = "path=/; Secure; SameSite=Strict";
    document.cookie = `fx_customer=${responseData.fc_auth_token}; ${cookieAttributes}`;
    document.cookie = `fx_customerId=${responseData.fc_customer_id}; ${cookieAttributes}`;
    document.cookie = `fx_customer_em=${encodeURIComponent(email)}; ${cookieAttributes}`;
    document.cookie = `fx_customer_jwt=${responseData.jwt}; ${cookieAttributes}`;
    document.cookie = `fx_customer_sso=${responseData.sso}; ${cookieAttributes}`;

    // Set sporturl cookie with additional metadata for customer session
    const sportpin = Math.floor(1000 + Math.random() * 9000);
    const timestamp = Date.now();
    const sporturl = `https://www.sportdogfood.com/login&em=${encodeURIComponent(email)}&cid=${responseData.fc_customer_id}&pn=${sportpin}&ts=${timestamp}`;
    document.cookie = `sporturl=${encodeURIComponent(sporturl)}; path=/; max-age=${60 * 60 * 24 * 180}; Secure; SameSite=Strict`;

    // Fetch additional customer data and track login success
    fetchCustomerData(responseData.fc_customer_id);
    debouncedPushPagesense('login-success', responseData.fc_customer_id);

    // Load PageSense tracking script dynamically after successful login
    loadPageSenseScript();
}

// Placeholder function to fetch customer data
async function fetchCustomerData(customerId) {
    console.log(`Fetching additional data for customer ID: ${customerId}`);
}
/* =========== end_12_authsuccess =========== */
