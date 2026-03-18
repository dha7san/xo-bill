require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const count = await User.countDocuments();
        console.log(`Total users in DB: ${count}`);
        if (count > 0) {
            const users = await User.find({}, { firstName: 1, lastName: 1, email: 1, role: 1, pin: 1 });
            console.log('Users found:', JSON.stringify(users, null, 2));
        } else {
            console.log('No users found. You might need to register first.');
        }
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
};

checkUsers();
