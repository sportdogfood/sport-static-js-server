// usercontent.js

const UserContent = {
    // Initialize or build the user-content object
    buildUserContent() {
      return {
        breeds: [],
        brands: [],
        favorites: [],
        likes: [],
        dislikes: [],
        activities: [],
        dogs: [],
        dog_default: [
          {
            weight: 60,
            lifestage: "Adult",
            activity: "Active"
          }
        ]
      };
    },
  
    // Example function to add a breed
    addBreed(userContent, breedName, breedId) {
      const friendlyDate = new Date().toLocaleString(); // or use `getFriendlyDate()`
      userContent.breeds.push({ name: breedName, id: breedId, friendlyDate });
    },
  
    // Other functions can be added similarly for brands, favorites, etc.
  };
  
  export default UserContent;
  