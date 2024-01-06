const { User } = require('../models/user');
const mongoose = require('mongoose');
require('dotenv').config();

async function resetDatabase() {
    // Connect to the database
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Testing3")
    // Define the default state for users
    const defaultUserData = [
        // Add your default user data here
    ];

    // Clear the User collection
    await User.deleteMany({});

    // Insert the default user data
    await User.insertMany(defaultUserData);

    console.log('Database has been reset to the default state');
}

resetDatabase().then(() => {
    mongoose.disconnect();
});
