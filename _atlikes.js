
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Document loaded.');

  const AIRTABLE_API_KEY = 'pat4LTjhZY8vgXmUJ.ba55c4e974810f2bbddae51f9c509e3a77d92e729a70690201051c08c616f19e';
  const AIRTABLE_BASE_ID = 'appBSjjXQdTPmQlR3';
  const LIKES_TABLE_ID = 'tblhkOaO2V8AxwIUq'; // 'Likes' table
  const USER_TABLE_ID = 'tblaTwj7TKjHrFKt6'; // 'Users' table

  // Helper function to fetch Airtable data
  async function fetchAirtableData(tableId, filterFormula = '') {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableId}?${filterFormula}`;
    const options = {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`
      }
    };
    const response = await fetch(url, options);
    const data = await response.json();
    return data.records;
  }

  // Fetch Likes Table and store in localStorage (this will run once on document load)
  async function loadLikesTableToLocalStorage() {
    try {
      const likesRecords = await fetchAirtableData(LIKES_TABLE_ID);
      localStorage.setItem('likesTable', JSON.stringify(likesRecords));
      console.log('Likes table loaded into localStorage.');
    } catch (error) {
      console.error('Error loading Likes table:', error);
    }
  }

  // Search User Table by customerId and set at_customerId in localStorage (called manually)
  async function searchUserTableByCustomerId(customerId) {
    try {
      const formula = `filterByFormula={customerId}='${customerId}'`;
      const userRecords = await fetchAirtableData(USER_TABLE_ID, formula);
      if (userRecords.length > 0) {
        const recordId = userRecords[0].id;
        localStorage.setItem('at_customerId', recordId);
        console.log(`Customer found. Record ID stored: ${recordId}`);
      } else {
        localStorage.setItem('at_customerId', '');
        console.log('Customer not found.');
      }
    } catch (error) {
      console.error('Error searching user table:', error);
    }
  }

  // Run Likes table load only on page load
  await loadLikesTableToLocalStorage();

  // The searchUserTableByCustomerId function can be called manually from anywhere
  // For example:
  // searchUserTableByCustomerId('dynamicCustomerId');

});

