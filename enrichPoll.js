
// Client-side script to poll until the data is enriched and marked as the random word
function enrichMePoll(fx_customer_Id) {
    console.log('Starting to poll for enriched data with provided fx_customer_Id.');

    // Retrieve fx_customer_Id from localStorage
    if (!fx_customer_Id) {
        console.error('fx_customer_Id is required but not provided. No polling action taken.');
        return;
    }
    let foxyId = fx_customer_Id;

    // Check if fx_customer_Id is available
    if (!foxyId) {
        console.error('fx_customer_Id not found in localStorage. No polling action taken.');
        return;
    }

    // Define the endpoint URL for polling
    const pollingUrl = `https://zohoapi-bdabc2b29c18.herokuapp.com/zoho/contacts/search?criteria=Foxy_ID:equals:${foxyId}`;
    const pollInterval = 5000; // Poll every 5 seconds

    // Polling function to check if the enriched data is ready
    function pollForEnrichedData() {
        console.log('Polling for enriched data...');

        // Send GET request to the polling URL
        fetch(pollingUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Network response was not ok (${response.status})`);
                }
                return response.json();
            })
            .then(data => {
                // Check if the enrichment status is the random word
                if (data && data.length > 0 && data[0].enrich) {
                    console.log('Enriched data is ready:', data);
                    // Store enriched data in localStorage
                    localStorage.setItem('userEnrich', JSON.stringify(data[0]));
                    // Perform further actions with the enriched data here
                    return; // Stop polling
                    console.log('Enriched data is ready:', data);
                    // Perform further actions with the enriched data here
                } else {
                    // If not ready, keep polling
                    console.log('Enriched data not ready, continuing polling...');
                    setTimeout(pollForEnrichedData, pollInterval);
                }
            })
            .catch(error => {
                console.error('Error during polling:', error);
                // Keep polling in case of an error
                setTimeout(pollForEnrichedData, pollInterval);
            });
    }

    // Start polling
    enrichMePoll(fx_customer_Id);
};
