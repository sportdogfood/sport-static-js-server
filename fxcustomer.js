// Function to fetch FxCustomer data
async function fetchFxCustomerData() {
    // Helper function to get the desired value from the variable chain
    const getValueFromChain = () => {
      try {
        const localFxCustomerId = localStorage.getItem('fx_customerId');
        const thisUser = JSON.parse(localStorage.getItem('thisUser') || 'null');
        const thisUserContact = JSON.parse(localStorage.getItem('thisUserContact') || 'null');
  
        if (localFxCustomerId) return localFxCustomerId;
        if (thisUser && thisUser.fx_customerId) return thisUser.fx_customerId;
        if (thisUserContact && thisUserContact.Foxy_ID) return thisUserContact.Foxy_ID;
  
      } catch (error) {
        console.error("Error while getting value from chain:", error);
      }
  
      return null; // Return null if none of the values are found
    };
  
    let valueToFetch = getValueFromChain();
  
    if (valueToFetch) {
      const existingData = localStorage.getItem('thisUserCustomer');
      if (!existingData) {
        try {
          await fetchFxCustomer(valueToFetch);
        } catch (error) {
          console.error("Error while fetching FxCustomer data:", error);
        }
      } else {
        console.log(`thisUserCustomer already exists in localStorage, no need to fetch.`);
      }
    } else {
      console.log(`No fx_customerId, thisUser.fx_customerId, or thisUserContact.Foxy_ID found.`);
    }
  }
  
  // Fetch function for FxCustomer
  async function fetchFxCustomer(customerId) {
    const zoomParams = 'attributes,default_billing_address,default_shipping_address,default_payment_method';
    const apiUrl = `https://sportcorsproxy.herokuapp.com/foxycart/customers/${encodeURIComponent(customerId)}?zoom=${encodeURIComponent(zoomParams)}`;
    console.log("Fetching FxCustomer URL:", apiUrl);
  
    try {
      const fxResponse = await fetch(apiUrl);
      if (!fxResponse.ok) {
        throw new Error(`Failed to fetch FxCustomer data: ${fxResponse.status} ${fxResponse.statusText}`);
      }
  
      const details = await fxResponse.json();
      if (details._embedded && details._embedded['fx:customer']) {
        const thisUserCustomer = details._embedded['fx:customer'];
        localStorage.setItem("thisUserCustomer", JSON.stringify(thisUserCustomer));
        console.log("FxCustomer data stored in localStorage under 'thisUserCustomer'");
      } else {
        console.log(`No matching record found for customerId: ${customerId} in FxCustomer`);
      }
    } catch (error) {
      console.error("Error fetching data from FxCustomer API:", error);
    }
  }
  