const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function enrichMCQ(question, correctOption) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const prompt = `Question: ${question}. Correct answer: ${correctOption}.
1. Write a clear 2-3 sentence explanation of why this answer is correct.
2. Assign exactly ONE topic tag from standard school curriculum (e.g. 'Trigonometry', 'Photosynthesis', "Newton's Laws").
Respond ONLY as JSON: { "explanation": "...", "topicTag": "..." }`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  // Strip markdown fences if present
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

async function explainWeakness(weakTopics) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const prompt = `A student is struggling with: ${weakTopics.join(', ')}.
Write a concise 5-point study guide, one point per topic, with the most important concept to revise. Be encouraging.
Format as JSON array: ["point1", "point2", "point3", "point4", "point5"]`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

module.exports = { enrichMCQ, explainWeakness };