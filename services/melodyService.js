const { User } = require('../models/user');
const Melody = require('../models/melody');
const shortid = require('shortid');
const { fetchMelody } = require('./openaiApi');

async function generateMelody(userId, melodyDetails) {
    const user = await validateUser(userId);
    const prompt = createPrompt(melodyDetails);
    const generatedMelodyText = await fetchMelody(prompt);
    const melody = await saveMelody(generatedMelodyText, melodyDetails, userId);
    updateUserGenerations(user);
    return melody;
}

// ... other functions like validateUser, createPrompt, saveMelody, updateUserGenerations
async function saveMelody(generatedMelody, { artist, genre, emotion, tempo, additionalInfo }, userId) {
    const melody = new Melody({
        text: generatedMelody,
        artistName: artist,
        genre: genre,
        emotion: emotion,
        tempo: tempo,
        additionalInfo: additionalInfo,
        generatedAt: Date.now(),
        userId: userId,
        shareId: shortid.generate(),
        name: `#${melodyCount}`
    });
    await melody.save();
    return melody;
}

async function updateUserGenerations(user) {
    if (user && (user.premium || user.generations > 0)) {
        user.generations -= 1;
        await user.save();
    }
}

async function validateUser(userId) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    if (!user.premium && user.generations <= 0) {
        throw { statusCode: 429, message: 'Too Many Requests - No more generations left' };
    }
    return user;
}

function createPrompt({ artist, genre, emotion, tempo, additionalInfo }) {
    let prompt = `Please generate a unique chord progression using the following specifications. Limit expendable prose:\n\n`;
    if (artist) prompt += `Artist Name: ${artist}\n`;
    if (genre) prompt += `Genre: ${genre}\n`;
    if (emotion) prompt += `Emotion: ${emotion}\n`;
    if (tempo) prompt += `Tempo: ${tempo}\n`;
    if (additionalInfo) prompt += `Additional Info: ${additionalInfo}\n`;
    prompt += `\nKey:\nChord progression:\nChords:\nNotes for Chord 1:\nNotes for Chord 2:\nNotes for Chord 3:\nNotes for Chord 4:`;
    return prompt;
}

module.exports = { generateMelody };
