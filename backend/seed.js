import dotenv from 'dotenv';
import { connectDB } from './db.js';
import { autoSeed } from './seedData.js';

dotenv.config();

connectDB()
  .then(autoSeed)
  .then(() => {
    console.log('Seed complete.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
  });
