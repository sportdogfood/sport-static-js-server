async function fetchZohoReport() {
    const apiUrl = 'https://zoanalytics-2f9fed4215b4.herokuapp.com/zoho-analytics/report';
    const requestData = {
        workspaceId: '1386797000003126041',
        viewId: '1386797000023629500'
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData),
            credentials: 'include' // Include credentials for cross-origin requests
        });

        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }

        const data = await response.json();
        displayReportData(data);
    } catch (error) {
        console.error('Error fetching Zoho report:', error);
        document.getElementById('report-container').innerHTML = `<p style="color: red;">Error fetching Zoho report: ${error.message}</p>`;
    }
}
