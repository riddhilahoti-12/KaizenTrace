import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  eventId: string;
  projectId: string;
  runId?: string;
  timestamp: Date;
  eventType: 'APP_ERROR' | 'HTTP_FAILURE' | 'TEST_FAILURE' | 'DB_OPERATION' | 'JOB_FAILURE' | 'GIT_CHANGE' | 'FIX_VERIFICATION';
  requestId?: string;
  component: string;
  route?: string;
  operation?: string;
  errorMessage?: string;
  stackTrace?: string;
  sourceFile?: string;
  sourceLine?: number;
  outcome?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

const EventSchema = new Schema<IEvent>({
  eventId: { type: String, required: true, unique: true, index: true },
  projectId: { type: String, default: 'teamflow', index: true },
  runId: { type: String, index: true },
  timestamp: { type: Date, default: Date.now, index: true },
  eventType: {
    type: String,
    required: true,
    enum: ['APP_ERROR', 'HTTP_FAILURE', 'TEST_FAILURE', 'DB_OPERATION', 'JOB_FAILURE', 'GIT_CHANGE', 'FIX_VERIFICATION'],
    index: true,
  },
  requestId: { type: String, index: true },
  component: { type: String, required: true },
  route: { type: String },
  operation: { type: String },
  errorMessage: { type: String },
  stackTrace: { type: String },
  sourceFile: { type: String },
  sourceLine: { type: Number },
  outcome: { type: String },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  metadata: { type: Schema.Types.Mixed },
}, { timestamps: true });

EventSchema.index({ projectId: 1, runId: 1, timestamp: -1 });

export const Event = mongoose.model<IEvent>('Event', EventSchema);
