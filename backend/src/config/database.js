const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/student-internship-db');
        console.log(`✅ Connected to MongoDB: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        process.exit(1);
    }
};

// Make sure this exports the function correctly
module.exports = connectDB;