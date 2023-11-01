const express = require('express');
const { User } = require('../models/user'); // Import the User model

const router = express.Router();

router.get('/handle-expirations', async (req, res) => {
    try {

        console.log("handle expireation ")
        // Fetch all users where the subscriptionExpiration is less than the current date
        const expiredUsers = await User.find({ 
            premium: true, 
            subscriptionExpiration: { $lt: new Date() } 
        });

        // Loop through the users and update their premium status
        for (let user of expiredUsers) {
            user.premium = false;
            await user.save();
        }

        res.send(`${expiredUsers.length} accounts have been set to non-premium.`);
    } catch (error) {
        console.error('Error handling expirations:', error);
        res.status(500).send('An error occurred while processing expirations.');
    }
});

module.exports = router;
