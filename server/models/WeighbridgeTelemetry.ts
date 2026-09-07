import mongoose, { Document, Schema } from 'mongoose';

export enum WeighbridgeStatus {
  ONLINE_NORMAL = 'ONLINE_NORMAL',
  TAMPER_ALERT = 'TAMPER_ALERT',
  ZERO_DRIFT_EXCEEDED = 'ZERO_DRIFT_EXCEEDED',
  OFFLINE_HEARTBEAT_LOST = 'OFFLINE_HEARTBEAT_LOST',
}

export interface IWeighbridge extends Document {
  weighbridgeId: string; // E.g., WB-HYD-APMC-01
  name: string;
  location: string;
  district: string;
  category: 'APMC_MANDI' | 'HIGHWAY_TOLL' | 'MINING_PITHEAD' | 'CEMENT_INDUSTRIAL';
  operatorName: string;
  operatorPhone: string;
  indicatorModel: string;
  indicatorSerial: string;
  capacityKg: number; // E.g. 60,000 kg
  divisionKg: number; // E.g. 10 kg (Class IV)
  loadCellCount: number;
  lastCalibrationDate: Date;
  calibrationExpiry: Date;
  status: WeighbridgeStatus;
  remoteLockActive: boolean;
  firmwareVersion: string;
  firmwareHash: string;
  currentZeroOffsetKg: number;
  maxPermissibleErrorKg: number; // MPE (+/- 20kg for 60t at verification)
  ipAddress?: string;
  lastHeartbeat: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WeighbridgeSchema = new Schema<IWeighbridge>(
  {
    weighbridgeId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    location: { type: String, required: true },
    district: { type: String, required: true, default: 'Hyderabad' },
    category: {
      type: String,
      enum: ['APMC_MANDI', 'HIGHWAY_TOLL', 'MINING_PITHEAD', 'CEMENT_INDUSTRIAL'],
      default: 'APMC_MANDI',
    },
    operatorName: { type: String, required: true },
    operatorPhone: { type: String, required: true },
    indicatorModel: { type: String, required: true },
    indicatorSerial: { type: String, required: true },
    capacityKg: { type: Number, required: true, default: 60000 },
    divisionKg: { type: Number, required: true, default: 10 },
    loadCellCount: { type: Number, default: 4 },
    lastCalibrationDate: { type: Date, default: Date.now },
    calibrationExpiry: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(WeighbridgeStatus),
      default: WeighbridgeStatus.ONLINE_NORMAL,
    },
    remoteLockActive: { type: Boolean, default: false },
    firmwareVersion: { type: String, default: 'v3.4.1-OIML' },
    firmwareHash: { type: String, default: '8f72a91b402e88a09cf312' },
    currentZeroOffsetKg: { type: Number, default: 0 },
    maxPermissibleErrorKg: { type: Number, default: 20 },
    ipAddress: { type: String, default: '10.142.18.42' },
    lastHeartbeat: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export interface IWeighbridgeTransaction extends Document {
  transactionId: string; // E.g., TX-WB-2026-98124
  weighbridgeId: string;
  timestamp: Date;
  vehicleNumber: string;
  commodity: string;
  ewayBillNumber?: string;
  grossWeightKg: number;
  tareWeightKg: number;
  netWeightKg: number;
  loadCellVoltagesMv: number[]; // E.g. [2.01, 2.02, 1.99, 2.03]
  weightStabilityAchieved: boolean;
  tamperFlags: string[];
  isAnomaly: boolean;
  anomalyReason?: string;
  slipNumber: string;
  operatorName: string;
  createdAt: Date;
  updatedAt: Date;
}

const WeighbridgeTransactionSchema = new Schema<IWeighbridgeTransaction>(
  {
    transactionId: { type: String, required: true, unique: true, index: true },
    weighbridgeId: { type: String, required: true, index: true },
    timestamp: { type: Date, default: Date.now },
    vehicleNumber: { type: String, required: true },
    commodity: { type: String, required: true },
    ewayBillNumber: { type: String },
    grossWeightKg: { type: Number, required: true },
    tareWeightKg: { type: Number, required: true },
    netWeightKg: { type: Number, required: true },
    loadCellVoltagesMv: [{ type: Number }],
    weightStabilityAchieved: { type: Boolean, default: true },
    tamperFlags: [{ type: String }],
    isAnomaly: { type: Boolean, default: false },
    anomalyReason: { type: String },
    slipNumber: { type: String, required: true },
    operatorName: { type: String, default: 'Duty Weighmaster' },
  },
  { timestamps: true }
);

export const Weighbridge =
  mongoose.models.Weighbridge || mongoose.model<IWeighbridge>('Weighbridge', WeighbridgeSchema);

export const WeighbridgeTransaction =
  mongoose.models.WeighbridgeTransaction ||
  mongoose.model<IWeighbridgeTransaction>('WeighbridgeTransaction', WeighbridgeTransactionSchema);
