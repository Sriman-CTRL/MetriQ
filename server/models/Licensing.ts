import mongoose, { Document, Schema } from 'mongoose';

export enum LicenseType {
  MANUFACTURER = 'MANUFACTURER',
  REPAIRER = 'REPAIRER',
  DEALER = 'DEALER',
}

export enum LicenseStatus {
  ACTIVE = 'ACTIVE',
  PENDING_INSPECTION = 'PENDING_INSPECTION',
  RENEWAL_DUE = 'RENEWAL_DUE',
  SUSPENDED = 'SUSPENDED',
  REVOKED = 'REVOKED',
}

export interface ILicense extends Document {
  licenseNumber: string; // E.g., TS-LM-MFG-2026-0042
  licenseType: LicenseType;
  businessName: string;
  proprietorName: string;
  panNumber: string;
  gstin?: string;
  address: string;
  district: string;
  state: string;
  workshopAddress?: string;
  competentTechnicians: string[];
  securityDeposit: number;
  authorizedCategories: string[];
  status: LicenseStatus;
  issueDate: Date;
  validUntil: Date;
  inspectedBy?: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LicenseSchema = new Schema<ILicense>(
  {
    licenseNumber: { type: String, required: true, unique: true, index: true },
    licenseType: { type: String, enum: Object.values(LicenseType), required: true },
    businessName: { type: String, required: true },
    proprietorName: { type: String, required: true },
    panNumber: { type: String, required: true },
    gstin: { type: String },
    address: { type: String, required: true },
    district: { type: String, required: true, default: 'Hyderabad' },
    state: { type: String, required: true, default: 'Telangana' },
    workshopAddress: { type: String },
    competentTechnicians: [{ type: String }],
    securityDeposit: { type: Number, default: 25000 },
    authorizedCategories: [{ type: String }],
    status: { type: String, enum: Object.values(LicenseStatus), default: LicenseStatus.ACTIVE },
    issueDate: { type: Date, default: Date.now },
    validUntil: { type: Date, required: true },
    inspectedBy: { type: String },
    remarks: { type: String },
  },
  { timestamps: true }
);

export const License = mongoose.model<ILicense>('License', LicenseSchema);

export enum ModelApprovalStatus {
  APPROVED = 'APPROVED',
  UNDER_EVALUATION = 'UNDER_EVALUATION',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

export interface IModelApproval extends Document {
  tacNumber: string; // Type Approval Certificate e.g. IND/09/2025/481
  manufacturerName: string;
  brandModel: string;
  instrumentClass: string; // E.g., Class II, Class III, Class IV
  maxCapacity: string; // E.g., 30 kg, 300 kg, 50 ton
  verificationScaleInterval: string; // E.g., e = 1g, e = 10g
  loadCellSpecs: string;
  softwareVersionHash?: string;
  oimlStandard: string; // E.g., OIML R-76, OIML R-117
  status: ModelApprovalStatus;
  approvalDate: Date;
  validUntil: Date;
  issuingAuthority: string; // E.g., Director of Legal Metrology, GoI, New Delhi
  sealingPlan: string;
  createdAt: Date;
  updatedAt: Date;
}

const ModelApprovalSchema = new Schema<IModelApproval>(
  {
    tacNumber: { type: String, required: true, unique: true, index: true },
    manufacturerName: { type: String, required: true },
    brandModel: { type: String, required: true },
    instrumentClass: { type: String, required: true, default: 'Class III' },
    maxCapacity: { type: String, required: true },
    verificationScaleInterval: { type: String, required: true },
    loadCellSpecs: { type: String, required: true },
    softwareVersionHash: { type: String },
    oimlStandard: { type: String, required: true, default: 'OIML R-76' },
    status: { type: String, enum: Object.values(ModelApprovalStatus), default: ModelApprovalStatus.APPROVED },
    approvalDate: { type: Date, default: Date.now },
    validUntil: { type: Date, required: true },
    issuingAuthority: { type: String, default: 'Director of Legal Metrology, Krishi Bhawan, New Delhi' },
    sealingPlan: { type: String, default: 'Lead-wire through calibration jumper cover plate and casing screws' },
  },
  { timestamps: true }
);

export const ModelApproval = mongoose.model<IModelApproval>('ModelApproval', ModelApprovalSchema);
