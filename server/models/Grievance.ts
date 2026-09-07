import mongoose, { Document, Schema } from 'mongoose';

export enum GrievanceStatus {
  SUBMITTED = 'SUBMITTED',
  INSPECTOR_DISPATCHED = 'INSPECTOR_DISPATCHED',
  INVESTIGATING = 'INVESTIGATING',
  VIOLATION_CONFIRMED = 'VIOLATION_CONFIRMED',
  SEIZURE_ORDER_ISSUED = 'SEIZURE_ORDER_ISSUED',
  PENALTY_COMPOUNDED = 'PENALTY_COMPOUNDED',
  DISMISSED_UNFOUNDED = 'DISMISSED_UNFOUNDED',
  RESOLVED = 'RESOLVED',
}

export interface IGrievance extends Document {
  grievanceId: string;
  violationType: string;
  description: string;
  merchantName?: string;
  location?: string;
  instrumentId?: string;
  certificateNumber?: string;
  reporterName?: string;
  reporterPhone?: string;
  status: GrievanceStatus;
  assignedOfficer?: mongoose.Types.ObjectId;
  assignedOfficerName?: string;
  statutorySection?: string;
  penaltyAmount?: number;
  officerRemarks?: string;
  resolutionDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GrievanceSchema = new Schema<IGrievance>(
  {
    grievanceId: { type: String, required: true, unique: true, index: true },
    violationType: { type: String, required: true, index: true },
    description: { type: String, required: true },
    merchantName: { type: String },
    location: { type: String },
    instrumentId: { type: String, index: true },
    certificateNumber: { type: String, index: true },
    reporterName: { type: String, default: 'Anonymous Citizen' },
    reporterPhone: { type: String },
    status: {
      type: String,
      enum: Object.values(GrievanceStatus),
      default: GrievanceStatus.SUBMITTED,
      index: true,
    },
    assignedOfficer: { type: Schema.Types.ObjectId, ref: 'User' },
    assignedOfficerName: { type: String },
    statutorySection: { type: String, default: 'Section 30 / 38, Legal Metrology Act, 2009' },
    penaltyAmount: { type: Number, default: 0 },
    officerRemarks: { type: String },
    resolutionDate: { type: Date },
  },
  { timestamps: true }
);

export const Grievance = mongoose.model<IGrievance>('Grievance', GrievanceSchema);
