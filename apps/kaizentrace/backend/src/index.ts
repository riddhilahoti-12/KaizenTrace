import dotenv from 'dotenv';
import { createApp } from './app.js';
import { connectDatabase, getDbStatus } from './config/database.js';
import { GitService } from './services/gitService.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend .env, then root .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5050;

async function bootstrap() {
  console.log('--- Initializing KaizenTrace Investigation Engine ---');
  
  // 1. Connect MongoDB
  const dbStatus = await connectDatabase();
  console.log(`Database Status: [${dbStatus.label}] (Host: ${dbStatus.host})`);

  // 2. Establish Git Baseline if not present
  try {
    const baseline = await GitService.getBaselineCommit();
    console.log(`Git Baseline Commit: ${baseline.slice(0, 7)}`);
  } catch (err: any) {
    console.warn(`Could not read git baseline: ${err.message}`);
  }

  // 3. Start Server
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`KaizenTrace Backend running on http://localhost:${PORT}`);
    console.log(`Health Check: http://localhost:${PORT}/api/health`);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal initialization error in KaizenTrace:', err);
  process.exit(1);
});
