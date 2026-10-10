import mongoose, { Schema, Document } from 'mongoose';

export interface IRun extends Document {
  runId: string;
  projectId: string;
  timestamp: Date;
  gitCommit: string;
  isHealthy: boolean;
  totalTests: number;
  passedCount: number;
  failedCount: number;
  durationMs: number;
  summary: string;
  testSuiteResults?: Array<{
    name: string;
    passed: boolean;
    durationMs: number;
    error?: string;
  }>;
  metadata?: Record<string, any>;
}

const RunSchema = new Schema<IRun>({
  runId: { type: String, required: true, unique: true, index: true },
  projectId: { type: String, default: 'teamflow', index: true },
  timestamp: { type: Date, default: Date.now, index: true },
  gitCommit: { type: String, default: 'unknown' },
  isHealthy: { type: Boolean, default: true },
  totalTests: { type: Number, default: 0 },
  passedCount: { type: Number, default: 0 },
  failedCount: { type: Number, default: 0 },
  durationMs: { type: Number, default: 0 },
  summary: { type: String, default: '' },
  testSuiteResults: { type: [Schema.Types.Mixed], default: [] },
  metadata: { type: Schema.Types.Mixed },
}, { timestamps: true });

export const Run = mongoose.model<IRun>('Run', RunSchema);
