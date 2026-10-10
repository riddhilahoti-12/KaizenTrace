import mongoose, { Schema, Document } from 'mongoose';

export interface IVerification extends Document {
  verificationId: string;
  incidentId: string;
  testExecuted: string;
  beforeResult: string;
  afterResult: string;
  exitCode: number;
  outputSnippet: string;
  outcome: 'PASS' | 'FAIL' | 'INCONCLUSIVE';
  dbOutcome: string;
  timestamp: Date;
}

const VerificationSchema = new Schema<IVerification>({
  verificationId: { type: String, required: true, unique: true, index: true },
  incidentId: { type: String, required: true, index: true },
  testExecuted: { type: String, required: true },
  beforeResult: { type: String, required: true },
  afterResult: { type: String, required: true },
  exitCode: { type: Number, required: true },
  outputSnippet: { type: String, default: '' },
  outcome: { type: String, enum: ['PASS', 'FAIL', 'INCONCLUSIVE'], required: true },
  dbOutcome: { type: String, default: 'HEALTHY' },
  timestamp: { type: Date, default: Date.now, index: true },
}, { timestamps: true });

export const Verification = mongoose.model<IVerification>('Verification', VerificationSchema);
