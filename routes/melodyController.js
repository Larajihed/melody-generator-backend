const fetch = require('node-fetch');
const { Headers } = fetch;
const router = require('express').Router();
const Melody = require('../models/melody');
const verifyToken = require('../middleware/AuthenticateToken');
const shortid = require('shortid');
const {User} = require('../models/user'); // import the User model you defined earlier


require('dotenv').config();

const url = 'https://api.openai.com/v1/engines/text-davinci-003/completions';

router.post('/new', verifyToken, async (req, res) => {
  // Verify if the user has enough generations before making a request to the API
  const user = await User.findById(req.user.id);
  const isPremium = user.premium;

  if (user) {

    if (!isPremium && user.generations <= 0) {
      if (user.subscriptionExpiration && user.subscriptionExpiration > Date.now()) {
        user.generations = -1;
      } else {
        return res.status(429).send('Too Many Requests - No more generations left');
      }
    }
  }
  
  const prompt = req.body.emotion ?
  `Write a unique ${req.body.emotion} melody outline for a beat inspired by ${req.body.artist} for me with the following specifications. Limit expendable prose:
Key:
Tempo:
Chord progression - (Instrument)
Chords:
Notes for Chord 1:
Notes for Chord 2:
Notes for Chord 3:
Notes for Chord 4:
Lead melody - (Instrument)
Notes for Bar 1:
Notes for Bar 2:
Notes for Bar 3:
Notes for Bar 4:
Counter melody - (Instrument)
Notes for Bar 1:
Notes for Bar 2:
Notes for Bar 3:
Notes for Bar 4:` :
  `Write a unique melody outline for a beat inspired by ${req.body.artist} for me with the following specifications. Limit expendable prose:
Key:
Tempo:
Chord progression - (Instrument)
Chords:
Notes for Chord 1:
Notes for Chord 2:
Notes for Chord 3:
Notes for Chord 4:
Lead melody - (Instrument)
Notes for Bar 1:
Notes for Bar 2:
Notes for Bar 3:
Notes for Bar 4:
Counter melody - (Instrument)
Notes for Bar 1:
Notes for Bar 2:
Notes for Bar 3:
Notes for Bar 4:`;

  const headers = new Headers({
  'Content-Type': 'application/json',
  'Authorization':  `Bearer ${process.env.OPENAI_API_KEY}`
});
  
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
    console.error('Error generating melody', response.status, await response.text());
    return res.status(500).send('Error generating melody');
  }
  const data = await response.json();
  const generatedMelody = data.choices[0].text.trim();
  
  
  // Save the generated melody to the database
  const melody = new Melody({
    text: generatedMelody,
    emotion: req.body.emotion,
    artistName: req.body.artist,
    generatedAt: Date.now(),
    userId: req.user.id, 
    shareId:shortid.generate(),
  });
  
  res.status(201).send(melody);
  
  if (user && (isPremium || user.generations > 0)) {
    user.generations -= 1;
    await user.save();
  }
  
  await melody.save();
} catch (err) {
  console.error(err);
  res.status(500).send();
  }
  });
  
  
  
    
// GET all melodies for the current user
router.get('/getall', async (req, res) => {
  
  try {
    
    const melodies = await Melody.find({ userId: req.user.id });
    const melodiesWithShareLink = melodies.map((melody) => {
      const shareLink = `${req.protocol}://${req.get('host')}/melodies/${melody.shareId}`;
      return {
        ...melody.toObject(),
        shareLink
      };
    });
    res.send(melodiesWithShareLink);
    
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
});

module.exports = router;
