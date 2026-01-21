
const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

if (!uri) {
    console.error('MONGODB_URI is not defined in .env');
    process.exit(1);
}

console.log('Attempting to connect to MongoDB...');
console.log('URI:', uri.replace(/:([^:@]+)@/, ':****@')); // Hide password

mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000
})
    .then(() => {
        console.log('Successfully connected to MongoDB!');
        process.exit(0);
    })
    .catch(err => {
        console.error('Connection failed:', err);
        if (err.name === 'MongoNetworkError') {
            console.log('\n--- Troubleshooting Tip ---');
            console.log('This looks like a network issue. Please check:');
            console.log('1. Your IP Address might have changed. Go to MongoDB Atlas > Network Access > Add IP Address.');
            console.log('2. Your Firewall or DNS might be blocking the connection.');
        }
        process.exit(1);
    });
