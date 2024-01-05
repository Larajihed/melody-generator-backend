const fetch = require('node-fetch');
const { Headers } = fetch;
const router = require('express').Router();
const Melody = require('../models/melody');
const verifyToken = require('../middleware/AuthenticateToken');
const shortid = require('shortid');
const {User} = require('../models/user'); // import the User model you defined earlier


require('dotenv').config();

const OPENAI_API_URL = process.env.OPENAI_API_URL;

router.post('/new', verifyToken, async (req, res) => {
  const { artist,genre, emotion, tempo, additionalInfo} = req.body;
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
  
  // Increment user's melody count
  user.melodyCount = (user.melodyCount || 0) + 1;
  await user.save();

  const melodyName = `#${user.melodyCount}`;  // generate unique name

  let prompt = `Please generate a unique chord progression using the following specifications. Limit expendable prose:\n\n`;
  
  // Emotion section
  if (artist) {
    prompt += `Artist Name: ${artist}\n`;
  }
  // Genre section
  if (genre) {
    prompt += `Genre: ${genre}\n`;
  }

  // Emotion section
  if (emotion) {
    prompt += `Emotion: ${emotion}\n`;
  }

  // Artist section
  if (tempo) {
    prompt += `Tempo: ${tempo}\n`;
  }

  // Genre section
  if (additionalInfo) {
    prompt += `Additional Info: ${additionalInfo}\n`;
  }

  
  // Remaining common sections
  prompt += `\nKey:\nChord progression:\nChords:\nNotes for Chord 1:\nNotes for Chord 2:\nNotes for Chord 3:\nNotes for Chord 4:`;

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
  const response = await fetch(OPENAI_API_URL, {
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
    artistName: artist,
    genre: genre,
    emotion: emotion,
    tempo: tempo,
    additionalInfo:additionalInfo,
    generatedAt: Date.now(),
    userId: req.user.id, 
    shareId:shortid.generate(),
    name: melodyName

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
      const page = Number(req.query.page) || 1;  // default to page 1 if not provided
      const limit = 10;  // fixed limit of 10 melodies per page
      const skip = (page - 1) * limit;
      
      // Get the total number of melodies for the user.
      const totalCount = await Melody.countDocuments({ userId: req.user.id });

      // Fetch the melodies in descending order based on creation date.
      const melodies = await Melody.find({ userId: req.user.id })
                                   .sort({ 'dateGenerated': -1 })
                                   .skip(skip)
                                   .limit(limit);

      const melodiesWithShareLink = melodies.map((melody) => {
          const shareLink = `${req.protocol}://${req.get('host')}/melodies/${melody.shareId}`;
          return {
              ...melody.toObject(),
              shareLink
          };
      });

      // Return both the melodies and the total count.
      res.json({ melodies: melodiesWithShareLink, totalCount });

  } catch (err) {
      console.error(err);
      res.status(500).send();
  }
});


module.exports = router;
