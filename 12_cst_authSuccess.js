/* =========== start_12_authsuccess =========== */
// Function to handle successful authentication
function handleSuccessfulAuthentication(responseData, email) {
    document.dispatchEvent(new Event('authenticated'));
    window.fx_customerId = responseData.fc_customer_id;

    window.userCustomerData = responseData;
    window.userCustomerEmail = email;

    displayAuthResult("Authentication successful! Welcome.");

    localStorage.setItem("fx_customerEmail", email);
    localStorage.setItem("fx_customerId", responseData.fc_customer_id);

    document.cookie = `fx_customer=${responseData.fc_auth_token}; path=/; Secure; SameSite=Strict`;
    document.cookie = `fx_customerId=${responseData.fc_customer_id}; path=/; Secure; SameSite=Strict`;
    document.cookie = `fx_customer_em=${encodeURIComponent(email)}; path=/; Secure; SameSite=Strict`;
    document.cookie = `fx_customer_jwt=${responseData.jwt}; path=/; Secure; SameSite=Strict`;
    document.cookie = `fx_customer_sso=${responseData.sso}; path=/; Secure; SameSite=Strict`;

    const sportpin = Math.floor(1000 + Math.random() * 9000);
    const timestamp = Date.now();
    const sporturl = `https://www.sportdogfood.com/login&em=${encodeURIComponent(email)}&cid=${responseData.fc_customer_id}&pn=${sportpin}&ts=${timestamp}`;
    document.cookie = `sporturl=${encodeURIComponent(sporturl)}; path=/; max-age=${60 * 60 * 24 * 180}; Secure; SameSite=Strict`;

    fetchCustomerData(responseData.fc_customer_id);
    debouncedPushPagesense('login-success', responseData.fc_customer_id);

    // Load PageSense 
    loadPageSenseScript();
}

/* =========== end_12_authsuccess =========== */