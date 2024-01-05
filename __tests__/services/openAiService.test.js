const { sendToOpenAI } = require('../../services/openAiService');
const fetch = require('node-fetch');

// Mocking node-fetch
jest.mock('node-fetch', () => jest.fn());

describe('OpenAI Service', () => {
  it('should return a trimmed response from OpenAI API', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ choices: [{ text: 'Generated Melody ' }] })
    };
    fetch.mockImplementationOnce(() => Promise.resolve(mockResponse));

    const response = await sendToOpenAI('test prompt');
    expect(response).toEqual('Generated Melody');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('should throw an error when the response is not ok', async () => {
    fetch.mockImplementationOnce(() => Promise.resolve({ ok: false }));

    await expect(sendToOpenAI('test prompt')).rejects.toThrow('Error communicating with OpenAI API');
  });
});
