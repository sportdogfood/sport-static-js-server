// Load GeoJS script dynamically
function loadGeoJS(callback) {
  const script = document.createElement('script');
  script.src = 'https://get.geojs.io/v1/ip/geo.js';
  script.onload = callback; // Trigger callback when script loads
  script.onerror = function() {
    console.error("Failed to load GeoJS script. Ensure the URL is correct and accessible.");
  };
  document.head.appendChild(script);
}

// Define the callback to execute after GeoJS script has loaded
loadGeoJS(() => {
  console.log("GeoJS script loaded successfully.");

  // Ensure geoip is defined
  if (typeof geoip === 'function') {
    // Call geoip to get geolocation data
    geoip(function (json) {
      window.geoipData = json;
      console.log("Geo information fetched:", json);

      // Example of using the fetched geo info
      initializeGeoInfo(2712345); // Replace with actual customer ID
    });
  } else {
    console.error("GeoJS library loaded, but 'geoip' is not defined.");
  }
});

// Define the initializeGeoInfo function
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
  var geoData = {
    geoip: window.geoipData.ip,
    geocountrycode: window.geoipData.country_code,
    geotimezone: window.geoipData.timezone,
    geocountry: window.geoipData.country,
    geocity: window.geoipData.city,
    geolatitude: window.geoipData.latitude,
    geolongitude: window.geoipData.longitude,
    customerID: fx_customerID // Associate geo data with a customer ID
  };

  // Update the session using updateThisGeoSession function.
  updateThisGeoSession({
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
  console.log("Updated thisGeoSession with geo information:", geoData);
}

// Define the function to update session data
function updateThisGeoSession(sessionData) {
  // Placeholder function, implement as needed
  console.log("Session updated with data:", sessionData);
}

// Define the function to get a friendly formatted date/time
function getFriendlyDateTime() {
  const date = new Date();
  return date.toLocaleString(); // You can customize this format as per your requirements
}
