import mongoose, { Schema, Document } from 'mongoose';

export interface IInvestigation extends Document {
  investigationId: string;
  incidentId: string;
  runId: string;
  symptom: string;
  hypothesis: string;
  confidenceScore: number;
  confidenceReasoning: string;
  faultyFile?: string;
  faultyLine?: number;
  codeDiff?: string;
  supportingEvidence: Array<{
    type: string;
    description: string;
    detail?: any;
  }>;
  counterEvidence?: string;
  recommendedFix: {
    summary: string;
    explanation: string;
    targetFile: string;
    patchContent: string;
    actionType?: 'REVERT_CHANGE' | 'CODE_PATCH' | 'CONFIG_RESET';
  };
  createdAt: Date;
}

const InvestigationSchema = new Schema<IInvestigation>({
  investigationId: { type: String, required: true, unique: true, index: true },
  incidentId: { type: String, required: true, unique: true, index: true },
  runId: { type: String, required: true, index: true },
  symptom: { type: String, required: true },
  hypothesis: { type: String, required: true },
  confidenceScore: { type: Number, required: true },
  confidenceReasoning: { type: String, required: true },
  faultyFile: { type: String },
  faultyLine: { type: Number },
  codeDiff: { type: String },
  supportingEvidence: [{ type: Schema.Types.Mixed }],
  counterEvidence: { type: String, default: '' },
  recommendedFix: {
    summary: { type: String, required: true },
    explanation: { type: String, required: true },
    targetFile: { type: String, required: true },
    patchContent: { type: String, required: true },
    actionType: { type: String, default: 'CODE_PATCH' },
  },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

export const Investigation = mongoose.model<IInvestigation>('Investigation', InvestigationSchema);
