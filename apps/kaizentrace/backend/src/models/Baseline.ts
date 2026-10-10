import mongoose, { Schema, Document } from 'mongoose';

export interface IBaseline extends Document {
  projectId: string;
  commitHash: string;
  recordedAt: Date;
  status: 'HEALTHY' | 'ACTIVE';
  notes: string;
}

const BaselineSchema = new Schema<IBaseline>({
  projectId: { type: String, default: 'teamflow', unique: true, index: true },
  commitHash: { type: String, required: true },
  recordedAt: { type: Date, default: Date.now },
  status: { type: String, default: 'HEALTHY' },
  notes: { type: String, default: 'Known-good baseline snapshot' },
}, { timestamps: true });

export const Baseline = mongoose.model<IBaseline>('Baseline', BaselineSchema);
