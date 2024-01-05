const { buildPrompt } = require('../../services/promptBuilder');

describe('Prompt Builder', () => {
  it('should build a prompt correctly with all parameters', () => {
    const prompt = buildPrompt({ emotion: 'Happy', artist: 'Artist', genre: 'Pop' });
    expect(prompt).toContain('Emotion: Happy');
    expect(prompt).toContain('Artist (optional): Artist');
    expect(prompt).toContain('Genre (optional): Pop');
  });

});
