import mongoose, { Document, Schema } from 'mongoose';

export enum ChallanStatus {
  GENERATED = 'GENERATED',
  PAID = 'PAID',
  SETTLED_TREASURY = 'SETTLED_TREASURY',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}

export enum PaymentMethod {
  UPI = 'UPI',
  NET_BANKING = 'NET_BANKING',
  DEBIT_CREDIT = 'DEBIT_CREDIT',
  CYBER_TREASURY = 'CYBER_TREASURY',
  CASH_COUNTER = 'CASH_COUNTER',
}

export interface ITreasuryChallan extends Document {
  challanNumber: string; // E.g., CHL-IFMIS-2026-98124
  applicationId?: string;
  instrumentId?: string;
  applicantName: string;
  businessName: string;
  district: string;
  state: string;
  majorHead: string; // '0435 - Other Administrative Services'
  subHead: string; // '101 - Fees for Stamping Weights & Measures'
  ddoCode: string; // Drawing & Disbursing Officer Code e.g. 25000301001
  baseFee: number;
  gstAmount: number;
  lateFeePenalty: number;
  totalAmount: number;
  status: ChallanStatus;
  paymentMethod?: PaymentMethod;
  transactionReference?: string;
  treasuryScrollNumber?: string;
  paidAt?: Date;
  receiptDownloadUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TreasuryChallanSchema = new Schema<ITreasuryChallan>(
  {
    challanNumber: { type: String, required: true, unique: true, index: true },
    applicationId: { type: String },
    instrumentId: { type: String },
    applicantName: { type: String, required: true },
    businessName: { type: String, required: true },
    district: { type: String, required: true, default: 'Hyderabad' },
    state: { type: String, required: true, default: 'Telangana' },
    majorHead: { type: String, default: '0435 - Other Administrative Services' },
    subHead: { type: String, default: '101 - Fees for Stamping Weights & Measures' },
    ddoCode: { type: String, default: '25000301001 (Assistant Controller, Legal Metrology)' },
    baseFee: { type: Number, required: true },
    gstAmount: { type: Number, required: true },
    lateFeePenalty: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: Object.values(ChallanStatus), default: ChallanStatus.GENERATED },
    paymentMethod: { type: String, enum: Object.values(PaymentMethod) },
    transactionReference: { type: String },
    treasuryScrollNumber: { type: String },
    paidAt: { type: Date },
    receiptDownloadUrl: { type: String },
  },
  { timestamps: true }
);

export const TreasuryChallan = mongoose.model<ITreasuryChallan>('TreasuryChallan', TreasuryChallanSchema);
