// Helper function to get the current friendly date and time
function getFriendlyDateTime() {
  const date = new Date();
  const options = {
    timeZone: "America/New_York",
    hour12: true,
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  };
  return new Intl.DateTimeFormat("en-US", options).format(date);
}

// Session management object with modular standalone functions
const SessionManager = {
  session: null, // Placeholder for session data

  // Initialize or retrieve the session from localStorage
  initializeSession() {
    if (!localStorage.getItem("thisUserSession")) {
      const userData = {
        thisUserEm: "", // Should be dynamically generated
        thisUserId: "", // Should be dynamically generated
        lastupdate: getFriendlyDateTime(),
        breed: false,
        reviews: false,
        comments: false,
        dogs: false,
        favorites: false,
        activities: false,
        likes: false,
        dislikes: false,
        weight: 60,
        lifestage: "adult",
        activity: "active",
        lasttransdate: "",
        lastvisitdate: "",
        foxy: "",
        email: "",
        desk: "",
        member: "",
        thrive: "",
        points: "",
        redeem: "",
        lastFlowDate: "",
        lastScriptRun: getFriendlyDateTime()
      };
      this.startSession(userData);
    } else {
      this.session = JSON.parse(localStorage.getItem("thisUserSession"));
    }
  },

  // Update the session with new data
  updateSession(newData) {
    if (!this.session) {
      this.initializeSession();
    }
    Object.assign(this.session, newData);
    this.session.lastupdate = getFriendlyDateTime();
    localStorage.setItem("thisUserSession", JSON.stringify(this.session));
  },

  // Start a new session
  startSession(userData) {
    this.session = {
      ...userData,
      lastupdate: getFriendlyDateTime(),
      lastScriptRun: getFriendlyDateTime()
    };
    localStorage.setItem("thisUserSession", JSON.stringify(this.session));
  },

  // End the current session
  endSession() {
    this.session = null;
    localStorage.removeItem("thisUserSession");
  }
};

// Initialize the session as soon as the script runs
SessionManager.initializeSession();

// Example listener for updating session data when needed
document.addEventListener("updateSessionData", function(event) {
  if (event.detail) {
    SessionManager.updateSession(event.detail);
  }
});
