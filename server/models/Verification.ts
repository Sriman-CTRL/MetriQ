import { Schema, model, Document, Types } from 'mongoose';

export interface IVerificationTest {
  testNumber: number;
  standardWeight: number;
  observedValue: number;
  error: number;
  allowedTolerance: number;
  result: 'PASS' | 'FAIL';
}

export interface IVerification extends Document {
  application: Types.ObjectId;
  applicationId: string;
  instrument?: Types.ObjectId;
  instrumentId?: string;
  officer: Types.ObjectId;
  officerName: string;
  checklist: {
    physicalCondition: boolean;
    identification: boolean;
    sealCondition: boolean;
    displayFunction: boolean;
  };
  tests: IVerificationTest[];
  evidence?: {
    title: string;
    url: string;
    type: string;
  }[];
  result: 'PASS' | 'FAIL' | 'REQUIRES_REVERIFICATION';
  remarks?: string;
  verificationHash: string;
  syncOperationId?: string;
  isOfflineSubmission: boolean;
  completedAt: Date;
  certificate?: Types.ObjectId;
  certificateNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const verificationTestSchema = new Schema<IVerificationTest>(
  {
    testNumber: { type: Number, required: true },
    standardWeight: { type: Number, required: true },
    observedValue: { type: Number, required: true },
    error: { type: Number, required: true },
    allowedTolerance: { type: Number, required: true },
    result: { type: String, enum: ['PASS', 'FAIL'], required: true },
  },
  { _id: false }
);

const verificationSchema = new Schema<IVerification>(
  {
    application: { type: Schema.Types.ObjectId, ref: 'Application', required: true, index: true },
    applicationId: { type: String, required: true, index: true },
    instrument: { type: Schema.Types.ObjectId, ref: 'Instrument' },
    instrumentId: { type: String },
    officer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    officerName: { type: String, required: true },
    checklist: {
      physicalCondition: { type: Boolean, default: true },
      identification: { type: Boolean, default: true },
      sealCondition: { type: Boolean, default: true },
      displayFunction: { type: Boolean, default: true },
    },
    tests: [verificationTestSchema],
    evidence: [
      {
        title: { type: String },
        url: { type: String },
        type: { type: String },
      },
    ],
    result: {
      type: String,
      enum: ['PASS', 'FAIL', 'REQUIRES_REVERIFICATION'],
      required: true,
      default: 'PASS',
    },
    remarks: { type: String },
    verificationHash: { type: String, required: true },
    syncOperationId: { type: String, unique: true, sparse: true, index: true },
    isOfflineSubmission: { type: Boolean, default: false },
    completedAt: { type: Date, default: Date.now },
    certificate: { type: Schema.Types.ObjectId, ref: 'Certificate' },
    certificateNumber: { type: String },
  },
  {
    timestamps: true,
  }
);

export const Verification = model<IVerification>('Verification', verificationSchema);
