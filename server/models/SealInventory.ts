import mongoose, { Document, Schema } from 'mongoose';

export enum SealType {
  LEAD_WIRE = 'LEAD_WIRE',
  HOLOGRAPHIC_VOID = 'HOLOGRAPHIC_VOID',
  ELECTRONIC_RFID = 'ELECTRONIC_RFID',
  TAMPER_INDICATING_TAPE = 'TAMPER_INDICATING_TAPE',
}

export enum SealStatus {
  AVAILABLE = 'AVAILABLE',
  AFFIXED = 'AFFIXED',
  DAMAGED_VOID = 'DAMAGED_VOID',
  SURRENDERED = 'SURRENDERED',
  FLAGGED_TAMPERED = 'FLAGGED_TAMPERED',
}

export interface ISealHistory {
  action: string;
  actorId?: mongoose.Types.ObjectId;
  actorName: string;
  timestamp: Date;
  notes?: string;
}

export interface ISealInventory extends Document {
  sealNumber: string;
  sealType: SealType;
  batchNumber: string;
  allocatedTo?: mongoose.Types.ObjectId;
  allocatedOfficerName?: string;
  status: SealStatus;
  affixedInstrumentId?: string;
  affixedCertificateNumber?: string;
  affixedMerchantName?: string;
  affixedDate?: Date;
  affixedLocation?: string;
  auditHistory: ISealHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const SealHistorySchema = new Schema<ISealHistory>(
  {
    action: { type: String, required: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User' },
    actorName: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    notes: { type: String },
  },
  { _id: false }
);

const SealInventorySchema = new Schema<ISealInventory>(
  {
    sealNumber: { type: String, required: true, unique: true, index: true },
    sealType: {
      type: String,
      enum: Object.values(SealType),
      default: SealType.LEAD_WIRE,
    },
    batchNumber: { type: String, required: true, index: true },
    allocatedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    allocatedOfficerName: { type: String },
    status: {
      type: String,
      enum: Object.values(SealStatus),
      default: SealStatus.AVAILABLE,
      index: true,
    },
    affixedInstrumentId: { type: String, index: true },
    affixedCertificateNumber: { type: String, index: true },
    affixedMerchantName: { type: String },
    affixedDate: { type: Date },
    affixedLocation: { type: String },
    auditHistory: [SealHistorySchema],
  },
  { timestamps: true }
);

export const SealInventory = mongoose.model<ISealInventory>('SealInventory', SealInventorySchema);
