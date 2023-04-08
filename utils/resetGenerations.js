const { User } = require('../models/user'); // Adjust the path to your User model if it's different

export default async function handler(request, response) {
    try{
        await User.updateMany({ generations: { $lt: 5 } }, { $set: { generations: 5 } });
        res.status(200).send('Generations reset to 5 for all users');
        response.status(200).json({
          body: request.body,
          query: request.query,
          cookies: request.cookies,
        });

    }catch(error){
        console.error(error)
        res.status(500).send('Error resetting generations');

    }
  }