const axios = require('axios');

async function sendWhatsApp(message) {
  const phone = process.env.CALLMEBOT_PHONE;
  const apiKey = process.env.CALLMEBOT_APIKEY;
  if (!phone || !apiKey) {
    console.log('WhatsApp not configured, skipping. Message:', message);
    return;
  }
  const encoded = encodeURIComponent(message);
  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encoded}&apikey=${apiKey}`;
  try {
    await axios.get(url, { timeout: 10000 });
    console.log('WhatsApp message sent');
  } catch (err) {
    console.error('WhatsApp send error:', err.message);
  }
}

module.exports = { sendWhatsApp };