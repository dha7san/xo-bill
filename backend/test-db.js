require('dotenv').config();
const mongoose = require('mongoose');

const testConn = async () => {
    try {
        console.log('Connecting to:', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log('SUCCESS: Connected to MongoDB');
        process.exit(0);
    } catch (err) {
        console.error('FAILURE: Could not connect to MongoDB:', err.message);
        process.exit(1);
    }
};

testConn();
