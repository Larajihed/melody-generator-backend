const fetch = require('node-fetch');
const router = require('express').Router();
require('dotenv').config();
const rateLimit = require('express-rate-limit');

const url = 'https://api.openai.com/v1/engines/text-davinci-003/completions';

const limiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // 20 requests
  message: {
      error: 'Too many requests from this IP. Please try again after 24 hours.',
      details: 'You have reached the maximum limit of 5 generations per 24 hours. To enjoy more features and higher limits, create an account with us.',
  },
  headers: true,
});

router.post('/new', limiter, async (req, res) => {

  const { emotion, artist, genre } = req.body;
  let prompt = `Please generate a unique chord progression using the following specifications. Limit expendable prose:\n\n`;

  // Emotion section
  if (emotion) {
    prompt += `Emotion: ${emotion}\n`;
  }

  // Artist section
  if (artist) {
    prompt += `Artist (optional): ${artist}\n`;
  }

  // Genre section
  if (genre) {
    prompt += `Genre (optional): ${genre}\n`;
  }

  // Remaining common sections
  prompt += `\nKey:\nChord progression:\nChords:\nNotes for Chord 1:\nNotes for Chord 2:\nNotes for Chord 3:\nNotes for Chord 4:`;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization':  `Bearer ${process.env.OPENAI_API_KEY}`
  };
  
  
  const body = {
    prompt,
    max_tokens: 300,
    n: 1,
    temperature: 0.7,
  };
  
  try {
    // Send request to OpenAI API
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      return res.status(500).send('Error generating melody');
    }

    const data = await response.json();
    const generatedMelody = data.choices[0].text.trim();

    // Extract rate-limit headers
    const rateLimitInfo = {
      'X-RateLimit-Limit': req.rateLimit.limit,
      'X-RateLimit-Remaining': req.rateLimit.remaining,
      'X-RateLimit-Reset': req.rateLimit.resetTime,
      'Melody': generatedMelody
    };

    res.status(201).json(rateLimitInfo);
    
  } catch (err) {
    res.status(500).send();
  }
});

module.exports = router;
