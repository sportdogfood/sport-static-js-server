// Define the geoip function
function geoip(json) {
    // Store the fetched data in the window object so that it can be used later when initializeGeoInfo is called.
    window.geoipData = json;
  }
  
  // Define a function to be called explicitly to initialize the geo information
  function initializeGeoInfo(fx_customerID = null) {
    if (typeof geoip !== "function") {
      console.error("GeoJS library did not load properly, 'geoip' is not available.");
      return;
    }
  
    if (typeof window.geoipData === 'undefined') {
      console.error("GeoJS data is not available. Please ensure the script loaded correctly.");
      return;
    }
  
    if (!fx_customerID) {
      console.error("Customer ID is not provided.");
      return;
    }
  
    // Create user data object from geo information.
    var userDataGeo = {
      userip: window.geoipData.ip,
      countrycode: window.geoipData.country_code,
      timezone: window.geoipData.timezone,
      country: window.geoipData.country,
      city: window.geoipData.city,
      latitude: window.geoipData.latitude,
      longitude: window.geoipData.longitude,
      customerID: fx_customerID // Associate geo data with a customer ID
    };
  
    // Update the session using updateThisUserSession function.
    updateThisUserSession({
      userip: userDataGeo.userip,
      countrycode: userDataGeo.countrycode,
      timezone: userDataGeo.timezone,
      country: userDataGeo.country,
      city: userDataGeo.city,
      latitude: userDataGeo.latitude,
      longitude: userDataGeo.longitude,
      fx_customerID: userDataGeo.customerID,
      geoDataFetched: true,
      lastupdate: getFriendlyDateTime() // Timestamp for tracking updates
    });
  
    // Log the update for visibility.
    console.log("Updated thisUserSession with geo information:", userDataGeo);
  }
  
  // The initializeGeoInfo(fx_customerID) function must be called by another script to use the geo data.
  // Example: initializeGeoInfo(2712345);
  