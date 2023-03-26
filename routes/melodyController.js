const fetch = require('node-fetch');
const { Headers } = fetch;
const router = require('express').Router();
const Melody = require('../models/melody');
const verifyToken = require('../middleware/AuthenticateToken');
require('dotenv').config();

const apiKey = process.env.OPENAI_API_KEY;
const url ='https://api.openai.com/v1/engines/text-davinci-003/completions';

router.post('/', verifyToken, async (req, res) => {
  const prompt = `Generate a melody instructions for a ${req.body.artist} type beat`;
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  });
  const body = {
    prompt,
    max_tokens: 60,
    n: 1,
    temperature: 0.7,
  };

  try {
    // Send request to OpenAI API
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      timeout: 30000
    });

    if (!response.ok) {
      console.error('Error generating melody', response.status, await response.text());
      return res.status(500).send('Error generating melody');
    }

    // Get the generated melody from the response
    const data = await response.json();
    const generatedMelody = data.choices[0].text.trim();

    // Save the generated melody to the database
    const melody = new Melody({
      text: generatedMelody,
      emotion: req.body.emotion,
      artistName: req.body.artist,
      generatedAt: Date.now(),
      userId: req.user.id, // The user ID is included in the decoded JWT token
    });
    await melody.save();
    res.status(201).send(melody);
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});


// GET all melodies for the current user
router.get('/', async (req, res) => {
  try {
    const melodies = await Melody.find({ userId: req.user.id });
    res.send(melodies);
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

module.exports = router;
