function handleResponse(req, res, melody) {
    const rateLimitInfo = {
      'X-RateLimit-Limit': req.rateLimit.limit,
      'X-RateLimit-Remaining': req.rateLimit.remaining,
      'X-RateLimit-Reset': req.rateLimit.resetTime,
      'Melody': melody
    };
  
    res.status(201).json(rateLimitInfo);
  }
  
  function handleError(res, error) {
    console.error(error); // Log the error for debugging
    res.status(500).send({ error: 'An internal server error occurred' });
  }
  
  module.exports = { handleResponse, handleError };
  