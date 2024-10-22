// Function to load the GeoJS script dynamically with async attribute
function loadGeoJS(callback) {
  const script = document.createElement('script');
  script.src = 'https://get.geojs.io/v1/ip/geo.js';
  script.async = true; // Set async attribute to load the script asynchronously
  script.onload = function() {
    if (typeof geoip !== 'undefined') {
      console.log("GeoJS script loaded successfully.");
      callback(); // Execute callback once script is loaded and `geoip` is available
    } else {
      console.error("GeoJS script loaded, but `geoip` is not defined.");
    }
  };
  script.onerror = function() {
    console.error("Failed to load GeoJS script. Ensure the URL is correct and accessible.");
  };
  document.head.appendChild(script);
}

// Function to initialize the geo information once the GeoJS script is ready
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

// Function to update session data
function updateThisGeoSession(sessionData) {
  // Placeholder function to demonstrate updating session data
  console.log("Session updated with data:", sessionData);
}

// Function to get a friendly formatted date/time
function getFriendlyDateTime() {
  const date = new Date();
  return date.toLocaleString(); // You can customize this format as per your requirements
}

// Load GeoJS script and then run the callback to initialize geo info
loadGeoJS(() => {
  // Ensure geoip is defined before calling it
  if (typeof geoip === 'function') {
    // Call geoip to get geolocation data
    geoip(function(json) {
      window.geoipData = json;
      console.log("Geo information fetched:", json);

      // Example of using the fetched geo info
      initializeGeoInfo(2712345); // Replace with the actual customer ID
    });
  } else {
    console.error("GeoJS library loaded, but 'geoip' is not defined or not a function.");
  }
});
