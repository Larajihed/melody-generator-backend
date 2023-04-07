const { User } = require('../models/user'); // Adjust the path to your User model if it's different

module.exports = async (req, res) => {
  try {
    // Find and update all users with a generation count less than 5
    await User.updateMany({ generations: { $lt: 5 } }, { $set: { generations: 5 } });

    res.status(200).send('Generations reset to 5 for all users');
  } catch (error) {
    console.error('Error resetting generations:', error);
    res.status(500).send('Error resetting generations');
  }
};