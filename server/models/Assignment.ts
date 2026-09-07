import { Schema, model, Document, Types } from 'mongoose';

export enum AssignmentType {
  LMO = 'LMO',
  VERIFICATION_OFFICER = 'VERIFICATION_OFFICER',
  GATC = 'GATC',
}

export interface IAssignment extends Document {
  application: Types.ObjectId;
  applicationId: string;
  officer: Types.ObjectId;
  officerName: string;
  assignmentType: AssignmentType;
  priority: 'Normal' | 'High' | 'Urgent';
  assignedBy: Types.ObjectId;
  assignedByName: string;
  assignedAt: Date;
  scheduledDate?: string;
  scheduledTime?: string;
  location?: string;
  status: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const assignmentSchema = new Schema<IAssignment>(
  {
    application: { type: Schema.Types.ObjectId, ref: 'Application', required: true, index: true },
    applicationId: { type: String, required: true },
    officer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    officerName: { type: String, required: true },
    assignmentType: {
      type: String,
      enum: Object.values(AssignmentType),
      default: AssignmentType.LMO,
    },
    priority: { type: String, enum: ['Normal', 'High', 'Urgent'], default: 'Normal' },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedByName: { type: String, required: true },
    assignedAt: { type: Date, default: Date.now },
    scheduledDate: { type: String },
    scheduledTime: { type: String },
    location: { type: String },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'],
      default: 'PENDING',
    },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

export const Assignment = model<IAssignment>('Assignment', assignmentSchema);
