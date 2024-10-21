
// Define the userAttributes function but do not immediately execute it
async function userAttributes() {
  if (typeof SessionManager === 'undefined') {
    console.error('SessionManager is not defined.');
    throw new Error('SessionManager is not defined.');
  }

  // Get attributes from LocalStorage
  let thisUserZoom = JSON.parse(localStorage.getItem('thisUserZoom'));
  let thisUserSession = JSON.parse(localStorage.getItem('thisUserSession')) || {};

  // Ensure specific user attributes are initialized as objects
  if (typeof thisUserSession.userCRM !== 'object') thisUserSession.userCRM = {};
  if (typeof thisUserSession.userPoints !== 'object') thisUserSession.userPoints = {};
  if (typeof thisUserSession.userLevel !== 'object') thisUserSession.userLevel = {};

  // Check if both thisUserZoom and thisUserSession are available
  if (!thisUserZoom) {
    updateThisUserSession({ error: "thisUserZoom is not available.", lastupdate: getFriendlyDateTime() });
  } else if (!thisUserZoom?._embedded?.['fx:attributes']) {
    updateThisUserSession({ error: "fx:attributes is not available in thisUserZoom.", lastupdate: getFriendlyDateTime() });
  } else {
    let attributes = thisUserZoom?._embedded?.['fx:attributes'] || [];
    
    // Iterate over the attributes to find relevant data
    for (let i = 0; i < attributes.length; i++) {
      let attribute = attributes[i];
      let name = attribute?.name;
      let value = attribute?.value;
      let href = attribute?._links?.self?.href;

      let attributeData = {
        attributeName: name,
        attributeValue: value !== undefined && value !== null ? value : null,
        fxAtt: extractIdFromHref(href),
        lastupdate: new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
      };

      // Assign attribute data explicitly to user attributes in thisUserSession
      if (name === "Zoho_CRM_ID") {
        thisUserSession.userCRM = attributeData;
      } else if (name === "Loyalty_Points") {
        thisUserSession.userPoints = attributeData;
      } else if (name === "Loyalty_Level") {
        thisUserSession.userLevel = attributeData;
      } else {
        // Handle additional attributes dynamically
        thisUserSession[`userAttribute_${i + 4}`] = attributeData;
      }
    }

    // If values were not found, assign default empty objects
    if (!thisUserSession.userCRM.fxAtt) {
      thisUserSession.userCRM = { attributeName: "Zoho_CRM_ID", attributeValue: null, fxAtt: null, lastupdate: getFriendlyDateTime() };
    }
    if (!thisUserSession.userPoints.fxAtt) {
      thisUserSession.userPoints = { attributeName: "Loyalty_Points", attributeValue: null, fxAtt: null, lastupdate: getFriendlyDateTime() };
    }
    if (!thisUserSession.userLevel.fxAtt) {
      thisUserSession.userLevel = { attributeName: "Loyalty_Level", attributeValue: null, fxAtt: null, lastupdate: getFriendlyDateTime() };
    }

    // Update session data with the structured objects
    thisUserSession.lastupdate = getFriendlyDateTime();
    updateThisUserSession(thisUserSession);

    // Send each object to SessionManager to update session
    SessionManager.updateSession(thisUserSession.userCRM);
    SessionManager.updateSession(thisUserSession.userPoints);
    SessionManager.updateSession(thisUserSession.userLevel);

    // Update additional dynamic attributes
    Object.keys(thisUserSession).forEach(key => {
      if (key.startsWith('userAttribute_')) {
        SessionManager.updateSession(thisUserSession[key]);
      }
    });
  }
}

// Helper function to extract ID from href
function extractIdFromHref(href) {
  if (!href) return null;
  let parts = href.split('/');
  return parts[parts.length - 1] || null;
}

// Example listener for updating session data when needed (still needs to be called externally)
document.addEventListener("updateSessionData", function(event) {
  if (event.detail) {
    updateThisUserSession({ eventDetail: event.detail, lastupdate: getFriendlyDateTime() });
    SessionManager.updateSession(event.detail);
  }
});

// The function can be called externally like this:
// userAttributes();

