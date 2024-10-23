
document.addEventListener("DOMContentLoaded", function () {
    // Retrieve thisUserContact from localStorage
    let thisUserContact = null;
    const storedUserContact = localStorage.getItem('thisUserContact');

    if (storedUserContact) {
        try {
            thisUserContact = JSON.parse(storedUserContact);
            console.log("Successfully retrieved thisUserContact from localStorage:", thisUserContact);
        } catch (error) {
            console.error("Error parsing thisUserContact from localStorage:", error);
        }
    } else {
        console.warn("No thisUserContact found in localStorage.");
    }

    // Get the check-member button
    const checkMemberButton = document.getElementById('check-member');

    // Ensure the button exists
    if (checkMemberButton) {
        // Add click event listener to the button
        checkMemberButton.addEventListener('click', function () {
            console.log("Check Member button clicked");
            
            // Verify if thisUserContact has Dashboard_Id.id available
            let checkUserContact = thisUserContact?.Dashboard_Id?.id;

            if (checkUserContact) {
                console.log("thisUserContact is available:", checkUserContact);

                // Make the API call to test the proxy
                (async function () {
                    try {
                        console.log('Attempting to fetch from Zoho API via proxy...');
                        
                        const zohoUrl = `https://zohoapi-bdabc2b29c18.herokuapp.com/zoho/Member/${checkUserContact}`;
                        const apiResponse = await fetch(zohoUrl);

                        if (!apiResponse.ok) {
                            throw new Error(`Error: ${apiResponse.status} - ${apiResponse.statusText}`);
                        }

                        // Set localStorage with the retrieved member data
                        const thisMember = await apiResponse.json();
                        localStorage.setItem('thisMember', JSON.stringify(thisMember));
                        console.log('Data successfully loaded to thisMember:', thisMember);

                        // Show success message
                        alert('Member data successfully refreshed.');

                    } catch (error) {
                        console.error('Failed to fetch data from Zoho API:', error);
                    }
                })();
                
            } else {
                console.log('Dashboard_Id.id is null or undefined');
            }
        });
    } else {
        console.error('Check Member button not found');
    }
});
