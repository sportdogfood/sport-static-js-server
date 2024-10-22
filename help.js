
  // Define the userAttributes function globally by attaching it to the window object
  window.userAttributes = async function userAttributes() {
    try {
      // Check if SessionManager is defined
      if (typeof SessionManager === 'undefined') {
        throw new Error('SessionManager is not defined.');
      }

      // Retrieve attributes from LocalStorage 
      const thisUserZoom = JSON.parse(localStorage.getItem('thisUserZoom'));

      // Debugging log to see the structure of thisUserZoom
      console.log('Retrieved thisUserZoom:', JSON.stringify(thisUserZoom, null, 2));

      if (!thisUserZoom || !thisUserZoom._embedded?.['fx:attributes']) {
        throw new Error('thisUserZoom or fx:attributes not available');
      }

      // Extract the attributes from _embedded to ensure only fx:attributes are processed
      const attributes = thisUserZoom._embedded['fx:attributes'];

      // Additional check to ensure we only get an array of attributes
      if (!Array.isArray(attributes)) {
        throw new Error('fx:attributes is not an array as expected');
      }

      let thisUserSession = JSON.parse(localStorage.getItem('thisUserSession')) || {};

      // Iterate over attributes and structure them properly 
      attributes.forEach((attribute, index) => {
        const name = attribute?.name || '';
        let value = attribute?.value ?? null;

        // Debugging log to see what 'value' looks like before assignment
        //console.log(`Processing attribute ${name}, value:`, value, `(${typeof value})`);

        const href = attribute?._links?.self?.href;
        const fxAtt = extractIdFromHref(href);
        const lastupdate = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });

        // Validate and adjust 'value' if needed
        if (typeof value !== 'string' && typeof value !== 'number') {
          console.warn(`Value for attribute ${name} is not a string or number, but:`, value);
          value = String(value);
        }

        // Create the attributeData object as per the required structure 
        const attributeData = {
          attributeName: name,
          attributeValue: value,
          fxAtt,
          lastupdate,
        };

        // Assign to the session object based on the attribute name 
        switch (name.toLowerCase()) {
          case 'zoho_crm_id':
            thisUserSession.zoho_crm_id = attributeData;
            break;
          case 'loyalty_points':
            thisUserSession.loyalty_points = attributeData;
            break;
          case 'loyalty_level':
            thisUserSession.loyalty_level = attributeData;
            break;
          default:
            thisUserSession[`userAttribute_${index}`] = attributeData;
            break;
        }

        // Debugging log to see 'attributeData' right after it is created
        console.log(`Assigned attributeData for ${name}:`, JSON.stringify(attributeData, null, 2));
      });

      // Debugging logs to verify the content of thisUserSession 
      console.log('Updated thisUserSession:', JSON.stringify(thisUserSession, null, 2));

      // Send all attribute data to SessionManager 
      SessionManager.updateSession(thisUserSession); // Update the full session object at once

    } catch (error) {
      console.error('An error occurred in userAttributes:', error);
    }
  }

  // Helper function to extract ID from href 
  function extractIdFromHref(href) {
    if (!href) return null;
    const parts = href.split('/');
    return parts[parts.length - 1] || null;
  }

  // Attach the helper function to the window object if needed
  window.extractIdFromHref = extractIdFromHref;

  // Now, you can call userAttributes() from anywhere after this script is loaded

