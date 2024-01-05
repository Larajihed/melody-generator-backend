const express = require('express');
const { handleExpirations } = require('../services/userService');

const router = express.Router();

router.get('/handle-expirations', async (req, res) => {
    try {
        const count = await handleExpirations();
        res.send(`${count} accounts have been set to non-premium.`);
    } catch (error) {
        console.error('Error handling expirations:', error);
        res.status(500).send('An error occurred while processing expirations.');
    }
});

module.exports = router;
