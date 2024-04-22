const fetch = require('node-fetch');

const OPENAI_API_URL = process.env.OPENAI_API_URL;
async function sendToOpenAI(prompt) {
  try {
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



    const data = await response.json();
    return data.choices[0].text.trim();
  } catch (error) {
    console.log(error);
    throw error; // Re-throwing the error is optional depending on how you want to handle errors.
  }
}

module.exports = { sendToOpenAI };
