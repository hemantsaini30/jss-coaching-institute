const axios = require('axios');

async function sendWhatsAppAlert(message) {
  const phone   = process.env.CALLMEBOT_PHONE;
  const apikey  = process.env.CALLMEBOT_APIKEY;
  if (!apikey) {
    console.log('[WhatsApp] CALLMEBOT_APIKEY not set — skipping');
    return;
  }
  const encoded = encodeURIComponent(message);
  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encoded}&apikey=${apikey}`;
  try {
    await axios.get(url);
    console.log('[WhatsApp] Alert sent');
  } catch (err) {
    console.error('[WhatsApp] Error:', err.message);
  }
}

module.exports = { sendWhatsAppAlert };