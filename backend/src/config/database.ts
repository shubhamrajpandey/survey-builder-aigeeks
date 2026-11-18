import mongoose from 'mongoose';
import { env } from './env.js';

let memoryServerInstance: { stop: () => Promise<boolean> } | null = null;

export async function connectDB(customUri?: string): Promise<typeof mongoose> {
  const uri = customUri || env.MONGODB_URI;
  if (mongoose.connection.readyState >= 1) {
    return mongoose;
  }

  const isLocal = uri.includes('localhost') || uri.includes('127.0.0.1');

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: isLocal ? 3000 : 30000,
    });
    return conn;
  } catch (error) {
    // If running in development and attempting to connect to localhost, fallback to in-memory Mongo
    if (env.NODE_ENV === 'development' && isLocal) {
      console.warn('\n⚠️  Could not connect to local MongoDB on port 27017.');
      console.log('🚀 Starting built-in In-Memory MongoDB server for development...');
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create({
          instance: { dbName: 'survey_app' },
        });
        memoryServerInstance = mongod;
        const memoryUri = mongod.getUri();
        const conn = await mongoose.connect(memoryUri);
        console.log(`✅ Connected to In-Memory MongoDB: ${memoryUri}`);

        // Automatically seed admin and demo survey data so user can log in right away
        const { seedData } = await import('../scripts/seed-data.js');
        await seedData();
        console.log(`👉 Default Admin: ${env.ADMIN_EMAIL} / ${env.ADMIN_PASSWORD}\n`);

        return conn;
      } catch (fallbackError) {
        console.error('Failed to start in-memory MongoDB fallback:', fallbackError);
        throw error;
      }
    }

    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (memoryServerInstance) {
    await memoryServerInstance.stop();
    memoryServerInstance = null;
  }
}
