import mongoose, { Schema, Document } from 'mongoose';

export interface IIncident extends Document {
  incidentId: string;
  projectId: string;
  runId: string;
  title: string;
  status: 'OPEN' | 'INVESTIGATING' | 'PATCH_READY' | 'RESOLVED';
  severity: 'low' | 'medium' | 'high' | 'critical';
  symptom: string;
  failedTest: string;
  affectedRoute?: string;
  affectedComponent?: string;
  createdAt: Date;
  resolvedAt?: Date;
  evidenceCount: number;
  metadata?: Record<string, any>;
}

const IncidentSchema = new Schema<IIncident>({
  incidentId: { type: String, required: true, unique: true, index: true },
  projectId: { type: String, default: 'teamflow', index: true },
  runId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  status: {
    type: String,
    enum: ['OPEN', 'INVESTIGATING', 'PATCH_READY', 'RESOLVED'],
    default: 'OPEN',
    index: true,
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'high',
  },
  symptom: { type: String, required: true },
  failedTest: { type: String, required: true },
  affectedRoute: { type: String },
  affectedComponent: { type: String },
  createdAt: { type: Date, default: Date.now, index: true },
  resolvedAt: { type: Date },
  evidenceCount: { type: Number, default: 0 },
  metadata: { type: Schema.Types.Mixed },
}, { timestamps: true });

export const Incident = mongoose.model<IIncident>('Incident', IncidentSchema);
