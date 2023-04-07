const cron = require('node-cron');
const {User} = require('../models/user'); // Import the User model here

async function resetGenerations() {
  try {
    // Find and update all users with a generation count less than 5
    await User.updateMany({ generations: { $lt: 5 } }, { $set: { generations: 5 } });

    console.log('Generations reset to 5 for all users');
  } catch (error) {
    console.error('Error resetting generations:', error);
  }
}

// Schedule the resetGenerations function to run every day at midnight
cron.schedule('0 0 * * *', resetGenerations);
