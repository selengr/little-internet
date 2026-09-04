import mongoose from "mongoose"

// NOTE: Auth currently uses the file store in lib/users-file.ts.
// Keep this helper for when Mongo is running again; login/signup routes
// still contain the commented Mongo path ready to re-enable.

type MongooseCache = {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined
}

const cached: MongooseCache = global.mongoose ?? { conn: null, promise: null }
global.mongoose = cached

function getMongoUri() {
  return process.env.MONGODB_URI ?? process.env.NEXT_PUBLIC_MONGODB_URI
}

export async function connectDB() {
  const uri = getMongoUri()
  if (!uri) {
    throw new Error("Please define MONGODB_URI in .env.local")
  }

  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri)
  }

  cached.conn = await cached.promise
  return cached.conn
}
