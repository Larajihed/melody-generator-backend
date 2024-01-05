const fetch = require('node-fetch');

const OPENAI_API_URL = process.env.OPENAI_API_URL;

async function sendToOpenAI(prompt) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
  };

  const body = {
    prompt,
    max_tokens: 300,
    n: 1,
    temperature: 0.7,
  };

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error('Error communicating with OpenAI API');
  }

  const data = await response.json();
  return data.choices[0].text.trim();
}

module.exports = { sendToOpenAI };
