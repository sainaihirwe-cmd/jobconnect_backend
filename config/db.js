const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const seedData = require('../scripts/seed');

let memoryServer;

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jobconnectrwanda';

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log('[DB] Calling seedData...');
    await seedData();
    console.log('[DB] seedData completed.');
    return conn;
  } catch (error) {
    if (mongoose.connection.readyState === 1) {
      console.error('[DB] Database seeding failed:', error.message);
      return mongoose.connection;
    }

    console.warn('Primary MongoDB connection failed. Starting an in-memory MongoDB instance...');

    try {
      if (!memoryServer) {
        memoryServer = await MongoMemoryServer.create();
        process.env.MONGODB_URI = memoryServer.getUri();
      }

      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
      });
      console.log(`MongoDB Memory Connected: ${conn.connection.host}`);
      await seedData();
      return conn;
    } catch (memoryError) {
      console.error('MongoDB memory fallback failed:', memoryError.message);
      return null;
    }
  }
};

module.exports = connectDB;
