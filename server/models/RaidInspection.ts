import mongoose, { Document, Schema } from 'mongoose';

export enum RaidStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED_CLEAN = 'COMPLETED_CLEAN',
  VIOLATIONS_FOUND_SEIZED = 'VIOLATIONS_FOUND_SEIZED',
}

export enum PremiseType {
  MANDI_GRAIN_MARKET = 'MANDI_GRAIN_MARKET',
  PETROL_PUMP = 'PETROL_PUMP',
  JEWELLERY_ESTABLISHMENT = 'JEWELLERY_ESTABLISHMENT',
  SUPERMARKET = 'SUPERMARKET',
  WEIGHBRIDGE_HUB = 'WEIGHBRIDGE_HUB',
  LPG_BOTTLING = 'LPG_BOTTLING',
}

export interface IRaidInspection extends Document {
  raidCode: string; // E.g., RAID-TS-2026-0042
  squadName: string;
  squadLeader: string;
  targetBusinessName: string;
  proprietorName: string;
  location: string;
  district: string;
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
  };
  premiseType: PremiseType;
  inspectionDate: Date;
  status: RaidStatus;
  allegedViolations: string[];
  seizureMade: boolean;
  panchnamaNumber?: string;
  summary?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RaidInspectionSchema = new Schema<IRaidInspection>(
  {
    raidCode: { type: String, required: true, unique: true, index: true },
    squadName: { type: String, required: true },
    squadLeader: { type: String, required: true },
    targetBusinessName: { type: String, required: true },
    proprietorName: { type: String, required: true },
    location: { type: String, required: true },
    district: { type: String, required: true, default: 'Hyderabad' },
    gpsCoordinates: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    premiseType: { type: String, enum: Object.values(PremiseType), required: true },
    inspectionDate: { type: Date, default: Date.now },
    status: { type: String, enum: Object.values(RaidStatus), default: RaidStatus.PLANNED },
    allegedViolations: [{ type: String }],
    seizureMade: { type: Boolean, default: false },
    panchnamaNumber: { type: String },
    summary: { type: String },
  },
  { timestamps: true }
);

export enum CompoundingStatus {
  ELIGIBLE_FOR_COMPOUNDING = 'ELIGIBLE_FOR_COMPOUNDING',
  COMPOUNDED = 'COMPOUNDED',
  NOT_COMPOUNDABLE = 'NOT_COMPOUNDABLE',
  PROSECUTION_FILED_IN_COURT = 'PROSECUTION_FILED_IN_COURT',
}

export interface ISeizureMemo extends Document {
  panchnamaNumber: string; // E.g., PANCHNAMA-HYD-2026-0019
  raidCode?: string;
  inspectionDate: Date;
  establishmentName: string;
  address: string;
  district: string;
  accusedPersonName: string;
  accusedRole: string;
  panchas: Array<{
    name: string;
    age: number;
    occupation: string;
    address: string;
    phone: string;
  }>;
  seizedItems: Array<{
    serialNumber: number;
    description: string;
    quantity: number;
    identificationMarks: string;
    reasonForSeizure: string;
    custodyMalkhanaBoxNumber: string;
  }>;
  statutorySections: string[];
  custodyLocation: string;
  compoundingStatus: CompoundingStatus;
  compoundingFeeAmount: number;
  challanNumber?: string;
  courtCaseDetails?: {
    courtName: string;
    ccOrFirNumber: string;
    hearingDate: Date;
    status: string;
  };
  investigatingOfficerName: string;
  officerDigitalSignatureHash: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SeizureMemoSchema = new Schema<ISeizureMemo>(
  {
    panchnamaNumber: { type: String, required: true, unique: true, index: true },
    raidCode: { type: String },
    inspectionDate: { type: Date, default: Date.now },
    establishmentName: { type: String, required: true },
    address: { type: String, required: true },
    district: { type: String, required: true, default: 'Hyderabad' },
    accusedPersonName: { type: String, required: true },
    accusedRole: { type: String, required: true },
    panchas: [
      {
        name: { type: String, required: true },
        age: { type: Number, required: true },
        occupation: { type: String, required: true },
        address: { type: String, required: true },
        phone: { type: String, required: true },
      },
    ],
    seizedItems: [
      {
        serialNumber: { type: Number, required: true },
        description: { type: String, required: true },
        quantity: { type: Number, default: 1 },
        identificationMarks: { type: String, required: true },
        reasonForSeizure: { type: String, required: true },
        custodyMalkhanaBoxNumber: { type: String, required: true },
      },
    ],
    statutorySections: [{ type: String }],
    custodyLocation: {
      type: String,
      default: 'Central Legal Metrology Malkhana Vault, Hyderabad District Headquarters',
    },
    compoundingStatus: {
      type: String,
      enum: Object.values(CompoundingStatus),
      default: CompoundingStatus.ELIGIBLE_FOR_COMPOUNDING,
    },
    compoundingFeeAmount: { type: Number, default: 25000 },
    challanNumber: { type: String },
    courtCaseDetails: {
      courtName: { type: String },
      ccOrFirNumber: { type: String },
      hearingDate: { type: Date },
      status: { type: String },
    },
    investigatingOfficerName: { type: String, required: true },
    officerDigitalSignatureHash: { type: String, required: true },
    remarks: { type: String },
  },
  { timestamps: true }
);

export const RaidInspection =
  mongoose.models.RaidInspection ||
  mongoose.model<IRaidInspection>('RaidInspection', RaidInspectionSchema);

export const SeizureMemo =
  mongoose.models.SeizureMemo || mongoose.model<ISeizureMemo>('SeizureMemo', SeizureMemoSchema);
