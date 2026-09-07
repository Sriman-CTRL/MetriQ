import { Schema, model, Document, Types } from 'mongoose';

export enum InstrumentStatus {
  VERIFIED = 'VERIFIED',
  PENDING = 'PENDING',
  EXPIRED = 'EXPIRED',
  FLAGGED = 'FLAGGED',
}

export interface IInstrument extends Document {
  instrumentId: string;
  type: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  capacity: string;
  accuracyClass: string;
  owner: Types.ObjectId;
  ownerName?: string;
  state: string;
  district: string;
  location: string;
  status: InstrumentStatus;
  certificateNumber?: string;
  validUntil?: Date;
  lastVerifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const instrumentSchema = new Schema<IInstrument>(
  {
    instrumentId: { type: String, required: true, unique: true, index: true },
    type: { type: String, required: true },
    manufacturer: { type: String, required: true },
    model: { type: String, required: true },
    serialNumber: { type: String, required: true, index: true },
    capacity: { type: String, required: true },
    accuracyClass: { type: String, required: true, default: 'Class III' },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ownerName: { type: String },
    state: { type: String, required: true, index: true },
    district: { type: String, required: true, index: true },
    location: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(InstrumentStatus),
      default: InstrumentStatus.PENDING,
      index: true,
    },
    certificateNumber: { type: String, index: true },
    validUntil: { type: Date },
    lastVerifiedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

instrumentSchema.index({ serialNumber: 1, manufacturer: 1 });

export const Instrument = model<IInstrument>('Instrument', instrumentSchema);
