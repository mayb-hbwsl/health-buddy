/**
 * Real MongoDB database client using Mongoose.
 * Exposes the same db.user.* / db.healthEntry.* interface as the old mock
 * so zero changes are needed in page or action files.
 */

import mongoose from 'mongoose';
import UserModel from './models/User';
import HealthEntryModel from './models/HealthEntry';

// ── Connection (singleton / hot-reload safe) ─────────────────────────────────

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI in your .env file');
}

// Attach a connection cache to the global object so it survives Next.js hot reloads
const globalForMongoose = global as unknown as {
  mongooseConn: typeof mongoose | null;
  mongoosePromise: Promise<typeof mongoose> | null;
};

if (!globalForMongoose.mongooseConn) globalForMongoose.mongooseConn = null;
if (!globalForMongoose.mongoosePromise) globalForMongoose.mongoosePromise = null;

async function connectDB() {
  if (globalForMongoose.mongooseConn) return globalForMongoose.mongooseConn;

  if (!globalForMongoose.mongoosePromise) {
    globalForMongoose.mongoosePromise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  globalForMongoose.mongooseConn = await globalForMongoose.mongoosePromise;
  return globalForMongoose.mongooseConn;
}

// ── Shared shape for User returned by the db API ─────────────────────────────

export interface User {
  id: string;
  name?: string | null;
  email: string;
  password?: string | null;
  age?: number | null;
  weight?: number | null;
  height?: number | null;
  gender?: string | null;
  condition?: string | null;
  lastPeriodDate?: string | null;
  cycleLength?: number | null;
}

export interface HealthEntry {
  id: string;
  userId: string;
  type: string;
  value: string;
  status?: string | null;
  date: Date;
}

// Helper: convert a Mongoose User doc → plain User object
function toUser(doc: any): User {
  return {
    id: doc._id.toString(),
    name: doc.name ?? null,
    email: doc.email,
    password: doc.password ?? null,
    age: doc.age ?? null,
    weight: doc.weight ?? null,
    height: doc.height ?? null,
    gender: doc.gender ?? null,
    condition: doc.condition ?? null,
    lastPeriodDate: doc.lastPeriodDate ?? null,
    cycleLength: doc.cycleLength ?? null,
  };
}

// Helper: convert a Mongoose HealthEntry doc → plain HealthEntry object
function toEntry(doc: any): HealthEntry {
  return {
    id: doc._id.toString(),
    userId: doc.userId,
    type: doc.type,
    value: doc.value,
    status: doc.status ?? null,
    date: doc.date,
  };
}

// ── db API ───────────────────────────────────────────────────────────────────

export const db = {
  user: {
    async findUnique({ where }: { where: { email?: string; id?: string } }): Promise<User | null> {
      await connectDB();
      let doc = null;
      if (where.email) {
        doc = await UserModel.findOne({ email: where.email });
      } else if (where.id) {
        doc = await UserModel.findById(where.id).catch(() => null);
      }
      return doc ? toUser(doc) : null;
    },

    async create({ data }: { data: any }): Promise<User> {
      await connectDB();
      const doc = await UserModel.create(data);
      return toUser(doc);
    },

    async update({ where, data }: { where: { id: string }; data: any }): Promise<User | null> {
      await connectDB();
      const doc = await UserModel.findByIdAndUpdate(where.id, data, { new: true }).catch(() => null);
      return doc ? toUser(doc) : null;
    },

    async count(): Promise<number> {
      await connectDB();
      return UserModel.countDocuments();
    },
  },

  healthEntry: {
    async findMany({ where }: { where: { userId: string } }): Promise<HealthEntry[]> {
      await connectDB();
      const docs = await HealthEntryModel.find({ userId: where.userId }).sort({ date: -1 });
      return docs.map(toEntry);
    },

    async create({ data }: { data: any }): Promise<HealthEntry> {
      await connectDB();
      const doc = await HealthEntryModel.create(data);
      return toEntry(doc);
    },
  },
};

export default db;
