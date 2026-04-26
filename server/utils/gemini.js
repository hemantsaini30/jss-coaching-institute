const axios = require('axios');

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

async function enrichMCQ(question, correctOption) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { explanation: 'AI explanation unavailable.', topicTag: 'General' };

  const prompt = `Question: ${question}. Correct answer: ${correctOption}.
1. Write a clear 2-3 sentence explanation of why this answer is correct.
2. Assign exactly ONE topic tag from standard school curriculum (e.g. 'Trigonometry', 'Photosynthesis', 'Newton\'s Laws').
Respond ONLY as JSON: { "explanation": "...", "topicTag": "..." }`;

  try {
    const res = await axios.post(
      `${GEMINI_API_URL}?key=${apiKey}`,
      { contents: [{ parts: [{ text: prompt }] }] },
      { timeout: 15000 }
    );
    const text = res.data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error('Gemini MCQ enrich error:', err.message);
    return { explanation: 'AI explanation could not be generated.', topicTag: 'General' };
  }
}

async function explainWeakness(weakTopics) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return ['AI study guide unavailable. Please configure Gemini API key.'];

  const prompt = `A student is struggling with: ${weakTopics.join(', ')}.
Write a concise 5-point study guide, one point per topic, with the most important concept to revise. Be encouraging.
Format as JSON array: ["point1", "point2", "point3", "point4", "point5"]`;

  try {
    const res = await axios.post(
      `${GEMINI_API_URL}?key=${apiKey}`,
      { contents: [{ parts: [{ text: prompt }] }] },
      { timeout: 15000 }
    );
    const text = res.data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (err) {
    console.error('Gemini weakness error:', err.message);
    return ['Could not generate study guide. Please try again later.'];
  }
}

module.exports = { enrichMCQ, explainWeakness };