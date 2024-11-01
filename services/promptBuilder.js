function buildPrompt({ emotion, artist, genre,tempo }) {
    let prompt = `Please generate a unique chord progression using the following specifications. Limit expendable prose:\n\n`;
  
    if (emotion) {
      prompt += `Emotion: ${emotion}\n`;
    }
  
    if (artist) {
      prompt += `Artist: ${artist}\n`;
    }
  
    if (genre) {
      prompt += `Genre: ${genre}\n`;
    }
      
    if (tempo) {
      prompt += `Tempo: ${tempo}\n`;
    }
  
    prompt += `\nKey:\nChord progression:\nChords:\nNotes for Chord 1:\nNotes for Chord 2:\nNotes for Chord 3:\nNotes for Chord 4:`;
    return prompt;
  }
  
  module.exports = { buildPrompt };
  