// Standalone script to send a payload only when called with fx_customer_Id
enrichMe = function(fx_customer_Id) {
    console.log('Window loaded, checking for fx_customer_Id in localStorage.');

    // Retrieve fx_customer_Id from localStorage
    if (!fx_customer_Id) {
        console.error('fx_customer_Id is required but not provided. No action taken.');
        return;
    }

    // Check if fx_customer_Id is available
    if (!fx_customer_Id) {
        console.error('fx_customer_Id not found in localStorage. No action taken.');
        return;
    }

    // Function to generate a random word
    function generateRandomWord() {
        const words = ["apple", "banana", "cherry", "date", "elderberry", "fig", "grape", "honeydew"];
        return words[Math.floor(Math.random() * words.length)];
    }

    // Create the payload for the webhook
    const logoutDate = new Date().toLocaleString('en-US', { timeZone: 'America/New_York', hour12: false });
    const randomWord = generateRandomWord();
    const payload = {
        fx_customerId: fx_customer_Id,
        logoutDate: logoutDate,
        randomWord: randomWord
    };

    console.log('Sending payload:', payload);

    // Send the payload to the webhook
    fetch('https://cat-heroku-proxy-51e72e8e9b26.herokuapp.com/proxy/session', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then((response) => {
        if (!response.ok) {
            throw new Error(`Network response was not ok (${response.status})`);
        }
        return response.json();
    })
    .then((data) => {
        console.log('Successfully received response:', data);
    })
    .catch((error) => {
        console.error('Error during the request:', error);
    });
};