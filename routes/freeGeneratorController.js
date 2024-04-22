const fetch = require('node-fetch');
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Modularize API interaction
const { sendToOpenAI } = require('../services/openAiService');
const { buildPrompt } = require('../services/promptBuilder');
const { handleResponse, handleError } = require('../services/responseHandler');

/*
// Rate limiting setup
const apiRateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5,
  message: {
    error: 'Too many requests from this IP. Please try again after 24 hours.',
    details: 'You have reached the maximum limit of 5 generations per 24 hours. Please create an account for higher limits.',
  },
  headers: true,
});

  router.post('/new', apiRateLimiter, async (req, res) => {*/
router.post('/new', async (req, res) => {
  try {
    const prompt = buildPrompt(req.body);
    const melody = await sendToOpenAI(prompt);
    handleResponse(req, res, melody);
  } catch (error) {
    handleError(res, error);
  }
});


module.exports = router;
