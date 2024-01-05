const { User } = require('../models/user');

async function handleExpirations() {
    const expiredUsers = await User.find({ 
        premium: true, 
        subscriptionExpiration: { $lt: new Date() } 
    });

    for (let user of expiredUsers) {
        user.premium = false;
        user.generations = 5;
        await user.save();
    }

    return expiredUsers.length;
}

module.exports = { handleExpirations };
