import { Schema, model, Document, Types } from 'mongoose';

export enum CertificateStatus {
  VALID = 'VALID',
  EXPIRED = 'EXPIRED',
  SUSPENDED = 'SUSPENDED',
  REVOKED = 'REVOKED',
}

export interface ICertificate extends Document {
  certificateNumber: string;
  instrument?: Types.ObjectId;
  instrumentId: string;
  instrumentType: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  capacity: string;
  accuracyClass?: string;
  application: Types.ObjectId;
  applicationId: string;
  verification: Types.ObjectId;
  owner: Types.ObjectId;
  ownerName: string;
  location: string;
  state: string;
  district: string;
  officer: Types.ObjectId;
  officerName: string;
  verificationDate: string;
  issuedAt: Date;
  validUntil: Date;
  validUntilFormatted: string;
  status: CertificateStatus;
  verificationHash: string;
  qrToken: string;
  qrUrl: string;
  digitalSignatureMetadata: {
    algorithm: string;
    signedBy: string;
    officerName: string;
    timestamp: Date;
    hash: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const certificateSchema = new Schema<ICertificate>(
  {
    certificateNumber: { type: String, required: true, unique: true, index: true },
    instrument: { type: Schema.Types.ObjectId, ref: 'Instrument' },
    instrumentId: { type: String, required: true, index: true },
    instrumentType: { type: String, required: true },
    manufacturer: { type: String, required: true },
    model: { type: String, required: true },
    serialNumber: { type: String, required: true, index: true },
    capacity: { type: String, required: true },
    accuracyClass: { type: String, default: 'Class III' },
    application: { type: Schema.Types.ObjectId, ref: 'Application', required: true, index: true },
    applicationId: { type: String, required: true, index: true },
    verification: { type: Schema.Types.ObjectId, ref: 'Verification', required: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ownerName: { type: String, required: true },
    location: { type: String, required: true },
    state: { type: String, required: true, default: 'Telangana' },
    district: { type: String, required: true, default: 'Hyderabad' },
    officer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    officerName: { type: String, required: true },
    verificationDate: { type: String, required: true },
    issuedAt: { type: Date, default: Date.now },
    validUntil: { type: Date, required: true },
    validUntilFormatted: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(CertificateStatus),
      default: CertificateStatus.VALID,
      index: true,
    },
    verificationHash: { type: String, required: true },
    qrToken: { type: String, required: true },
    qrUrl: { type: String, required: true },
    digitalSignatureMetadata: {
      algorithm: { type: String, default: 'SHA-256' },
      signedBy: { type: String, required: true },
      officerName: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      hash: { type: String, required: true },
    },
  },
  {
    timestamps: true,
  }
);

export const Certificate = model<ICertificate>('Certificate', certificateSchema);
