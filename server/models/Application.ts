import { Schema, model, Document, Types } from 'mongoose';

export enum ApplicationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_SCRUTINY = 'UNDER_SCRUTINY',
  RETURNED = 'RETURNED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ASSIGNED = 'ASSIGNED',
  SCHEDULED = 'SCHEDULED',
  FIELD_VERIFICATION = 'FIELD_VERIFICATION',
  VERIFICATION_COMPLETED = 'VERIFICATION_COMPLETED',
  CERTIFICATE_ISSUED = 'CERTIFICATE_ISSUED',
  CLOSED = 'CLOSED',
}

export interface IApplication extends Document {
  applicationId: string;
  owner: Types.ObjectId;
  applicantName: string;
  businessName: string;
  mobile: string;
  email: string;
  instrument?: Types.ObjectId;
  instrumentDetails: {
    type: string;
    manufacturer: string;
    model: string;
    serialNumber: string;
    capacity: string;
    accuracyClass: string;
  };
  verificationType: string;
  state: string;
  district: string;
  inspectionLocation: string;
  preferredDate?: string;
  priority: 'Normal' | 'High' | 'Urgent';
  status: ApplicationStatus;
  scrutiny?: {
    officer: Types.ObjectId;
    officerName: string;
    date: Date;
    remarks: string;
    action: string;
  };
  assignedOfficer?: Types.ObjectId;
  assignedOfficerName?: string;
  assignmentType?: string;
  scheduledDate?: string;
  scheduledSlot?: string;
  certificate?: Types.ObjectId;
  certificateNumber?: string;
  documents?: {
    docType: string;
    filename: string;
    url: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const applicationSchema = new Schema<IApplication>(
  {
    applicationId: { type: String, required: true, unique: true, index: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    applicantName: { type: String, required: true },
    businessName: { type: String, required: true },
    mobile: { type: String, required: true },
    email: { type: String, required: true },
    instrument: { type: Schema.Types.ObjectId, ref: 'Instrument' },
    instrumentDetails: {
      type: { type: String, required: true },
      manufacturer: { type: String, required: true },
      model: { type: String, required: true },
      serialNumber: { type: String, required: true },
      capacity: { type: String, required: true },
      accuracyClass: { type: String, default: 'Class III' },
    },
    verificationType: {
      type: String,
      default: 'Initial Verification',
    },
    state: { type: String, required: true, default: 'Telangana', index: true },
    district: { type: String, required: true, default: 'Hyderabad', index: true },
    inspectionLocation: { type: String, required: true },
    preferredDate: { type: String },
    priority: { type: String, enum: ['Normal', 'High', 'Urgent'], default: 'Normal' },
    status: {
      type: String,
      enum: Object.values(ApplicationStatus),
      default: ApplicationStatus.SUBMITTED,
      index: true,
    },
    scrutiny: {
      officer: { type: Schema.Types.ObjectId, ref: 'User' },
      officerName: { type: String },
      date: { type: Date },
      remarks: { type: String },
      action: { type: String },
    },
    assignedOfficer: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    assignedOfficerName: { type: String },
    assignmentType: { type: String, default: 'LMO' },
    scheduledDate: { type: String },
    scheduledSlot: { type: String },
    certificate: { type: Schema.Types.ObjectId, ref: 'Certificate' },
    certificateNumber: { type: String },
    documents: [
      {
        docType: { type: String },
        filename: { type: String },
        url: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Application = model<IApplication>('Application', applicationSchema);
