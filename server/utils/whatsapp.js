const axios = require('axios');

async function sendTelegramAlert(message) {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log('[Telegram] Credentials not set — skipping');
    return;
  }

  // We use POST for Telegram as it's more reliable for longer messages
  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    await axios.post(url, {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML' // This allows you to use <b>bold</b> or <i>italic</i> tags
    });
    console.log('[Telegram] Alert sent');
  } catch (err) {
    // Detailed error logging to help you debug if the token/ID is wrong
    console.error('[Telegram] Error:', err.response?.data?.description || err.message);
  }
}

module.exports = { sendTelegramAlert };