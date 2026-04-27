const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function enrichMCQ(question, correctOption) {
  try {
    const prompt = `Question: ${question}. Correct answer: ${correctOption}.
    1. Write a clear 2-3 sentence explanation of why this answer is correct.
    2. Assign exactly ONE topic tag from standard school curriculum (e.g. 'Trigonometry', 'Photosynthesis', "Newton's Laws").
    Respond ONLY as JSON: { "explanation": "...", "topicTag": "..." }`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      response_format: { type: 'json_object' }, // Forces JSON mode
    });

    const text = chatCompletion.choices[0].message.content;
    console.log("[Groq] Raw enrichment response:", text);
    return JSON.parse(text);
  } catch (error) {
    console.error("[Groq] Enrichment failed:", error);
    throw error;
  }
}

async function explainWeakness(weakTopics) {
  try {
    const prompt = `A student is struggling with: ${weakTopics.join(', ')}.
    Write a concise 5-point study guide, one point per topic, with the most important concept to revise. Be encouraging.
    Format as JSON array of strings: ["point1", "point2", "point3", "point4", "point5"]`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      response_format: { type: 'json_object' },
    });

    const text = chatCompletion.choices[0].message.content;
    // Llama might wrap the array in an object like {"guide": [...]} 
    // depending on the internal bias, but usually it follows the prompt.
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : Object.values(parsed)[0];
  } catch (error) {
    console.error("[Groq] Weakness explanation failed:", error);
    throw error;
  }
}

module.exports = { enrichMCQ, explainWeakness };