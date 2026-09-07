import { Schema, model, Document } from 'mongoose';

export interface IStateConfiguration extends Document {
  state: string;
  fees: {
    initialVerification: number;
    periodicVerification: number;
    reVerification: number;
    lateFee: number;
  };
  verificationRules: {
    standardAccuracyTolerancePercent: number;
    allowFieldCorrection: boolean;
    requireOcrValidation: boolean;
  };
  requiredDocuments: string[];
  workflowSettings: {
    workflowType: string;
    requiresScrutiny: boolean;
    autoAssign: boolean;
  };
  verificationFrequencyMonths: number;
  active: boolean;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const stateConfigurationSchema = new Schema<IStateConfiguration>(
  {
    state: { type: String, required: true, unique: true, index: true },
    fees: {
      initialVerification: { type: Number, default: 250 },
      periodicVerification: { type: Number, default: 200 },
      reVerification: { type: Number, default: 150 },
      lateFee: { type: Number, default: 50 },
    },
    verificationRules: {
      standardAccuracyTolerancePercent: { type: Number, default: 0.5 }, // 0.5% tolerance
      allowFieldCorrection: { type: Boolean, default: true },
      requireOcrValidation: { type: Boolean, default: false },
    },
    requiredDocuments: {
      type: [String],
      default: [
        'Purchase document',
        'Previous certificate',
        'Instrument photograph',
        'Ownership / business document',
      ],
    },
    workflowSettings: {
      workflowType: { type: String, default: 'Standard' },
      requiresScrutiny: { type: Boolean, default: true },
      autoAssign: { type: Boolean, default: false },
    },
    verificationFrequencyMonths: { type: Number, default: 12 },
    active: { type: Boolean, default: true },
    isDemo: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export const StateConfiguration = model<IStateConfiguration>('StateConfiguration', stateConfigurationSchema);
