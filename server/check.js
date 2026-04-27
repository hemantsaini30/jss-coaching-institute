require('dotenv').config();
const Groq = require('groq-sdk');

async function testGroq() {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.error("❌ GROQ_API_KEY missing in .env");
    return;
  }

  const client = new Groq({ apiKey });

  try {
    const response = await client.chat.completions.create({
      model: "llama-3.1-8b-instant", // ✅ free + fast
      messages: [
        { role: "user", content: "Say 'Connection Successful'" }
      ],
    });

    console.log("✅ SUCCESS:");
    console.log(response.choices[0].message.content);

  } catch (err) {
    console.log("❌ ERROR:", err.message);
  }
}

testGroq();