import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB(customUri?: string): Promise<typeof mongoose> {
  const uri = customUri || env.MONGODB_URI;
  if (mongoose.connection.readyState >= 1) {
    return mongoose;
  }

  try {
    const conn = await mongoose.connect(uri);
    return conn;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
