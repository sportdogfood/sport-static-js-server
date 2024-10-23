// Fetch customer data function 
async function fetchCustomerData(customerId) {
    const zoomParams = 'attributes,default_billing_address,default_shipping_address,default_payment_method'; 
    const apiUrl = `https://sportcorsproxy.herokuapp.com/foxycart/customers/${encodeURIComponent(customerId)}?zoom=${encodeURIComponent(zoomParams)}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.status} - ${response.statusText}`);
        }

        const responseData = await response.json();

        if (responseData) {
            console.log('Customer data:', responseData);

            // Store customer data in localStorage
            localStorage.setItem("thisUserZoom", JSON.stringify(responseData));
            updateUserState('Zoom', 'available');

            // Safely call initializeAndUpdate if it exists
            if (typeof window.initializeAndUpdate === 'function') {
                window.initializeAndUpdate();
            }

            // Extract first_name from responseData if available
            const first_name = responseData?.first_name || 'Unknown';

            // Update session state with customer data
            updateThisUserSession({ first_name: first_name, lastupdate: getFriendlyDateTime() });

            // Check if fx:attributes exists in responseData._embedded


            if (responseData?._embedded?.['fx:attributes']) {
                console.log('fx:attributes found, calling userAttributes function');
              await userAttributes();

                // Call pushPagesense with customerId
                pushPagesense(customerId);
            } else {
                console.log('fx:attributes not found in response data');
            }
        } else {
            console.error('No customer data received');
        }
    } catch (error) {
        console.error('Error fetching customer data:', error);
        throw error; // Ensure the error is caught and retry logic can be applied
    }
}
