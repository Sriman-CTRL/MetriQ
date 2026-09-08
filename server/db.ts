import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let isConnected = false;

export async function connectDB(): Promise<void> {
  if (isConnected) return;

  const mongoUri = process.env.MONGO_URI;

  mongoose.set('strictQuery', true);
  mongoose.set('bufferCommands', false);

  if (mongoUri) {
    try {
      console.log(`[Database] Attempting connection to MongoDB at: ${mongoUri.replace(/:([^:@]{4})[^:@]*@/, ':****@')}`);
      mongoose.set('strictQuery', true);
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 3000,
      });
      isConnected = true;
      console.log('[Database] Connected to primary MongoDB successfully.');
      return;
    } catch (primaryErr) {
      console.warn('[Database] Could not connect to primary MongoDB URI:', (primaryErr as Error).message);
    }
  }

  // Fallback for sandboxed cloud containers/previews without a live external MongoDB instance
  console.log('[Database] Initializing embedded MongoDB server fallback for environment preview...');
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create({
      instance: {
        dbName: 'metriq',
      },
    });
    const uri = mongod.getUri();
    console.log(`[Database] Embedded MongoDB instance started at: ${uri}`);
    await mongoose.connect(uri);
    isConnected = true;
    console.log('[Database] Connected to embedded MongoDB successfully.');
  } catch (fallbackErr) {
    console.error('[Database] Failed to initialize embedded MongoDB fallback:', fallbackErr);
    // Do not rethrow - allow server to continue running even if database fallback fails
  }
}

export async function disconnectDB(): Promise<void> {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log('[Database] Disconnected from MongoDB.');
}
