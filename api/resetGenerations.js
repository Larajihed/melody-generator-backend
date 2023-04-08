const { User } = require('../models/user');

async function resetGenerations(request, response) {
  try {
    await User.updateMany({}, { $set: { generations: 5 } });
    response.status(200).send('Generations reset to 5 for all users');
  } catch (error) {
    console.error(error);
    response.status(500).send('Error resetting generations');
  }
}

module.exports = resetGenerations;