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

// Function to display authentication result
function displayAuthResult(message) {
    const resultElement = document.getElementById('authResult');
    if (resultElement) {
        resultElement.textContent = message;
        resultElement.style.display = 'block';
    } else {
        console.error('Authentication result element not found in the DOM.');
    }
}

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

document.addEventListener('authenticated', () => {
    const scriptsToLoad = [
        { src: 'https://sportdogfood.github.io/sport-static-js-server/fxcustomerzoom.js', id: 'fxcustomerzoom', initFunction: 'customerzoomInit' },
        { src: 'https://sportdogfood.github.io/sport-static-js-server/fxsubscriptions.js', id: 'fxsubscriptions', initFunction: 'subscriptionsInit' },
        { src: 'https://sportdogfood.github.io/sport-static-js-server/fxtransactions.js', id: 'fxtransactions', initFunction: 'transactionsInit' },
        { src: 'https://sportdogfood.github.io/sport-static-js-server/fxattributes.js', id: 'fxattributes', initFunction: 'attributesInit' }
    ];

    scriptsToLoad.forEach(scriptInfo => {
        if (!document.getElementById(scriptInfo.id)) {
            const scriptElement = document.createElement('script');
            scriptElement.src = scriptInfo.src;
            scriptElement.id = scriptInfo.id;

            scriptElement.onload = () => {
                console.log(`${scriptInfo.id}.js loaded successfully`);
                if (typeof window[scriptInfo.initFunction] === 'function') {
                    console.log(`Executing ${scriptInfo.initFunction} function.`);
                    window[scriptInfo.initFunction]();
                } else {
                    console.error(`${scriptInfo.initFunction} function not found in ${scriptInfo.id}.js.`);
                }
            };

            scriptElement.onerror = () => {
                console.error(`Failed to load ${scriptInfo.id}.js`);
            };

            document.body?.appendChild(scriptElement);
        } else {
            console.log(`${scriptInfo.id}.js is already loaded`);
            if (typeof window[scriptInfo.initFunction] === 'function') {
                console.log(`Re-executing ${scriptInfo.initFunction} since ${scriptInfo.id}.js is already loaded.`);
                window[scriptInfo.initFunction]();
            } else {
                console.warn(`${scriptInfo.initFunction} function not found even though the script is loaded.`);
            }
        }
    });
});