import { connectDB, disconnectDB } from '../config/database.js';
import { seedData } from './seed-data.js';

async function seed() {
  const isAdminOnly = process.argv.includes('--admin-only');

  try {
    await connectDB();
    console.log('🌱 Connected to database for seeding...');
    await seedData(isAdminOnly);
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    await disconnectDB();
    process.exit(1);
  }
}

seed();
