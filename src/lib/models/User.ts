import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
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

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, default: null },
    email: { type: String, required: true, unique: true },
    password: { type: String, default: null },
    age: { type: Number, default: null },
    weight: { type: Number, default: null },
    height: { type: Number, default: null },
    gender: { type: String, default: null },
    condition: { type: String, default: null },
    lastPeriodDate: { type: String, default: null },
    cycleLength: { type: Number, default: 28 },
  },
  { timestamps: true }
);

// Prevent model recompilation during hot-reloads in Next.js dev mode
const UserModel: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ||
  mongoose.model<IUser>('User', UserSchema);

export default UserModel;
