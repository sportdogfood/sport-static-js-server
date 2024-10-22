// geoInfo.js

// Function that runs once geo.js is loaded and customerId is passed dynamically
function runGeoInfo(customerId) {
  if (typeof geoip === 'function') {
    geoip(function (json) {
      // Save geo information to window for future reference
      window.geoipData = json;
      console.log("Geo information fetched:", json);

      // Initialize geo information with the given customerId
      initializeGeoInfo(customerId);
    });
  } else {
    console.error("GeoJS library loaded, but geoip function is not defined.");
  }
}

// Function to initialize the geo information
function initializeGeoInfo(fx_customerID = null) {
  if (typeof window.geoipData === 'undefined') {
    console.error("GeoJS data is not available. Please ensure the script loaded correctly.");
    return;
  }

  if (!fx_customerID) {
    console.error("Customer ID is not provided.");
    return;
  }

  // Create geo data object from geo information.
  const geoData = {
    geoip: window.geoipData.ip,
    geocountrycode: window.geoipData.country_code,
    geotimezone: window.geoipData.timezone,
    geocountry: window.geoipData.country,
    geocity: window.geoipData.city,
    geolatitude: window.geoipData.latitude,
    geolongitude: window.geoipData.longitude,
    customerID: fx_customerID // Associate geo data with a customer ID
  };

  // Update the session using updateThisUserSession function.
  updateThisUserSession({
    geoip: geoData.geoip,
    geocountrycode: geoData.geocountrycode,
    geotimezone: geoData.geotimezone,
    geocountry: geoData.geocountry,
    geocity: geoData.geocity,
    geolatitude: geoData.geolatitude,
    geolongitude: geoData.geolongitude,
    fx_customerID: geoData.customerID,
    geoDataFetched: true,
    lastupdate: getFriendlyDateTime() // Timestamp for tracking updates
  });

  // Log the update for visibility.
  console.log("Updated thisUserSession with geo information:", geoData);
}

// Function to update session data
function updateThisUserSession(sessionData) {
  // Placeholder function to demonstrate updating session data
  console.log("Session updated with data:", sessionData);
}

// Function to get a friendly formatted date/time
function getFriendlyDateTime() {
  const date = new Date();
  return date.toLocaleString(); // You can customize this format as per your requirements
}