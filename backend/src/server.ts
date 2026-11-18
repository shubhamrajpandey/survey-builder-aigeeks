import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/database.js';

async function bootstrap() {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Automatically seed default admin & demo data if database is fresh
    try {
      const { seedData } = await import('./scripts/seed-data.js');
      await seedData();
    } catch (seedErr) {
      console.warn('⚠️ Auto-seed skipped or failed:', seedErr);
    }

    const app = createApp();

    const server = app.listen(env.PORT, () => {
      console.log(`🚀 Survey API Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
      console.log(`📡 Health endpoint: http://localhost:${env.PORT}/health`);
      console.log(`📡 API Base URL: http://localhost:${env.PORT}/api/v1`);
    });

    const shutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Gracefully shutting down...`);
      server.close(async () => {
        await disconnectDB();
        console.log('💤 MongoDB disconnected. Process exiting.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
