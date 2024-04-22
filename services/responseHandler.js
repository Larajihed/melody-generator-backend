function handleResponse(req, res, melody) {
    const rateLimitInfo = {

      'Melody': melody
    };
  
    res.status(201).json(rateLimitInfo);
  }
  
  function handleError(res, error) {
    console.error(error); // Log the error for debugging
    res.status(500).send({ error: 'An internal server error occurred' });
  }
  
  module.exports = { handleResponse, handleError };
  