import mongoose from 'mongoose';



let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: true,
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10'),
      minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '2'),
      socketTimeoutMS: 30000,
      serverSelectionTimeoutMS: 5000,
      heartbeatFrequencyMS: 10000,
    };

    const connectWithRetry = async (retryCount = 0): Promise<typeof mongoose> => {
      try {
        return await mongoose.connect(MONGODB_URI!, opts);
      } catch (err) {
        const maxRetries = 5;
        if (retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000;
          console.error(`MongoDB connection failed (attempt ${retryCount + 1}). Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return connectWithRetry(retryCount + 1);
        }
        throw err;
      }
    };

    cached.promise = connectWithRetry().then((mongooseInstance) => {
      return mongooseInstance;
    });

    // Handle connection events
    mongoose.connection.on('connected', () => console.log('MongoDB connected'));
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      cached.conn = null;
      cached.promise = null;
    });
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
      cached.conn = null;
      cached.promise = null;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
