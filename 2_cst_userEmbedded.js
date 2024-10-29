/* =========== start_2_userEmbedded =========== */

function updateEmbeddedData(key, data) {
    let userZoom = JSON.parse(localStorage.getItem('userZoom')) || {};

    if (!userZoom._embedded) {
        userZoom._embedded = {};
    }

    userZoom._embedded[key] = data;

    console.log(`Updating _embedded with key: ${key}, data:`, data);
    localStorage.setItem('userZoom', JSON.stringify(userZoom));
    localStorage.setItem(`debug_update_${key}`, JSON.stringify(data));
    console.log(`Set debug_update_${key} in localStorage:`, data);
}

// Attach updateEmbeddedData to window for global access
window.updateEmbeddedData = updateEmbeddedData;

/* =========== end_2_userEmbedded =========== */