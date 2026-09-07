import mongoose, { Document, Schema } from 'mongoose';

export enum LmpcApplicantType {
  MANUFACTURER = 'MANUFACTURER',
  PACKER = 'PACKER',
  IMPORTER = 'IMPORTER',
}

export enum LmpcStatus {
  APPROVED = 'APPROVED',
  PENDING_SCRUTINY = 'PENDING_SCRUTINY',
  RENEWAL_DUE = 'RENEWAL_DUE',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

export interface ILmpcRegistration extends Document {
  registrationNumber: string; // E.g., TS-LMPC-IMP-2026-0041
  applicantType: LmpcApplicantType;
  companyName: string;
  brandNames: string[];
  authorizedPerson: string;
  panNumber: string;
  gstin?: string;
  email: string;
  phone: string;
  registeredAddress: string;
  warehouseAddress?: string;
  district: string;
  state: string;
  commodities: string[];
  status: LmpcStatus;
  mandatoryDeclarationsCompliant: boolean; // MRP, Net Qty, Best Before, Consumer Care, Country of Origin
  issueDate: Date;
  validUntil: Date;
  feeAmount: number;
  challanNumber?: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LmpcRegistrationSchema = new Schema<ILmpcRegistration>(
  {
    registrationNumber: { type: String, required: true, unique: true, index: true },
    applicantType: { type: String, enum: Object.values(LmpcApplicantType), required: true },
    companyName: { type: String, required: true },
    brandNames: [{ type: String }],
    authorizedPerson: { type: String, required: true },
    panNumber: { type: String, required: true },
    gstin: { type: String },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    registeredAddress: { type: String, required: true },
    warehouseAddress: { type: String },
    district: { type: String, required: true, default: 'Hyderabad' },
    state: { type: String, required: true, default: 'Telangana' },
    commodities: [{ type: String }],
    status: { type: String, enum: Object.values(LmpcStatus), default: LmpcStatus.APPROVED },
    mandatoryDeclarationsCompliant: { type: Boolean, default: true },
    issueDate: { type: Date, default: Date.now },
    validUntil: { type: Date, required: true },
    feeAmount: { type: Number, default: 5000 },
    challanNumber: { type: String },
    remarks: { type: String },
  },
  { timestamps: true }
);

export enum SampleTestResult {
  PASS = 'PASS',
  DEFICIENT_AVERAGE = 'DEFICIENT_AVERAGE',
  EXCESSIVE_T1 = 'EXCESSIVE_T1',
  CRITICAL_T2 = 'CRITICAL_T2',
  DECEPTIVE_PACKAGING = 'DECEPTIVE_PACKAGING',
}

export interface IPackagedCommoditySample extends Document {
  sampleId: string; // E.g., LMPC-SMP-2026-0089
  brandName: string;
  commodityType: string;
  manufacturerOrPacker: string;
  batchNumber: string;
  mfgDate: Date;
  declaredQuantity: number;
  unit: string; // g, kg, ml, L
  declaredMrp: number;
  lotSize: number;
  sampleSize: number; // E.g. 32 under Schedule II
  madLimit: number; // Maximum Allowable Deficiency
  observedWeights: number[];
  meanQuantity: number;
  standardDeviation: number;
  t1Limit: number; // Declared - MAD
  t2Limit: number; // Declared - 2 * MAD
  t1Violations: number;
  t2Violations: number;
  result: SampleTestResult;
  inspectorName: string;
  inspectorId?: string;
  inspectionLocation: string;
  district: string;
  mandatoryLabelsPresent: {
    mrp: boolean;
    netQty: boolean;
    mfgDate: boolean;
    consumerCare: boolean;
    countryOfOrigin: boolean;
  };
  seizureRecommended: boolean;
  panchnamaNumber?: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PackagedCommoditySampleSchema = new Schema<IPackagedCommoditySample>(
  {
    sampleId: { type: String, required: true, unique: true, index: true },
    brandName: { type: String, required: true },
    commodityType: { type: String, required: true },
    manufacturerOrPacker: { type: String, required: true },
    batchNumber: { type: String, required: true },
    mfgDate: { type: Date, default: Date.now },
    declaredQuantity: { type: Number, required: true },
    unit: { type: String, required: true, default: 'g' },
    declaredMrp: { type: Number, required: true },
    lotSize: { type: Number, default: 1000 },
    sampleSize: { type: Number, default: 32 },
    madLimit: { type: Number, required: true },
    observedWeights: [{ type: Number }],
    meanQuantity: { type: Number, required: true },
    standardDeviation: { type: Number, default: 0 },
    t1Limit: { type: Number, required: true },
    t2Limit: { type: Number, required: true },
    t1Violations: { type: Number, default: 0 },
    t2Violations: { type: Number, default: 0 },
    result: { type: String, enum: Object.values(SampleTestResult), default: SampleTestResult.PASS },
    inspectorName: { type: String, required: true },
    inspectorId: { type: String },
    inspectionLocation: { type: String, required: true },
    district: { type: String, required: true, default: 'Hyderabad' },
    mandatoryLabelsPresent: {
      mrp: { type: Boolean, default: true },
      netQty: { type: Boolean, default: true },
      mfgDate: { type: Boolean, default: true },
      consumerCare: { type: Boolean, default: true },
      countryOfOrigin: { type: Boolean, default: true },
    },
    seizureRecommended: { type: Boolean, default: false },
    panchnamaNumber: { type: String },
    remarks: { type: String },
  },
  { timestamps: true }
);

export const LmpcRegistration =
  mongoose.models.LmpcRegistration ||
  mongoose.model<ILmpcRegistration>('LmpcRegistration', LmpcRegistrationSchema);

export const PackagedCommoditySample =
  mongoose.models.PackagedCommoditySample ||
  mongoose.model<IPackagedCommoditySample>('PackagedCommoditySample', PackagedCommoditySampleSchema);
