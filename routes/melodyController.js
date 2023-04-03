const fetch = require('node-fetch');
const { Headers } = fetch;
const router = require('express').Router();
const Melody = require('../models/melody');
const verifyToken = require('../middleware/AuthenticateToken');
const shortid = require('shortid');
const {User} = require('../models/user'); // import the User model you defined earlier


require('dotenv').config();

const url ='https://api.openai.com/v1/engines/text-davinci-003/completions';
router.post('/new', verifyToken, async (req, res) => {
  const prompt = req.body.emotion ? 
  `Create a melody in the style of ${req.body.artist} that evokes the emotion of ${req.body.emotion}. Please provide the key, tempo, and instructions for each part of the melody.` :
  `Create a melody in the style of ${req.body.artist}. Please provide the key, tempo, and instructions for each part of the melody.`;
/*
  const prompt = req.body.emotion ? 
  `Create a melody in the style of ${req.body.artist} that evokes the emotion of ${req.body.emotion}. Please provide the key, tempo, and instructions for each part of the melody in the following JSON format {   
    "Key":"Key", "Tempo": "Tempo", "Part X":{"Instrument": "Instrument Used ","Notes": [],"Techniques": []} Please make sure to include "Part X" for each section, where X is the number of the part.` :
  `Create a melody in the style of ${req.body.artist}. Please provide the key, tempo, and instructions for each part of the melody in the following JSON format {   
    "Key":"Key", "Tempo": "Tempo", "Part X":{"Instrument": "Instrument Used ","Notes": [],"Techniques": []} Please make sure to include "Part X" for each section, where X is the number of the part.`;
*/

  const headers = new Headers({
  'Content-Type': 'application/json',
  'Authorization':  `Bearer ${process.env.OPENAI_API_KEY}`
});
  
  const body = {
  prompt,
  max_tokens: 1000,
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
  
  // Get the generated melody from the response
  const data = await response.json();
  
  const generatedMelody = data.choices[0].text.trim();
  const shareId = shortid.generate(); // generate a unique ID
  
  // Save the generated melody to the database
  const melody = new Melody({
    text: generatedMelody,
    emotion: req.body.emotion,
    artistName: req.body.artist,
    generatedAt: Date.now(),
    userId: req.user.id, // The user ID is included in the decoded JWT token
    shareId:shareId,
  });
  
  const user = await User.findById(req.user.id);
  
  if (user) {
    // Check if the user is premium
    const isPremium = user.premium;
  
    // If the user is basic and has exceeded the generation limit, check if they are premium and their subscription is still active
    if (!isPremium && user.generations <= 0) {
      if (user.subscriptionExpiration && user.subscriptionExpiration > Date.now()) {
        // User is premium and subscription is still active
        user.generations = -1; // Set generations to unlimited
      } else {
        // User is not premium or subscription is expired
        return res.status(429).send('Too Many Requests - No more generations left');
      }
    }
  
    // If the user is basic or premium and still has generations remaining or unlimited, decrement the generation count
    if (isPremium || user.generations > 0) {
      user.generations -= 1;
      await user.save();
    } else {
      // User is not premium or subscription is expired
      return res.status(429).send('Too Many Requests - No more generations left');
    }
  }
  
  await melody.save();
  res.status(201).send(melody);
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
