// User Attributes Function to update user attributes
async function userAttributes() {
  try {
    const thisUserZoom = JSON.parse(localStorage.getItem('thisUserZoom'));

    if (!thisUserZoom || !thisUserZoom._embedded?.['fx:attributes']) {
      throw new Error('thisUserZoom or fx:attributes not available');
    }

    const attributes = thisUserZoom._embedded['fx:attributes'];

    if (!Array.isArray(attributes)) {
      throw new Error('fx:attributes is not an array as expected');
    }

    let thisUserSession = JSON.parse(localStorage.getItem('thisUserSession')) || {};

    attributes.forEach((attribute, index) => {
      const name = attribute?.name || '';
      let value = attribute?.value ?? null;

      const href = attribute?._links?.self?.href;
      const fxAtt = extractIdFromHref(href);
      const lastupdate = getFriendlyDate();

      if (typeof value !== 'string' && typeof value !== 'number') {
        value = String(value);
      }

      const attributeData = {
        attributeName: name,
        attributeValue: value,
        fxAtt,
        lastupdate,
      };

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
    });

    SessionManager.updateSession(thisUserSession);
  } catch (error) {
    console.error('An error occurred in userAttributes:', error);
  }
}