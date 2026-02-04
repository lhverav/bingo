import Mongoose from "mongoose";

declare global {
  var _mongoose: typeof Mongoose | undefined;
  var _mongooseCache: {
    conn: typeof Mongoose | null;
    promise: Promise<typeof Mongoose> | null;
  } | undefined;
}

// Cache the mongoose instance itself in global — survives Next.js module re-evaluations
const mongoose: typeof Mongoose = global._mongoose || Mongoose;
if (!global._mongoose) {
  global._mongoose = mongoose;
}

export { mongoose };

const cached = global._mongooseCache || { conn: null, promise: null };
if (!global._mongooseCache) {
  global._mongooseCache = cached;
}

export async function connectToDatabase() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable");
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
