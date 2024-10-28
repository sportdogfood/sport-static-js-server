// Function to handle user attributes with a single controlled execution
function attributesInit() {
  try {
      const userZoom = JSON.parse(localStorage.getItem('userZoom'));

      // Check if userZoom and attributes are available
      if (!userZoom || !userZoom._embedded?.['fx:attributes']) {
          console.error('User attributes are not available. Initialization aborted.');
          return;
      }

      // Check if attributes have already been processed to avoid re-execution
      let userSession = JSON.parse(localStorage.getItem('userSession')) || {};
      if (userSession['attributesProcessed']) {
          console.info('Attributes have already been processed. Skipping re-execution.');
          return;
      }

      const attributes = userZoom._embedded['fx:attributes'];

      attributes.forEach((attribute) => {
          const name = attribute?.name || '';
          const value = attribute?.value ?? null;

          const attributeData = {
              attributeName: name,
              attributeValue: value,
              lastupdate: getFriendlyDateTime(),
          };

          userSession[`userAttribute_${name}`] = attributeData;
      });

      // Mark as processed to prevent re-execution
      userSession['attributesProcessed'] = true;

      // Update session
      localStorage.setItem('userSession', JSON.stringify(userSession));
      console.log("Attributes have been successfully processed and stored.");
  } catch (error) {
      console.error('An error occurred in attributesInit:', error);
  }
}

// Helper function to get friendly date and time
function getFriendlyDateTime() {
  const now = new Date();
  return now.toLocaleString();
}

// Make sure the init function is available globally if needed
window.attributesInit = attributesInit;
