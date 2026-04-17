import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IHealthEntry extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  type: string;
  value: string;
  status?: string | null;
  date: Date;
}

const HealthEntrySchema = new Schema<IHealthEntry>(
  {
    userId: { type: String, required: true, index: true },
    type: { type: String, required: true },
    value: { type: String, required: true },
    status: { type: String, default: null },
    date: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

// Prevent model recompilation during hot-reloads in Next.js dev mode
const HealthEntryModel: Model<IHealthEntry> =
  (mongoose.models.HealthEntry as Model<IHealthEntry>) ||
  mongoose.model<IHealthEntry>('HealthEntry', HealthEntrySchema);

export default HealthEntryModel;
