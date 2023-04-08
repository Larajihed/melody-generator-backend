const { User } = require('../models/user'); // Adjust the path to your User model if it's different

export default async function handler(request, response) {
    try{
        await User.updateMany({}, { $set: { generations: 5 } });
    }catch(error){
        console.error(error)
        res.status(500).send('Error resetting generations');
    }
    res.status(200).send('Generations reset to 5 for all users');

  }