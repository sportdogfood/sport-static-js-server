// fxattributes.js

// Function to handle user attributes with retry and prevention of redundant executions
function fxattributesInit(retryCount = 0) {
  try {
      const userZoom = JSON.parse(localStorage.getItem('userZoom'));

      // Check if userZoom and attributes are available
      if (!userZoom || !userZoom._embedded?.['fx:attributes']) {
          if (retryCount < 5) { // Retry up to 5 times
              console.warn('User attributes not available, retrying...');
              setTimeout(() => fxattributesInit(retryCount + 1), 1000); // Retry after 1 second
          } else {
              console.error('User attributes not available after multiple retries.');
          }
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
  } catch (error) {
      console.error('An error occurred in fxattributesInit:', error);
  }
}

// Helper function to get friendly date and time
function getFriendlyDateTime() {
  const now = new Date();
  return now.toLocaleString();
}

// Make sure the init function is available globally if needed
window.fxattributesInit = fxattributesInit;
