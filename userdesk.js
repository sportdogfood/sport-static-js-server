var UserDesk = (function() {
    // Function to initialize user desk details by fetching data from the proxy endpoint using async export model
    async function initialize(customerId) {
        console.log("Fetching user desk details for customerId: " + customerId);

        try {
            // Define the base URL for the proxy
            var baseUrl = `https://zaproxy-7ec3ff690999.herokuapp.com`; // Replace with your actual proxy server URL
            var workspace = `1386797000003126041`;
            var view = `1386797000017932368`;
            var searchby = 'Foxy ID';
            var searchinput = customerId;
            var apiUrl = `${baseUrl}/workspaces/${workspace}/views/${view}/data`;

            // Set criteria for filtering
            let params = new URLSearchParams({
                searchby: searchby,
                searchinput: searchinput
            });

            // Initiate async request
            let response = await fetch(`${apiUrl}?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            let data = await response.json();

            if (data && data.data && data.data.length > 0) {
                var userData = data.data[0];
                console.log("User data retrieved: ", userData);

                // Set userDesk details in localStorage inside userSession
                var userDeskDetails = {
                    ID: userData["ID"],
                    FoxyID: userData["Foxy ID"],
                    Email: userData["Email"],
                    Desk17: userData["Desk 17"]
                };

                // Assuming userSession is already defined globally
                if (typeof userSession !== 'undefined') {
                    userSession.userDesk = userDeskDetails;
                    localStorage.setItem('userSession', JSON.stringify(userSession));
                    console.log("userSession updated with userDesk details", userSession);
                } else {
                    console.error("userSession is not defined");
                }
            } else {
                console.error("No data found for customerId: " + customerId);
            }
        } catch (error) {
            console.error("Error fetching user desk details: ", error);
        }
    }

    // Public API
    return {
        initialize: initialize
    };
})();
