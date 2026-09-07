import mongoose, { Document, Schema } from 'mongoose';

export enum WorkingStandardStatus {
  CALIBRATED_ACTIVE = 'CALIBRATED_ACTIVE',
  DUE_SOON = 'DUE_SOON',
  CALIBRATION_OVERDUE = 'CALIBRATION_OVERDUE',
  UNDER_CALIBRATION = 'UNDER_CALIBRATION',
  DECOMMISSIONED = 'DECOMMISSIONED',
}

export interface ICalibrationRecord {
  calibratedAt: Date;
  validUntil: Date;
  calibratedBy: string; // E.g., RRSL Bangalore or State Standards Lab Hyderabad
  certificateNumber: string;
  maxPermissibleErrorMg: number;
  measuredDeviationMg: number;
  passed: boolean;
  remarks?: string;
}

export interface IStandardWeight extends Document {
  kitId: string; // E.g., KIT-HYD-LMO-01
  kitName: string; // E.g., Working Standard Weights Kit (Class M1 - 1mg to 10kg)
  assignedOfficerId?: mongoose.Types.ObjectId;
  assignedOfficerName: string;
  district: string;
  accuracyClass: string; // Class F1, Class F2, Class M1, Class M2
  standardType: string; // Precision Weights Box, Heavy Cast Iron Block Weights (20kg), Standard Conical Measure
  piecesCount: number;
  lastCalibrationDate: Date;
  nextCalibrationDueDate: Date;
  calibratingLaboratory: string; // E.g., Regional Reference Standards Laboratory (RRSL), Bangalore
  calibrationCertificateNumber: string;
  status: WorkingStandardStatus;
  calibrationHistory: ICalibrationRecord[];
  createdAt: Date;
  updatedAt: Date;
}

const CalibrationRecordSchema = new Schema<ICalibrationRecord>(
  {
    calibratedAt: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    calibratedBy: { type: String, required: true },
    certificateNumber: { type: String, required: true },
    maxPermissibleErrorMg: { type: Number, required: true },
    measuredDeviationMg: { type: Number, required: true },
    passed: { type: Boolean, default: true },
    remarks: { type: String },
  },
  { _id: false }
);

const StandardWeightSchema = new Schema<IStandardWeight>(
  {
    kitId: { type: String, required: true, unique: true, index: true },
    kitName: { type: String, required: true },
    assignedOfficerId: { type: Schema.Types.ObjectId, ref: 'User' },
    assignedOfficerName: { type: String, required: true },
    district: { type: String, required: true, default: 'Hyderabad' },
    accuracyClass: { type: String, required: true, default: 'Class M1' },
    standardType: { type: String, required: true, default: 'Working Standard Brass/Stainless Weights' },
    piecesCount: { type: Number, required: true, default: 28 },
    lastCalibrationDate: { type: Date, required: true },
    nextCalibrationDueDate: { type: Date, required: true },
    calibratingLaboratory: { type: String, default: 'Regional Reference Standards Laboratory (RRSL), Bangalore' },
    calibrationCertificateNumber: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(WorkingStandardStatus),
      default: WorkingStandardStatus.CALIBRATED_ACTIVE,
    },
    calibrationHistory: [CalibrationRecordSchema],
  },
  { timestamps: true }
);

export const StandardWeight = mongoose.model<IStandardWeight>('StandardWeight', StandardWeightSchema);
