const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('Missing required environment variable: MONGO_URI');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('connected to database');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  }
};

module.exports = connectDB;