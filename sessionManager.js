// SessionManager handles all session-related operations
export const SessionManager = {
    session: null, // Placeholder for session data
  
    initializeSession() {
      if (!localStorage.getItem("thisUserSession")) {
        this.startSession({
          status: 'logged out', // Default state
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
          fx_customerId: window.fx_customerId || null,
          lastScriptRun: getFriendlyDate(),
          lastUpdate: getFriendlyDate()
        });
      } else {
        this.getSession();
      }
    },
  
    // Other methods...
  };
  