import mongoose from 'mongoose';

mongoose.set('strictQuery', false);

const MONGODB_URI =
  process.env.MONGODB_URI?.trim() ??
  process.env.MONGO_URI?.trim() ??
  process.env.NEXT_PUBLIC_MONGODB_URI?.trim();

// The dev server re-evaluates modules on every HMR pass, which would open a new
// connection pool each time. Caching on globalThis keeps it to one.
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var _mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global._mongoose ?? { conn: null, promise: null };
global._mongoose = cached;

export default async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not set. Copy .env.example to .env.local and fill it in.');
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      family: 4,
      maxPoolSize: 10,
      retryWrites: true,
      retryReads: true,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    // Don't cache a rejected promise, or every later request reuses the failure.
    cached.promise = null;

    const message =
      'MongoDB connection failed. Check MONGODB_URI, Atlas IP whitelist/network access, and whether your cluster is reachable from this machine.';

    if (error instanceof Error) {
      throw new Error(`${message} ${error.message}`);
    }

    throw new Error(message);
  }

  return cached.conn;
}
