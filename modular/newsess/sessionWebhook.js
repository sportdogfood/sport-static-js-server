// sessionWebhook.js

/**
 * Sends session data to a specified webhook URL.
 * @param {object} payload - The session data to send.
 * @returns {Promise<void>}
 */
export async function sendSessionWebhook(payload) {
    const webhookUrl = 'https://cat-heroku-proxy-51e72e8e9b26.herokuapp.com/proxy/logout'; // Replace with your actual webhook URL

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Webhook request failed with status ${response.status}`);
        }

        const responseData = await response.json();
        console.log('[sessionWebhook] Webhook response:', responseData);
    } catch (error) {
        console.error('[sessionWebhook] Error sending webhook:', error);
        // Optional: Implement retry logic or notify relevant parts of the application
    }
}
