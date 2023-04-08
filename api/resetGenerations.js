const { User } = require('../models/user');

async function resetGenerations(request, response) {
  try {
    await User.updateMany({}, { $set: { generations: 5 } });
    response.send('Generations reset to 5 for all users');
  } catch (error) {
    console.error(error);
    response.send('Error resetting generations');
  }
}

module.exports = resetGenerations;