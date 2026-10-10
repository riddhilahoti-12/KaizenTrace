import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServer: MongoMemoryServer | null = null;

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
  const uri = process.env.MONGODB_URI;

  if (uri && uri !== 'memory' && !uri.startsWith('memory:')) {
    try {
      console.log(`Connecting to MongoDB at: ${uri.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:****@')}`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });

      const isAtlas = uri.includes('mongodb+srv') || uri.includes('atlas');
      dbStatus = {
        connected: true,
        mode: isAtlas ? 'atlas' : 'local',
        label: isAtlas ? 'MongoDB Atlas (Connected)' : 'Local MongoDB (Connected)',
        host: mongoose.connection.host || 'remote-cluster',
      };
      console.log(`Successfully connected to ${dbStatus.label}`);
      return dbStatus;
    } catch (err: any) {
      console.warn(`Failed to connect to configured MongoDB (${err.message}). Falling back to In-Memory instance...`);
    }
  }

  // Fallback to MongoMemoryServer
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
    return dbStatus;
  } catch (memErr: any) {
    console.error('Failed to initialize In-Memory MongoDB:', memErr);
    dbStatus = {
      connected: false,
      mode: 'memory',
      label: 'Disconnected: ' + memErr.message,
      host: 'none',
    };
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
}

export function getDbStatus(): DbStatus {
  return {
    ...dbStatus,
    connected: mongoose.connection.readyState === 1,
  };
}
