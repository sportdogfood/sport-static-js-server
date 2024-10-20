// Adding delay before executing the polling function for FxCustomer
setTimeout(() => {
  pollForFxCustomer();
}, 20000);

// Function to poll for FxCustomer
async function pollForFxCustomer() {
  let attempts = 0;
  const maxAttempts = 4;
  const pollingIntervals = [30000, 60000, 90000];

  // Helper function to get the desired value from the variable chain
  const getValueFromChain = () => {
    const localFxCustomerId = localStorage.getItem('fx_customerId');
    const thisUser = localStorage.getItem('thisUser');
    const thisUserContact = localStorage.getItem('thisUserContact');

    if (localFxCustomerId) return localFxCustomerId;
    if (thisUser && JSON.parse(thisUser).fx_customerId) return JSON.parse(thisUser).fx_customerId;
    if (thisUserContact && JSON.parse(thisUserContact).Foxy_ID) return JSON.parse(thisUserContact).Foxy_ID;

    return null; // Return null if none of the values are found
  };

  let valueToPoll = getValueFromChain();

  if (valueToPoll) {
    const existingData = localStorage.getItem('thisUserCustomer');
    if (!existingData) {
      await fetchFxCustomer(valueToPoll);
    } else {
      console.log(`thisUserCustomer already exists in localStorage, no need to fetch`);
    }
  } else {
    console.log(`No fx_customerId, thisUser.fx_customerId, or thisUserContact.Foxy_ID found, starting polling attempts...`);

    const poll = async () => {
      if (attempts >= maxAttempts) {
        console.log("Max attempts reached. Stopping polling.");
        return;
      }

      attempts++;
      valueToPoll = getValueFromChain();
      console.log(`Polling attempt ${attempts}: Value to poll is ${valueToPoll}`);

      if (valueToPoll) {
        const existingData = localStorage.getItem('thisUserCustomer');
        if (!existingData) {
          await fetchFxCustomer(valueToPoll);
        } else {
          console.log(`thisUserCustomer already exists in localStorage, no need to fetch`);
        }
      } else {
        console.log(`Polling attempt ${attempts}: No valid ID found, waiting...`);
        const interval = attempts < pollingIntervals.length ? pollingIntervals[attempts - 1] : pollingIntervals[pollingIntervals.length - 1];
        setTimeout(poll, interval);
      }
    };

    poll();
  }
}


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