import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServer: MongoMemoryServer | null = null;
let isConnecting = false;

export interface DbStatus {
  connected: boolean;
  mode: 'atlas' | 'local' | 'memory';
  label: string;
  host: string;
}

let dbStatus: DbStatus = {
  connected: false,
  mode: 'memory',
  label: 'Disconnected',
  host: 'none',
};

export async function connectDatabase(): Promise<DbStatus> {
  if (isConnecting) {
    return dbStatus;
  }
  isConnecting = true;

  const uri = process.env.MONGODB_URI;

  // 1. If explicit MongoDB URI is provided (e.g. Atlas)
  if (uri && uri !== 'memory' && !uri.startsWith('memory:')) {
    const isAtlas = uri.includes('mongodb+srv') || uri.includes('atlas');
    const sanitizedHost = uri.includes('@') ? uri.split('@')[1].split('/')[0] : 'remote-cluster';

    try {
      console.log(`Connecting to MongoDB Atlas Cluster [${sanitizedHost}]...`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 8000,
      });

      dbStatus = {
        connected: true,
        mode: isAtlas ? 'atlas' : 'local',
        label: isAtlas ? 'MongoDB Atlas (Connected)' : 'Local MongoDB (Connected)',
        host: mongoose.connection.host || sanitizedHost,
      };
      console.log(`Successfully connected to ${dbStatus.label} [db: ${mongoose.connection.name}]`);
      isConnecting = false;
      return dbStatus;
    } catch (err: any) {
      // Do not silently fallback to memory if Atlas was explicitly configured
      dbStatus = {
        connected: false,
        mode: isAtlas ? 'atlas' : 'local',
        label: `Atlas Connection Error: ${err.message}`,
        host: sanitizedHost,
      };
      console.error(`Could not connect to MongoDB Atlas cluster (${sanitizedHost}): ${err.message}`);
      isConnecting = false;
      return dbStatus;
    }
  }

  // 2. Fallback to MongoMemoryServer ONLY when explicitly requested as 'memory' or in unit tests
  try {
    if (!mongoMemoryServer) {
      mongoMemoryServer = await MongoMemoryServer.create();
    }
    const memUri = mongoMemoryServer.getUri();
    await mongoose.connect(memUri);

    dbStatus = {
      connected: true,
      mode: 'memory',
      label: 'In-Memory Test Mode (Atlas Not Configured)',
      host: '127.0.0.1 (embedded)',
    };
    console.log(`Running with ${dbStatus.label}`);
    isConnecting = false;
    return dbStatus;
  } catch (memErr: any) {
    console.error('Failed to initialize In-Memory MongoDB:', memErr);
    dbStatus = {
      connected: false,
      mode: 'memory',
      label: 'Disconnected: ' + memErr.message,
      host: 'none',
    };
    isConnecting = false;
    return dbStatus;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
    mongoMemoryServer = null;
  }
  dbStatus.connected = false;
  dbStatus.label = 'Disconnected';
  isConnecting = false;
}

export function getDbStatus(): DbStatus {
  return {
    ...dbStatus,
    connected: mongoose.connection.readyState === 1,
  };
}

// Graceful process shutdown
process.on('SIGINT', async () => {
  await disconnectDatabase();
});
process.on('SIGTERM', async () => {
  await disconnectDatabase();
});
