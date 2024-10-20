
    async function checkAndPollUserContactAndZoom() {
        let pollingCount = 0;
        const maxPollingAttempts = 4; // Maximum number of polling attempts
        let retryLimit = 4;
        let retryCount = 0;

        // Load existing contact and Zoom data from localStorage, safely
        let thisUserContactString = localStorage.getItem("thisUserContact");
        let thisUserContact = null;
        try {
            thisUserContact = thisUserContactString ? JSON.parse(thisUserContactString) : null;
        } catch (e) {
            console.error("Failed to parse thisUserContact from localStorage", e);
        }

        let thisUserZoomString = localStorage.getItem("thisUserZoom");
        let thisUserZoom = null;
        try {
            thisUserZoom = thisUserZoomString ? JSON.parse(thisUserZoomString) : null;
        } catch (e) {
            console.error("Failed to parse thisUserZoom from localStorage", e);
        }

        function getCustomerIdFromCookies() {
            const cookies = document.cookie.split(';');
            for (let cookie of cookies) {
                const [name, value] = cookie.split('=');
                if (name.trim() === 'fx_customerId') {
                    return decodeURIComponent(value);
                }
            }
            return null;
        }

        async function poll() {
            if (retryCount >= retryLimit) {
                console.log("Retry limit reached for customer ID, aborting.");
                return;
            }

            const fx_customerId = window.fx_customerId_global || getCustomerIdFromCookies();

            if ((!thisUserContact || !thisUserZoom) && pollingCount < maxPollingAttempts) {
                pollingCount++;
                console.log(`Polling start - Cycle #${pollingCount}`);

                if (fx_customerId) {
                    if (!window.fx_customerId_global) {
                        window.fx_customerId_global = fx_customerId;
                        console.log('fx_customerId_global is set:', window.fx_customerId_global);
                    }

                    try {
                        if (!thisUserContact) {
                            await fetchZohoContact(fx_customerId);
                            thisUserContactString = localStorage.getItem("thisUserContact");
                            thisUserContact = thisUserContactString ? JSON.parse(thisUserContactString) : null;
                        }

                        if (!thisUserZoom && typeof fetchCustomerData === 'function') {
                            await fetchCustomerData(fx_customerId);
                            thisUserZoomString = localStorage.getItem("thisUserZoom");
                            thisUserZoom = thisUserZoomString ? JSON.parse(thisUserZoomString) : null;
                        }
                    } catch (error) {
                        console.error(`Error during fetch operation on attempt ${pollingCount}:`, error);
                    }
                }

                if (!thisUserContact || !thisUserZoom) {
                    console.log(`Polling end - Cycle #${pollingCount}`);
                    if (pollingCount < maxPollingAttempts) {
                        setTimeout(poll, 5000);
                    } else {
                        console.log('Max polling attempts reached without finding user contact or zoom data');
                    }
                } else {
                    console.log('User contact and Zoom data found:', { thisUserContact, thisUserZoom });
                    if (typeof updateSessionFromThisUserContact === 'function') {
                        updateSessionFromThisUserContact(thisUserContact);
                    }
                    if (typeof userStateEmitter !== 'undefined' && typeof userStateEmitter.setState === 'function') {
                        userStateEmitter.setState({ status: "active" });
                    }
                }
            } else if (!fx_customerId) {
                retryCount++;
                console.log(`Customer ID not found, retrying in 5 seconds (Attempt ${retryCount}/${retryLimit})`);
                setTimeout(poll, 5000);
            }
        }

        setTimeout(poll, 45000);
    }

    async function fetchZohoContact(fx_customerId) {
        const zohoUrl = `https://zohoapi-bdabc2b29c18.herokuapp.com/zoho/Contacts/search?criteria=(Foxy_ID:equals:${fx_customerId})`;
        console.log("Zoho URL:", zohoUrl);

        try {
            const zohoResponse = await fetch(zohoUrl);
            if (!zohoResponse.ok) {
                throw new Error(`Failed to fetch Zoho data: ${zohoResponse.status} ${zohoResponse.statusText}`);
            }

            const details = await zohoResponse.json();
            if (details.data && details.data.length > 0) {
                const thisUserContact = details.data[0];
                localStorage.setItem("thisUserContact", JSON.stringify(thisUserContact));
                console.log("Zoho contact data stored in localStorage under 'thisUserContact'");
            } else {
                console.log(`No matching record found for Foxy_ID: ${fx_customerId} in Contacts`);
            }
        } catch (error) {
            console.error("Error fetching data from Zoho API:", error);
        }
    }

    checkAndPollUserContactAndZoom();

