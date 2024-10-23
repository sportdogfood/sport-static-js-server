
<script async src="https://get.geojs.io/v1/ip/geo.js"></script>

type="application/javascript"
  // Define the geoip function
  function geoip(json) {
    // Extract relevant fields from the JSON data returned from GeoJS and assign them to variables with specific names.
    var geoDataGeo = {
      geoIP: json.ip,
      geoCountry: json.country,
      geoCity: json.city,
      geoTimeZone: json.timezone
    };
    
    // Log the extracted data to the console for debugging purposes.
    console.log("Country: ", json.country);
    console.log("City: ", json.city);
    console.log("IP Address: ", json.ip);
    console.log("Timezone: ", json.timezone);

    // Retrieve the current user session from localStorage
    var thisUserSession = JSON.parse(localStorage.getItem('thisUserSession')) || {};

    // Update thisUserSession with the extracted geo information without overwriting existing properties
    thisUserSession = {
      ...thisUserSession,
      geoIP: geoDataGeo.geoIP || thisUserSession.geoIP,
      geoCountry: geoDataGeo.geoCountry || thisUserSession.geoCountry,
      geoCity: geoDataGeo.geoCity || thisUserSession.geoCity,
      geoTimeZone: geoDataGeo.geoTimeZone || thisUserSession.geoTimeZone,
      geoDataFetched: true,
      lastupdate: getFriendlyDateTime() // Timestamp for tracking updates
    };

    // Save the updated session back to localStorage
    localStorage.setItem('thisUserSession', JSON.stringify(thisUserSession));
  }

  // Helper function to get a friendly date-time string
  function getFriendlyDateTime() {
    var now = new Date();
    return now.toLocaleString();
  }