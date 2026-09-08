import bcrypt from 'bcryptjs';
import { User, UserRole } from './models/User';
import { Instrument, InstrumentStatus } from './models/Instrument';
import { Application, ApplicationStatus } from './models/Application';
import { Certificate, CertificateStatus } from './models/Certificate';
import { Verification } from './models/Verification';
import { StateConfiguration } from './models/StateConfiguration';
import { AuditLog } from './models/AuditLog';
import { SealInventory, SealStatus, SealType } from './models/SealInventory';
import { Grievance, GrievanceStatus } from './models/Grievance';
import { License, LicenseType, LicenseStatus, ModelApproval, ModelApprovalStatus } from './models/Licensing';
import { StandardWeight, WorkingStandardStatus } from './models/StandardWeights';
import { TreasuryChallan, ChallanStatus, PaymentMethod } from './models/TreasuryChallan';
import { DispatchNotification, NotificationChannel, DispatchTrigger, DispatchStatus } from './models/DispatchNotification';
import {
  LmpcRegistration,
  PackagedCommoditySample,
  LmpcApplicantType,
  LmpcStatus,
  SampleTestResult,
} from './models/PackagedCommodity';
import {
  RaidInspection,
  SeizureMemo,
  RaidStatus,
  PremiseType,
  CompoundingStatus,
} from './models/RaidInspection';
import {
  Weighbridge,
  WeighbridgeTransaction,
  WeighbridgeStatus,
} from './models/WeighbridgeTelemetry';
import { generateCertificateHash } from './utils/crypto';

export async function seedDatabase(force = false): Promise<void> {
  const userCount = await User.countDocuments();
  if (userCount > 0 && !force) {
    console.log('[Seed] User database already seeded. Checking Phase 7-11 data...');
    await seedPhase7And8();
    await seedPhase9To11();
    return;
  }

  console.log('[Seed] Seeding database with required users, instruments, and applications...');

  if (force) {
    await User.deleteMany({});
    await Instrument.deleteMany({});
    await Application.deleteMany({});
    await Certificate.deleteMany({});
    await Verification.deleteMany({});
    await StateConfiguration.deleteMany({});
    await AuditLog.deleteMany({});
    await SealInventory.deleteMany({});
    await Grievance.deleteMany({});
    await License.deleteMany({});
    await ModelApproval.deleteMany({});
    await StandardWeight.deleteMany({});
    await TreasuryChallan.deleteMany({});
    await DispatchNotification.deleteMany({});
  }

  const defaultPassword = 'Password123!';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(defaultPassword, salt);

  // 1. Create Users
  // 1 ADMIN
  const admin = await User.create({
    name: 'Telangana Admin',
    email: 'admin@metriq.demo',
    phone: '98480 12345',
    passwordHash,
    role: UserRole.ADMIN,
    state: 'Telangana',
    district: 'Hyderabad',
    designation: 'State Metrology Director',
    isActive: true,
  });

  // 1 BACK_OFFICE
  const backOffice = await User.create({
    name: 'Officer S. Rao',
    email: 'office@metriq.demo',
    phone: '98480 23456',
    passwordHash,
    role: UserRole.BACK_OFFICE,
    state: 'Telangana',
    district: 'Hyderabad',
    designation: 'Senior Scrutiny Officer',
    isActive: true,
  });

  // 2 LMOs
  const lmo1 = await User.create({
    name: 'Officer R. Kumar',
    email: 'lmo@metriq.demo',
    phone: '98480 34567',
    passwordHash,
    role: UserRole.LMO,
    state: 'Telangana',
    district: 'Hyderabad',
    designation: 'Legal Metrology Officer (LMO - Circle 1)',
    isActive: true,
  });

  const lmo2 = await User.create({
    name: 'Officer V. Rao',
    email: 'lmo2@metriq.demo',
    phone: '98480 45678',
    passwordHash,
    role: UserRole.LMO,
    state: 'Telangana',
    district: 'Warangal',
    designation: 'Legal Metrology Officer (LMO - Circle 2)',
    isActive: true,
  });

  // 2 VERIFICATION_OFFICERs (also covers Inspection Officer persona)
  const vo1 = await User.create({
    name: 'Officer A. Mehta',
    email: 'inspection@metriq.demo',
    phone: '98480 56789',
    passwordHash,
    role: UserRole.VERIFICATION_OFFICER,
    state: 'Telangana',
    district: 'Hyderabad',
    designation: 'Field Verification & Inspection Officer',
    isActive: true,
  });

  const vo2 = await User.create({
    name: 'Officer K. Reddy',
    email: 'vo2@metriq.demo',
    phone: '98480 67890',
    passwordHash,
    role: UserRole.VERIFICATION_OFFICER,
    state: 'Telangana',
    district: 'Nizamabad',
    designation: 'Assistant Verification Inspector',
    isActive: true,
  });

  // 3 OWNERS
  const owner1 = await User.create({
    name: 'A. Sharma',
    email: 'owner@metriq.demo',
    phone: '98765 43210',
    passwordHash,
    role: UserRole.OWNER,
    state: 'Telangana',
    district: 'Hyderabad',
    businessName: 'User Login',
    isActive: true,
  });

  const owner2 = await User.create({
    name: 'P. Venkat',
    email: 'venkat@retail.demo',
    phone: '98765 11223',
    passwordHash,
    role: UserRole.OWNER,
    state: 'Telangana',
    district: 'Hyderabad',
    businessName: 'Charminar Agro Foods Pvt. Ltd.',
    isActive: true,
  });

  const owner3 = await User.create({
    name: 'R. K. Gupta',
    email: 'gupta@logistics.demo',
    phone: '98765 33445',
    passwordHash,
    role: UserRole.OWNER,
    state: 'Telangana',
    district: 'Secunderabad',
    businessName: 'Deccan Cargo Terminal',
    isActive: true,
  });

  // 2. State Configurations
  await StateConfiguration.create({
    state: 'Telangana',
    fees: { initialVerification: 250, periodicVerification: 200, reVerification: 150, lateFee: 50 },
    verificationRules: {
      standardAccuracyTolerancePercent: 0.5,
      allowFieldCorrection: true,
      requireOcrValidation: true,
    },
    requiredDocuments: [
      'Purchase document',
      'Previous certificate',
      'Instrument photograph',
      'Ownership / business document',
    ],
    workflowSettings: { workflowType: 'Standard', requiresScrutiny: true, autoAssign: false },
    verificationFrequencyMonths: 12,
    active: true,
    isDemo: true,
  });

  await StateConfiguration.create({
    state: 'Andhra Pradesh',
    fees: { initialVerification: 300, periodicVerification: 220, reVerification: 180, lateFee: 60 },
    verificationRules: {
      standardAccuracyTolerancePercent: 0.5,
      allowFieldCorrection: true,
      requireOcrValidation: false,
    },
    requiredDocuments: ['Purchase document', 'Previous certificate', 'Instrument photograph'],
    workflowSettings: { workflowType: 'Standard', requiresScrutiny: true, autoAssign: false },
    verificationFrequencyMonths: 12,
    active: true,
    isDemo: true,
  });

  // 3. Instruments
  const inst1 = await Instrument.create({
    instrumentId: 'INS-HYD-0001',
    type: 'Electronic Weighing Scale',
    manufacturer: 'ABC Weigh Systems Pvt. Ltd.',
    model: 'EWS-300',
    serialNumber: 'EWS300-98231',
    capacity: '300 kg',
    accuracyClass: 'Class III',
    owner: owner1._id,
    ownerName: owner1.businessName,
    state: 'Telangana',
    district: 'Hyderabad',
    location: '12, Market Road, Hyderabad',
    status: InstrumentStatus.VERIFIED,
    certificateNumber: 'LM-HYD-2026-000184',
    validUntil: new Date('2027-08-12'),
    lastVerifiedAt: new Date('2026-08-12'),
  });

  const inst2 = await Instrument.create({
    instrumentId: 'INS-HYD-0002',
    type: 'Platform Scale',
    manufacturer: 'Precision Weigh India',
    model: 'PS-1000',
    serialNumber: 'PS1K-45102',
    capacity: '1000 kg',
    accuracyClass: 'Class III',
    owner: owner1._id,
    ownerName: owner1.businessName,
    state: 'Telangana',
    district: 'Hyderabad',
    location: 'Warehouse B, Sanathnagar, Hyderabad',
    status: InstrumentStatus.VERIFIED,
    certificateNumber: 'LM-HYD-2026-000185',
    validUntil: new Date('2027-04-10'),
    lastVerifiedAt: new Date('2026-04-10'),
  });

  const inst3 = await Instrument.create({
    instrumentId: 'INS-HYD-0003',
    type: 'Mechanical Weighing Scale',
    manufacturer: 'Bharat Scales Co.',
    model: 'MWS-50',
    serialNumber: 'MWS50-77124',
    capacity: '50 kg',
    accuracyClass: 'Class III',
    owner: owner1._id,
    ownerName: owner1.businessName,
    state: 'Telangana',
    district: 'Hyderabad',
    location: 'Shop 4, Begum Bazar, Hyderabad',
    status: InstrumentStatus.EXPIRED,
    certificateNumber: 'LM-HYD-2025-000912',
    validUntil: new Date('2026-01-15'),
    lastVerifiedAt: new Date('2025-01-15'),
  });

  const inst4 = await Instrument.create({
    instrumentId: 'INS-HYD-0004',
    type: 'Retail Counter Scale',
    manufacturer: 'Zenith Weigh Tech',
    model: 'ZCT-30',
    serialNumber: 'ZCT30-11892',
    capacity: '30 kg',
    accuracyClass: 'Class II',
    owner: owner2._id,
    ownerName: owner2.businessName,
    state: 'Telangana',
    district: 'Hyderabad',
    location: 'Laad Bazar, Hyderabad',
    status: InstrumentStatus.VERIFIED,
    certificateNumber: 'LM-HYD-2026-000186',
    validUntil: new Date('2027-06-20'),
  });

  const inst5 = await Instrument.create({
    instrumentId: 'INS-HYD-0005',
    type: 'Weighbridge',
    manufacturer: 'Deccan Heavy Weigh Systems',
    model: 'WB-60T',
    serialNumber: 'WB60T-00412',
    capacity: '60 Tonne',
    accuracyClass: 'Class III',
    owner: owner3._id,
    ownerName: owner3.businessName,
    state: 'Telangana',
    district: 'Secunderabad',
    location: 'Cargo Yard 3, Secunderabad',
    status: InstrumentStatus.FLAGGED,
    certificateNumber: 'LM-HYD-2025-000788',
    validUntil: new Date('2026-11-30'),
  });

  // 4. Primary SIH Demo Application
  const app1 = await Application.create({
    applicationId: 'APP-HYD-2026-001245',
    owner: owner1._id,
    applicantName: owner1.name,
    businessName: owner1.businessName,
    mobile: owner1.phone,
    email: owner1.email,
    instrument: inst1._id,
    instrumentDetails: {
      type: 'Electronic Weighing Instrument',
      manufacturer: 'ABC Weigh Systems Pvt. Ltd.',
      model: 'EWS-300',
      serialNumber: 'EWS300-98231',
      capacity: '300 kg',
      accuracyClass: 'Class III',
    },
    verificationType: 'Periodic Verification',
    state: 'Telangana',
    district: 'Hyderabad',
    inspectionLocation: '12, Market Road, Hyderabad',
    preferredDate: '2026-08-18',
    priority: 'High',
    status: ApplicationStatus.SCHEDULED,
    assignedOfficer: lmo1._id,
    assignedOfficerName: lmo1.name,
    scheduledDate: '2026-08-18',
    scheduledSlot: '10:30 AM',
  });

  // Secondary Applications for various stages
  await Application.create({
    applicationId: 'APP-HYD-2026-001246',
    owner: owner2._id,
    applicantName: owner2.name,
    businessName: owner2.businessName,
    mobile: owner2.phone,
    email: owner2.email,
    instrument: inst4._id,
    instrumentDetails: {
      type: 'Retail Counter Scale',
      manufacturer: 'Zenith Weigh Tech',
      model: 'ZCT-30',
      serialNumber: 'ZCT30-11892',
      capacity: '30 kg',
      accuracyClass: 'Class II',
    },
    verificationType: 'Initial Verification',
    state: 'Telangana',
    district: 'Hyderabad',
    inspectionLocation: 'Laad Bazar, Hyderabad',
    priority: 'Normal',
    status: ApplicationStatus.SUBMITTED,
  });

  await Application.create({
    applicationId: 'APP-HYD-2026-001247',
    owner: owner3._id,
    applicantName: owner3.name,
    businessName: owner3.businessName,
    mobile: owner3.phone,
    email: owner3.email,
    instrument: inst5._id,
    instrumentDetails: {
      type: 'Weighbridge',
      manufacturer: 'Deccan Heavy Weigh Systems',
      model: 'WB-60T',
      serialNumber: 'WB60T-00412',
      capacity: '60 Tonne',
      accuracyClass: 'Class III',
    },
    verificationType: 'Re-verification',
    state: 'Telangana',
    district: 'Secunderabad',
    inspectionLocation: 'Cargo Yard 3, Secunderabad',
    priority: 'High',
    status: ApplicationStatus.UNDER_SCRUTINY,
  });

  // 5. Verification & Canonical Certificate LM-HYD-2026-000184
  const canonicalData = {
    certificateNumber: 'LM-HYD-2026-000184',
    instrumentId: inst1.instrumentId,
    type: inst1.type,
    manufacturer: inst1.manufacturer,
    model: inst1.model,
    serialNumber: inst1.serialNumber,
    capacity: inst1.capacity,
    ownerName: owner1.businessName!,
    location: inst1.location,
    verificationDate: '12 Aug 2026',
    validUntil: '11 Aug 2027',
    officerName: lmo1.name,
  };

  const verificationHash = generateCertificateHash(canonicalData);
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const qrUrl = `${frontendUrl}/verify/LM-HYD-2026-000184`;
  const qrToken = Buffer.from(JSON.stringify({ c: 'LM-HYD-2026-000184', h: verificationHash.slice(0, 16) })).toString('base64');

  const verification1 = await Verification.create({
    application: app1._id,
    applicationId: app1.applicationId,
    instrument: inst1._id,
    instrumentId: inst1.instrumentId,
    officer: lmo1._id,
    officerName: lmo1.name,
    checklist: {
      physicalCondition: true,
      identification: true,
      sealCondition: true,
      displayFunction: true,
    },
    tests: [
      { testNumber: 1, standardWeight: 10, observedValue: 10.01, error: 0.01, allowedTolerance: 0.05, result: 'PASS' },
      { testNumber: 2, standardWeight: 20, observedValue: 20.02, error: 0.02, allowedTolerance: 0.1, result: 'PASS' },
      { testNumber: 3, standardWeight: 50, observedValue: 50.01, error: 0.01, allowedTolerance: 0.25, result: 'PASS' },
    ],
    result: 'PASS',
    remarks: 'Verification completed. Standard physical inspection and accuracy tolerances satisfied.',
    verificationHash,
    isOfflineSubmission: false,
    completedAt: new Date('2026-08-12T10:30:00Z'),
    certificateNumber: 'LM-HYD-2026-000184',
  });

  const cert1 = await Certificate.create({
    certificateNumber: 'LM-HYD-2026-000184',
    instrument: inst1._id,
    instrumentId: inst1.instrumentId,
    instrumentType: inst1.type,
    manufacturer: inst1.manufacturer,
    model: inst1.model,
    serialNumber: inst1.serialNumber,
    capacity: inst1.capacity,
    accuracyClass: inst1.accuracyClass,
    application: app1._id,
    applicationId: app1.applicationId,
    verification: verification1._id,
    owner: owner1._id,
    ownerName: owner1.businessName,
    location: inst1.location,
    state: 'Telangana',
    district: 'Hyderabad',
    officer: lmo1._id,
    officerName: lmo1.name,
    verificationDate: '12 Aug 2026',
    issuedAt: new Date('2026-08-12T10:30:00Z'),
    validUntil: new Date('2027-08-11T23:59:59Z'),
    validUntilFormatted: '11 Aug 2027',
    status: CertificateStatus.VALID,
    verificationHash,
    qrToken,
    qrUrl,
    digitalSignatureMetadata: {
      algorithm: 'SHA-256',
      signedBy: lmo1.email,
      officerName: lmo1.name,
      timestamp: new Date('2026-08-12T10:30:00Z'),
      hash: verificationHash,
    },
  });

  // Link back
  inst1.certificateNumber = cert1.certificateNumber;
  await inst1.save();

  // 6. Initial Audit Logs
  await AuditLog.create([
    {
      action: 'SYSTEM_BOOTSTRAP',
      actorName: 'SYSTEM',
      actorRole: 'SYSTEM',
      entityType: 'SYSTEM',
      entityId: 'INIT',
      detail: 'METRIQ digital registry initialized with state configuration and cryptographic validation engine.',
      timestamp: new Date('2026-08-01T09:00:00Z'),
    },
    {
      action: 'APPLICATION_SUBMITTED',
      actor: owner1._id,
      actorName: owner1.name,
      actorRole: 'OWNER',
      entityType: 'APPLICATION',
      entityId: app1.applicationId,
      detail: `Application ${app1.applicationId} submitted by ${owner1.businessName}.`,
      timestamp: new Date('2026-08-10T11:20:00Z'),
    },
    {
      action: 'APPLICATION_APPROVED',
      actor: backOffice._id,
      actorName: backOffice.name,
      actorRole: 'BACK_OFFICE',
      entityType: 'APPLICATION',
      entityId: app1.applicationId,
      detail: `Application ${app1.applicationId} approved following scrutiny by ${backOffice.name}.`,
      timestamp: new Date('2026-08-11T14:15:00Z'),
    },
    {
      action: 'OFFICER_ASSIGNED',
      actor: backOffice._id,
      actorName: backOffice.name,
      actorRole: 'BACK_OFFICE',
      entityType: 'APPLICATION',
      entityId: app1.applicationId,
      detail: `Officer ${lmo1.name} assigned to verification for ${app1.applicationId}.`,
      timestamp: new Date('2026-08-11T14:30:00Z'),
    },
    {
      action: 'VERIFICATION_SCHEDULED',
      actor: backOffice._id,
      actorName: backOffice.name,
      actorRole: 'BACK_OFFICE',
      entityType: 'APPLICATION',
      entityId: app1.applicationId,
      detail: `Inspection scheduled for 18 Aug 2026, 10:30 AM with ${lmo1.name}.`,
      timestamp: new Date('2026-08-11T15:00:00Z'),
    },
    {
      action: 'CERTIFICATE_GENERATED',
      actor: lmo1._id,
      actorName: lmo1.name,
      actorRole: 'LMO',
      entityType: 'CERTIFICATE',
      entityId: cert1.certificateNumber,
      detail: `Certificate ${cert1.certificateNumber} generated for instrument ${inst1.instrumentId}.`,
      timestamp: new Date('2026-08-12T10:30:00Z'),
    },
  ]);

  // Seed Seals Inventory
  await SealInventory.create([
    {
      sealNumber: 'TS-LM-2026-00101',
      sealType: SealType.LEAD_WIRE,
      batchNumber: 'BATCH-2026-TEL-01',
      allocatedTo: lmo1._id,
      allocatedOfficerName: lmo1.name,
      status: SealStatus.AFFIXED,
      affixedInstrumentId: inst1.instrumentId,
      affixedCertificateNumber: cert1.certificateNumber,
      affixedMerchantName: inst1.ownerName,
      affixedLocation: 'Begum Bazaar, Hyderabad',
      affixedDate: new Date('2026-08-12T10:25:00Z'),
      auditHistory: [
        { action: 'BATCH_ALLOCATED', actorName: 'State Director', timestamp: new Date('2026-08-01') },
        { action: 'AFFIXED', actorName: lmo1.name, timestamp: new Date('2026-08-12T10:25:00Z'), notes: 'Affixed with lead clamp tool' },
      ],
    },
    {
      sealNumber: 'TS-LM-2026-00102',
      sealType: SealType.HOLOGRAPHIC_VOID,
      batchNumber: 'BATCH-2026-TEL-01',
      allocatedTo: lmo1._id,
      allocatedOfficerName: lmo1.name,
      status: SealStatus.AVAILABLE,
      auditHistory: [
        { action: 'BATCH_ALLOCATED', actorName: 'State Director', timestamp: new Date('2026-08-01') },
      ],
    },
    {
      sealNumber: 'TS-LM-2026-00103',
      sealType: SealType.LEAD_WIRE,
      batchNumber: 'BATCH-2026-TEL-01',
      allocatedTo: lmo1._id,
      allocatedOfficerName: lmo1.name,
      status: SealStatus.AVAILABLE,
      auditHistory: [
        { action: 'BATCH_ALLOCATED', actorName: 'State Director', timestamp: new Date('2026-08-01') },
      ],
    },
    {
      sealNumber: 'TS-LM-2026-00104',
      sealType: SealType.ELECTRONIC_RFID,
      batchNumber: 'BATCH-2026-TEL-02',
      allocatedTo: lmo1._id,
      allocatedOfficerName: lmo1.name,
      status: SealStatus.AVAILABLE,
      auditHistory: [
        { action: 'BATCH_ALLOCATED', actorName: 'State Director', timestamp: new Date('2026-08-01') },
      ],
    },
    {
      sealNumber: 'TS-LM-2026-00099',
      sealType: SealType.LEAD_WIRE,
      batchNumber: 'BATCH-2026-TEL-01',
      allocatedTo: lmo1._id,
      allocatedOfficerName: lmo1.name,
      status: SealStatus.FLAGGED_TAMPERED,
      affixedInstrumentId: 'EWS-300-HYD-002',
      affixedMerchantName: 'Deccan Grocers Pvt Ltd',
      auditHistory: [
        { action: 'TAMPER_REPORTED', actorName: 'Enforcement Squad A', timestamp: new Date('2026-08-14T09:00:00Z'), notes: 'Cut wire seal detected' },
      ],
    },
  ]);

  // Seed Citizen Grievances
  await Grievance.create([
    {
      grievanceId: 'GRV-HYD-2026-1042',
      violationType: 'Short-Weighing / Fraudulent Measurement',
      description: 'Purchased 5kg basmati rice bag weighed on digital scale; verified net weight on reference scale was only 4.65kg. Suspected calibration skew.',
      merchantName: 'Sri Venkateshwara Traders',
      location: 'Begum Bazaar, Hyderabad',
      instrumentId: inst1.instrumentId,
      certificateNumber: cert1.certificateNumber,
      reporterName: 'K. Ramesh (Consumer)',
      reporterPhone: '98490 55432',
      status: GrievanceStatus.INSPECTOR_DISPATCHED,
      assignedOfficer: lmo1._id,
      assignedOfficerName: lmo1.name,
      officerRemarks: 'Enforcement team scheduled for surprise inspection with 5kg Class M1 standard weight.',
    },
    {
      grievanceId: 'GRV-HYD-2026-1043',
      violationType: 'Broken / Missing Official Lead Seal',
      description: 'Physical lead seal wire dangling loose at rear calibration port of scale at counter 2.',
      merchantName: 'Royal Supermarket',
      location: 'Ameerpet X Roads, Hyderabad',
      status: GrievanceStatus.SUBMITTED,
      reporterName: 'Citizen Informant',
    },
    {
      grievanceId: 'GRV-HYD-2026-1044',
      violationType: 'Expired Verification Certificate in Commercial Use',
      description: 'Sticker displayed on petrol dispensing unit expired in May 2026, still operational.',
      merchantName: 'Highway Fuel Station',
      location: 'Kukatpally, Hyderabad',
      status: GrievanceStatus.PENALTY_COMPOUNDED,
      statutorySection: 'Section 30, Legal Metrology Act, 2009',
      penaltyAmount: 15000,
      assignedOfficerName: 'Inspector D. Sharma',
      officerRemarks: 'Compounding fine of ₹15,000 levied and immediate re-verification ordered under receipt #COMP-2026-881.',
      resolutionDate: new Date('2026-08-15'),
    },
  ]);

  // Seed Phase 7 & 8 Datasets
  await seedPhase7And8();
  await seedPhase9To11();

  console.log('[Seed] Database successfully seeded with demo accounts:');
  console.log('  Admin: admin@metriq.demo / Password123!');
  console.log('  Back Office: office@metriq.demo / Password123!');
  console.log('  LMO: lmo@metriq.demo / Password123!');
  console.log('  Verification/Inspection: inspection@metriq.demo / Password123!');
  console.log('  Owner: owner@metriq.demo / Password123!');
}

export async function seedPhase7And8(): Promise<void> {
  // Check if licenses exist
  const licCount = await License.countDocuments();
  if (licCount === 0) {
    console.log('[Seed] Seeding Phase 7: Licenses, Model Approvals, and Working Standards...');
    
    await License.create([
      {
        licenseNumber: 'TS-LM-MFG-2026-0001',
        licenseType: LicenseType.MANUFACTURER,
        businessName: 'Avery India Metrology Instruments Pvt Ltd',
        proprietorName: 'Rajeshwar Singhania',
        panNumber: 'AAACA1234F',
        gstin: '36AAACA1234F1Z5',
        address: 'Plot 44, Industrial Estate, Sanathnagar, Hyderabad',
        district: 'Hyderabad',
        state: 'Telangana',
        workshopAddress: 'Plot 44-46, Industrial Development Area, Hyderabad',
        competentTechnicians: ['B. Satyanarayana (Sr Metrologist)', 'P. Anji Reddy (Electronics Tech)'],
        securityDeposit: 50000,
        authorizedCategories: ['Electronic Weighing Machines (Class II & Class III)', 'Heavy Weighbridges (Class IV)'],
        status: LicenseStatus.ACTIVE,
        issueDate: new Date('2026-01-10'),
        validUntil: new Date('2027-01-09'),
        inspectedBy: 'Deputy Controller, Legal Metrology (HQ)',
        remarks: 'Workshop infrastructure adheres to Schedule V of Legal Metrology (General) Rules, 2011.',
      },
      {
        licenseNumber: 'TS-LM-MFG-2026-0002',
        licenseType: LicenseType.MANUFACTURER,
        businessName: 'Essae-Teraoka Precision Scales Pvt Ltd',
        proprietorName: 'M. K. Murthy',
        panNumber: 'AACCE9988D',
        gstin: '36AACCE9988D1Z2',
        address: 'Electronic Complex, Kushaiguda, Secunderabad',
        district: 'Hyderabad',
        state: 'Telangana',
        workshopAddress: 'Electronic Complex, Kushaiguda, Hyderabad',
        competentTechnicians: ['R. Venkat (Lead Calibration Engineer)'],
        securityDeposit: 50000,
        authorizedCategories: ['Electronic Retail Counter Scales', 'Precision Analytical Balances (Class I & II)'],
        status: LicenseStatus.ACTIVE,
        issueDate: new Date('2026-02-01'),
        validUntil: new Date('2027-01-31'),
        inspectedBy: 'LMO Zone IV',
      },
      {
        licenseNumber: 'TS-LM-REP-2026-0015',
        licenseType: LicenseType.REPAIRER,
        businessName: 'Deccan Scale Repair & Servicing Works',
        proprietorName: 'Syed Abdul Majeed',
        panNumber: 'AQZPM4567K',
        address: 'Shop 12, Osmangunj, Hyderabad',
        district: 'Hyderabad',
        state: 'Telangana',
        workshopAddress: 'Osmangunj Commercial Yard, Hyderabad',
        competentTechnicians: ['Syed Abdul Majeed (Certified Repairer)'],
        securityDeposit: 25000,
        authorizedCategories: ['Commercial Weighing Instruments (Counter & Platform)', 'Cast Iron Weights Reconditioning'],
        status: LicenseStatus.ACTIVE,
        issueDate: new Date('2026-03-15'),
        validUntil: new Date('2027-03-14'),
        inspectedBy: 'Assistant Controller, Hyderabad District',
      },
      {
        licenseNumber: 'TS-LM-DLR-2026-0089',
        licenseType: LicenseType.DEALER,
        businessName: 'Telangana Weighing Solutions & Retail Dist.',
        proprietorName: 'C. Hemalatha',
        panNumber: 'BKZPH8765L',
        gstin: '36BKZPH8765L1Z8',
        address: 'MG Road, Secunderabad',
        district: 'Hyderabad',
        state: 'Telangana',
        competentTechnicians: ['C. Hemalatha'],
        securityDeposit: 15000,
        authorizedCategories: ['Authorised Dealer for Avery & Essae Weighing Systems'],
        status: LicenseStatus.ACTIVE,
        issueDate: new Date('2026-04-10'),
        validUntil: new Date('2027-04-09'),
      },
    ]);

    await ModelApproval.create([
      {
        tacNumber: 'IND/09/2024/481',
        manufacturerName: 'Essae-Teraoka Precision Scales Pvt Ltd',
        brandModel: 'Essae DS-215 Electronic Weighing Scale',
        instrumentClass: 'Class III',
        maxCapacity: '30 kg',
        verificationScaleInterval: 'e = 1 g / 2 g (Dual Range)',
        loadCellSpecs: 'Single point aluminium load cell, IP65 protection',
        softwareVersionHash: 'SHA256:4a8b79e1903cf4456e7bdcfb2190f89d1bfa9824c96570c9ddf0923058a98711',
        oimlStandard: 'OIML R-76-1 (Edition 2006)',
        status: ModelApprovalStatus.APPROVED,
        approvalDate: new Date('2024-09-15'),
        validUntil: new Date('2029-09-14'),
        issuingAuthority: 'Director of Legal Metrology, Krishi Bhawan, New Delhi',
        sealingPlan: 'Lead wire seal looping through calibration switch aperture screw and motherboard chassis lock.',
      },
      {
        tacNumber: 'IND/09/2025/512',
        manufacturerName: 'Avery India Metrology Instruments Pvt Ltd',
        brandModel: 'Avery Weigh-Tronix E1010 Heavy Platform',
        instrumentClass: 'Class III',
        maxCapacity: '300 kg / 500 kg',
        verificationScaleInterval: 'e = 50 g / 100 g',
        loadCellSpecs: 'Four stainless steel shear beam load cells, summing junction box sealed',
        softwareVersionHash: 'SHA256:88fa2b417e9282361099bcda51921387dca19041fa334466ee892147aabb2154',
        oimlStandard: 'OIML R-76-1 (Edition 2006)',
        status: ModelApprovalStatus.APPROVED,
        approvalDate: new Date('2025-04-20'),
        validUntil: new Date('2030-04-19'),
        issuingAuthority: 'Director of Legal Metrology, Krishi Bhawan, New Delhi',
        sealingPlan: 'Double lead-wire through summing box cover and digital indicator calibration port.',
      },
      {
        tacNumber: 'IND/09/2025/589',
        manufacturerName: 'Avery India Metrology Instruments Pvt Ltd',
        brandModel: 'Avery BridgeMaster 60T Electronic Weighbridge',
        instrumentClass: 'Class IV',
        maxCapacity: '60 Metric Tonnes',
        verificationScaleInterval: 'e = 10 kg',
        loadCellSpecs: 'Digital compression canister load cells (IP68)',
        softwareVersionHash: 'SHA256:7739ab184ccae78261909aee1128491823ca87116524900aef78310019284fa2',
        oimlStandard: 'OIML R-76',
        status: ModelApprovalStatus.APPROVED,
        approvalDate: new Date('2025-08-11'),
        validUntil: new Date('2030-08-10'),
        issuingAuthority: 'Director of Legal Metrology, Krishi Bhawan, New Delhi',
        sealingPlan: 'Terminal enclosure padlock + lead wire seal across calibration access pin.',
      },
    ]);

    await StandardWeight.create([
      {
        kitId: 'TS-LMO-KIT-001',
        kitName: 'Working Standard Brass/Stainless Mass Standards (1mg to 10kg)',
        assignedOfficerName: 'LMO K. S. Rao',
        district: 'Hyderabad',
        accuracyClass: 'Class M1',
        standardType: 'Precision Mass Standard Box (28 pieces)',
        piecesCount: 28,
        lastCalibrationDate: new Date('2026-01-15'),
        nextCalibrationDueDate: new Date('2027-01-14'),
        calibratingLaboratory: 'Regional Reference Standards Laboratory (RRSL), Bangalore',
        calibrationCertificateNumber: 'RRSL/BLR/M1/2026/0412',
        status: WorkingStandardStatus.CALIBRATED_ACTIVE,
        calibrationHistory: [
          {
            calibratedAt: new Date('2026-01-15'),
            validUntil: new Date('2027-01-14'),
            calibratedBy: 'RRSL Bangalore',
            certificateNumber: 'RRSL/BLR/M1/2026/0412',
            maxPermissibleErrorMg: 10,
            measuredDeviationMg: 1.4,
            passed: true,
            remarks: 'Calibrated against secondary standard E2 mass set; all weights well within MPE.',
          },
        ],
      },
      {
        kitId: 'TS-LMO-KIT-002',
        kitName: 'Cast Iron Heavy Working Standard Weights (20kg x 25 pcs - 500kg total)',
        assignedOfficerName: 'Inspector D. Sharma (Flying Squad)',
        district: 'Ranga Reddy',
        accuracyClass: 'Class M2',
        standardType: 'Rectangular Bar Weights with Grip Cavity',
        piecesCount: 25,
        lastCalibrationDate: new Date('2025-09-10'),
        nextCalibrationDueDate: new Date('2026-09-09'),
        calibratingLaboratory: 'State Standards Laboratory, Legal Metrology Bhavan, Hyderabad',
        calibrationCertificateNumber: 'SSL/HYD/M2/2025/1190',
        status: WorkingStandardStatus.DUE_SOON,
        calibrationHistory: [
          {
            calibratedAt: new Date('2025-09-10'),
            validUntil: new Date('2026-09-09'),
            calibratedBy: 'State Standards Laboratory Hyderabad',
            certificateNumber: 'SSL/HYD/M2/2025/1190',
            maxPermissibleErrorMg: 600,
            measuredDeviationMg: 120,
            passed: true,
            remarks: 'Annual re-calibration due within 30 days.',
          },
        ],
      },
      {
        kitId: 'TS-LMO-KIT-003',
        kitName: 'Standard Conical Capacity Measures (5L, 10L, 20L)',
        assignedOfficerName: 'LMO P. V. Ramana',
        district: 'Hyderabad North',
        accuracyClass: 'Working Standard Measure',
        standardType: 'Brass Conical Measure for Dispensing Pumps',
        piecesCount: 3,
        lastCalibrationDate: new Date('2026-03-01'),
        nextCalibrationDueDate: new Date('2027-02-28'),
        calibratingLaboratory: 'Regional Reference Standards Laboratory (RRSL), Bangalore',
        calibrationCertificateNumber: 'RRSL/BLR/VOL/2026/092',
        status: WorkingStandardStatus.CALIBRATED_ACTIVE,
        calibrationHistory: [
          {
            calibratedAt: new Date('2026-03-01'),
            validUntil: new Date('2027-02-28'),
            calibratedBy: 'RRSL Bangalore',
            certificateNumber: 'RRSL/BLR/VOL/2026/092',
            maxPermissibleErrorMg: 25,
            measuredDeviationMg: 4.8,
            passed: true,
            remarks: 'Used for fuel dispensing pump accuracy checks.',
          },
        ],
      },
    ]);
  }

  // Check if Treasury Challans exist
  const challanCount = await TreasuryChallan.countDocuments();
  if (challanCount === 0) {
    console.log('[Seed] Seeding Phase 8: Treasury Challans and Multi-channel Dispatch notifications...');
    
    await TreasuryChallan.create([
      {
        challanNumber: 'CHL-IFMIS-2026-98124',
        applicationId: 'APP-2026-000184',
        instrumentId: 'EWS-300-HYD-001',
        applicantName: 'Sri Venkateshwara Traders',
        businessName: 'Sri Venkateshwara Traders (Retail & Wholesale Groceries)',
        district: 'Hyderabad',
        state: 'Telangana',
        majorHead: '0435 - Other Administrative Services',
        subHead: '101 - Fees for Stamping Weights & Measures',
        ddoCode: '25000301001 (Assistant Controller, Legal Metrology)',
        baseFee: 450,
        gstAmount: 81,
        lateFeePenalty: 0,
        totalAmount: 531,
        status: ChallanStatus.SETTLED_TREASURY,
        paymentMethod: PaymentMethod.UPI,
        transactionReference: 'TXN-UPI-982173901928',
        treasuryScrollNumber: 'SCR-2026-091823',
        paidAt: new Date('2026-08-10T14:20:00Z'),
        receiptDownloadUrl: '/api/treasury/receipt/CHL-IFMIS-2026-98124',
      },
      {
        challanNumber: 'CHL-IFMIS-2026-98125',
        applicationId: 'APP-2026-000185',
        instrumentId: 'WB-60T-HYD-001',
        applicantName: 'Deccan Agro Millers',
        businessName: 'Deccan Agro Products & Rice Mill Ltd',
        district: 'Hyderabad',
        state: 'Telangana',
        majorHead: '0435 - Other Administrative Services',
        subHead: '101 - Fees for Stamping Weights & Measures',
        ddoCode: '25000301001 (Assistant Controller, Legal Metrology)',
        baseFee: 4000,
        gstAmount: 720,
        lateFeePenalty: 0,
        totalAmount: 4720,
        status: ChallanStatus.SETTLED_TREASURY,
        paymentMethod: PaymentMethod.NET_BANKING,
        transactionReference: 'TXN-SBI-CORP-4819028',
        treasuryScrollNumber: 'SCR-2026-091824',
        paidAt: new Date('2026-08-11T11:45:00Z'),
        receiptDownloadUrl: '/api/treasury/receipt/CHL-IFMIS-2026-98125',
      },
      {
        challanNumber: 'CHL-IFMIS-2026-98126',
        applicantName: 'Balaji Kirana Store',
        businessName: 'Balaji Kirana & Provisions',
        district: 'Ranga Reddy',
        state: 'Telangana',
        majorHead: '0435 - Other Administrative Services',
        subHead: '101 - Fees for Stamping Weights & Measures',
        ddoCode: '25000301001',
        baseFee: 300,
        gstAmount: 54,
        lateFeePenalty: 150, // Late fee under Rule 14(3)
        totalAmount: 504,
        status: ChallanStatus.GENERATED,
      },
    ]);

    await DispatchNotification.create([
      {
        dispatchId: 'DSP-2026-0001',
        recipientName: 'Sri Venkateshwara Traders',
        recipientPhone: '98480 12345',
        recipientEmail: 'owner@metriq.demo',
        channel: NotificationChannel.SMS,
        trigger: DispatchTrigger.CERTIFICATE_ISSUED,
        dltTemplateId: '110716829102938',
        senderHeader: 'TS-LEGMET',
        messageBody: 'Govt of Telangana - Legal Metrology Dept: Certificate of Verification LM-HYD-2026-000184 has been issued for your Scale EWS-300-HYD-001. Valid until 09-Aug-2027. Verify at https://metriq.telangana.gov.in/verify/LM-HYD-2026-000184. Please preserve physical receipt.',
        instrumentId: 'EWS-300-HYD-001',
        certificateNumber: 'LM-HYD-2026-000184',
        status: DispatchStatus.DELIVERED,
        deliveryLatencyMs: 320,
        sentAt: new Date('2026-08-10T15:00:00Z'),
      },
      {
        dispatchId: 'DSP-2026-0002',
        recipientName: 'Sri Venkateshwara Traders',
        recipientPhone: '98480 12345',
        channel: NotificationChannel.WHATSAPP,
        trigger: DispatchTrigger.CERTIFICATE_ISSUED,
        senderHeader: 'METRIQ Official WhatsApp',
        messageBody: '⚖️ *Government of Telangana - Legal Metrology Verification Completed*\n\nDear Citizen,\nYour instrument *Essae DS-215 (EWS-300-HYD-001)* has successfully passed on-site legal verification.\n\n📄 *Certificate No:* LM-HYD-2026-000184\n🔒 *Digital Seal:* TS-LM-2026-0001 (Lead-Wire)\n📅 *Valid Until:* 09-Aug-2027\n\nTap to download official signed certificate: https://metriq.telangana.gov.in/verify/LM-HYD-2026-000184',
        instrumentId: 'EWS-300-HYD-001',
        certificateNumber: 'LM-HYD-2026-000184',
        status: DispatchStatus.DELIVERED,
        deliveryLatencyMs: 410,
        sentAt: new Date('2026-08-10T15:01:00Z'),
      },
      {
        dispatchId: 'DSP-2026-0003',
        recipientName: 'Deccan Grocers Pvt Ltd',
        recipientPhone: '98490 22334',
        recipientEmail: 'info@deccangrocers.com',
        channel: NotificationChannel.SMS,
        trigger: DispatchTrigger.STATUTORY_EXPIRY_REMINDER,
        dltTemplateId: '110716829102939',
        senderHeader: 'TS-LEGMET',
        messageBody: 'Statutory Notice under Rule 14, Legal Metrology Act, 2009: Verification for your Platform Scale EWS-300-HYD-002 expires on 15-Aug-2026. Apply for re-verification immediately on METRIQ portal to avoid compounding penalty.',
        instrumentId: 'EWS-300-HYD-002',
        status: DispatchStatus.DELIVERED,
        deliveryLatencyMs: 290,
        sentAt: new Date('2026-08-01T10:00:00Z'),
      },
      {
        dispatchId: 'DSP-2026-0004',
        recipientName: 'Highway Fuel Station',
        recipientPhone: '98480 88776',
        recipientEmail: 'contact@highwayfuel.in',
        channel: NotificationChannel.EMAIL,
        trigger: DispatchTrigger.VIOLATION_COMPOUNDED,
        subject: 'Official Notice: Compounding of Offence under Section 30',
        messageBody: 'Notice from Controller of Legal Metrology, Telangana: Compounding penalty of Rs 15,000/- has been accepted for grievance #GRV-HYD-2026-1044. Instrument must undergo re-stamping before commercial resumption.',
        status: DispatchStatus.DELIVERED,
        deliveryLatencyMs: 650,
        sentAt: new Date('2026-08-15T16:30:00Z'),
      },
    ]);
  }
}

export async function seedPhase9To11(): Promise<void> {
  // 1. Seed Phase 9: Packaged Commodities (LMPC) Registrations & Sampling Tests
  const lmpcCount = await LmpcRegistration.countDocuments();
  if (lmpcCount === 0) {
    console.log('[Seed] Seeding Phase 9: Packaged Commodities (LMPC) and Schedule II Sampling Tests...');

    await LmpcRegistration.create([
      {
        registrationNumber: 'TS-LMPC-MFG-2026-0001',
        applicantType: LmpcApplicantType.MANUFACTURER,
        companyName: 'ITC Limited - Agri-Business Division',
        brandNames: ['Aashirvaad Superior MP Atta', 'Sunfeast Dark Fantasy', 'YiPPee! Noodles'],
        authorizedPerson: 'Sanjay Mukherjee (VP Operations)',
        panNumber: 'AAACI0012E',
        gstin: '36AAACI0012E1Z8',
        email: 'regulatory@itc.in',
        phone: '+91 98480 11223',
        registeredAddress: 'ITC Kakatiya Complex, Begumpet, Hyderabad',
        warehouseAddress: 'Survey 214, Gundlapochampally Industrial Park, Medchal',
        district: 'Hyderabad',
        state: 'Telangana',
        commodities: ['Atta & Flours (1kg, 5kg, 10kg)', 'Biscuits & Bakery', 'Instant Noodles'],
        status: LmpcStatus.APPROVED,
        mandatoryDeclarationsCompliant: true,
        issueDate: new Date('2026-01-15'),
        validUntil: new Date('2029-01-14'),
        feeAmount: 5000,
        challanNumber: 'CHL-TS-0435-881290',
        remarks: 'Statutory compliance inspection passed by Controller LMPC cell.',
      },
      {
        registrationNumber: 'TS-LMPC-IMP-2026-0002',
        applicantType: LmpcApplicantType.IMPORTER,
        companyName: 'Deccan Global Gourmet Imports Pvt Ltd',
        brandNames: ['Olio Di Roma Extra Virgin Olive Oil', 'Verona Italian Durum Pasta'],
        authorizedPerson: 'M. S. Farooqi (Managing Director)',
        panNumber: 'AABCD8890K',
        gstin: '36AABCD8890K1ZP',
        email: 'customs@deccanglobal.com',
        phone: '+91 94400 44556',
        registeredAddress: 'Plot 18, Road No. 36, Jubilee Hills, Hyderabad',
        warehouseAddress: 'CFS Container Freight Station, Sanathnagar, Hyderabad',
        district: 'Hyderabad',
        state: 'Telangana',
        commodities: ['Imported Edible Oils (500ml, 1000ml)', 'Specialty Pasta', 'Confectionery'],
        status: LmpcStatus.APPROVED,
        mandatoryDeclarationsCompliant: true,
        issueDate: new Date('2026-02-01'),
        validUntil: new Date('2029-01-31'),
        feeAmount: 10000,
        challanNumber: 'CHL-TS-0435-992301',
        remarks: 'Country of origin stickers and dual-language MRP declarations verified.',
      },
      {
        registrationNumber: 'TS-LMPC-PCK-2026-0003',
        applicantType: LmpcApplicantType.PACKER,
        companyName: 'Telangana State Civil Supplies Corporation Consumer Packaging Hub',
        brandNames: ['Mana Biyyam Fine Sona Masoori Rice', 'TS-CS Brand Sugar & Pulses'],
        authorizedPerson: 'K. Ram Mohan (General Manager - Procurement)',
        panNumber: 'AAACT5544J',
        gstin: '36AAACT5544J1ZF',
        email: 'pck-hub@telangana.gov.in',
        phone: '+91 98499 99001',
        registeredAddress: 'Civil Supplies Bhavan, Somajiguda, Hyderabad',
        warehouseAddress: 'Central Warehouse, Cherlapally, Hyderabad',
        district: 'Hyderabad',
        state: 'Telangana',
        commodities: ['Fortified Rice (25kg, 50kg)', 'Red Gram Dal (1kg)', 'Sugar (1kg)'],
        status: LmpcStatus.APPROVED,
        mandatoryDeclarationsCompliant: true,
        issueDate: new Date('2026-03-10'),
        validUntil: new Date('2029-03-09'),
        feeAmount: 5000,
        challanNumber: 'CHL-TS-0435-104928',
        remarks: 'State PDS packaging certified under Legal Metrology Rules Schedule II.',
      },
    ]);

    await PackagedCommoditySample.create([
      {
        sampleId: 'LMPC-SMP-2026-0001',
        brandName: 'Fortune Sunlite Refined Sunflower Oil (1 Litre Pouch)',
        commodityType: 'Edible Cooking Oil',
        manufacturerOrPacker: 'Adani Wilmar Limited',
        batchNumber: 'B-SUN-08-992',
        mfgDate: new Date('2026-08-01'),
        declaredQuantity: 1000,
        unit: 'ml',
        declaredMrp: 148,
        lotSize: 2400,
        sampleSize: 32,
        madLimit: 15,
        observedWeights: [
          1002, 1001, 998, 1004, 1000, 997, 1005, 999, 1003, 1000,
          1001, 998, 1002, 1004, 999, 1001, 1003, 998, 1002, 1000,
          1005, 999, 1001, 1002, 998, 1003, 1001, 1000, 1004, 999, 1001, 1002,
        ],
        meanQuantity: 1001.03,
        standardDeviation: 1.98,
        t1Limit: 985,
        t2Limit: 970,
        t1Violations: 0,
        t2Violations: 0,
        result: SampleTestResult.PASS,
        inspectorName: 'Inspector R. Kumar (LMO-HYD-04)',
        inspectionLocation: 'Metro Cash & Carry, Moosapet, Kukatpally',
        district: 'Hyderabad',
        mandatoryLabelsPresent: {
          mrp: true,
          netQty: true,
          mfgDate: true,
          consumerCare: true,
          countryOfOrigin: true,
        },
        seizureRecommended: false,
        remarks: 'Sample complies strictly with Schedule II of Legal Metrology (Packaged Commodities) Rules, 2011.',
      },
      {
        sampleId: 'LMPC-SMP-2026-0002',
        brandName: 'Royal Premium Aged Basmati Rice (5 kg Poly-Woven Bag)',
        commodityType: 'Foodgrains / Rice',
        manufacturerOrPacker: 'Shri Balaji Modern Rice Mills Pvt Ltd',
        batchNumber: 'B-RIC-26-441',
        mfgDate: new Date('2026-07-28'),
        declaredQuantity: 5000,
        unit: 'g',
        declaredMrp: 480,
        lotSize: 1200,
        sampleSize: 32,
        madLimit: 75,
        observedWeights: [
          4890, 4910, 4880, 4905, 4895, 4870, 4920, 4890, 4885, 4915,
          4900, 4890, 4875, 4910, 4895, 4880, 4905, 4890, 4885, 4915,
          4900, 4895, 4870, 4910, 4885, 4890, 4905, 4890, 4880, 4915, 4900, 4885,
        ],
        meanQuantity: 4894.38,
        standardDeviation: 13.72,
        t1Limit: 4925,
        t2Limit: 4850,
        t1Violations: 32, // all observed are below T1 (4925g)
        t2Violations: 0,
        result: SampleTestResult.DEFICIENT_AVERAGE,
        inspectorName: 'Inspector D. Sharma (Flying Squad Central)',
        inspectionLocation: 'Miralam Mandi Wholesale Yard, Charminar Zone',
        district: 'Hyderabad',
        mandatoryLabelsPresent: {
          mrp: true,
          netQty: true,
          mfgDate: true,
          consumerCare: true,
          countryOfOrigin: true,
        },
        seizureRecommended: true,
        panchnamaNumber: 'PANCHNAMA-HYD-2026-0001',
        remarks: 'Severe net weight shortfall. Sample mean is 4894g against declared 5000g. Recommended for seizure and prosecution under Section 36(1).',
      },
      {
        sampleId: 'LMPC-SMP-2026-0003',
        brandName: 'Pavitra Iodized Crystal Salt (1 kg Pouch)',
        commodityType: 'Table Salt',
        manufacturerOrPacker: 'Coastal Minerals & Chemicals Corp',
        batchNumber: 'SLT-2026-118',
        mfgDate: new Date('2026-08-10'),
        declaredQuantity: 1000,
        unit: 'g',
        declaredMrp: 28,
        lotSize: 5000,
        sampleSize: 32,
        madLimit: 15,
        observedWeights: [
          962, 958, 960, 965, 959, 961, 964, 955, 968, 960,
          962, 958, 961, 966, 957, 963, 965, 956, 967, 959,
          962, 960, 964, 958, 961, 965, 958, 963, 966, 957, 962, 960,
        ],
        meanQuantity: 961.06,
        standardDeviation: 3.25,
        t1Limit: 985,
        t2Limit: 970,
        t1Violations: 0,
        t2Violations: 32, // all observed are below T2 limit (970g)
        result: SampleTestResult.CRITICAL_T2,
        inspectorName: 'Inspector M. Anjaneyulu (LMO-RAN-02)',
        inspectionLocation: 'D-Mart Supermarket, Vanasthalipuram',
        district: 'Ranga Reddy',
        mandatoryLabelsPresent: {
          mrp: true,
          netQty: true,
          mfgDate: true,
          consumerCare: true,
          countryOfOrigin: true,
        },
        seizureRecommended: true,
        remarks: 'Critical defect. All 32 samples are below T2 limit (970g). Massive intentional short weight.',
      },
    ]);
  }

  // 2. Seed Phase 10: Surprise Raids & Digital Panchnamas (Seizure Memos)
  const raidCount = await RaidInspection.countDocuments();
  if (raidCount === 0) {
    console.log('[Seed] Seeding Phase 10: Surprise Raids, Panchnamas, and Compounding Records...');

    await RaidInspection.create([
      {
        raidCode: 'RAID-TS-2026-0001',
        squadName: 'State Flying Squad Alpha - Hyderabad Central',
        squadLeader: 'Assistant Controller D. Sharma',
        targetBusinessName: 'Sri Lakshmi Wholesale Spices & Agro Traders',
        proprietorName: 'K. Laxminarayana',
        location: 'Shop 42-45, Begum Bazar Main Road, Hyderabad',
        district: 'Hyderabad',
        gpsCoordinates: { latitude: 17.3753, longitude: 78.4718 },
        premiseType: PremiseType.MANDI_GRAIN_MARKET,
        inspectionDate: new Date('2026-08-18T11:00:00Z'),
        status: RaidStatus.VIOLATIONS_FOUND_SEIZED,
        allegedViolations: [
          'Underweight pre-packaged bags violating Section 36(1)',
          'Possession of unverified lead weights with bored bottom cavities under Section 27',
          'Broken verification seal on counter scale under Section 38',
        ],
        seizureMade: true,
        panchnamaNumber: 'PANCHNAMA-HYD-2026-0001',
        summary: 'Joint raid conducted based on consumer intelligence. Seized counterfeit stamping dies and deficient rice bags.',
      },
      {
        raidCode: 'RAID-TS-2026-0002',
        squadName: 'State Flying Squad Beta - Cyberabad Financial District',
        squadLeader: 'Assistant Controller K. Radhika',
        targetBusinessName: 'Cyber Gold & Gemological Carat Centre',
        proprietorName: 'Vikram Jain (Managing Director)',
        location: 'Opposite Model House, Panjagutta Circle, Hyderabad',
        district: 'Hyderabad',
        gpsCoordinates: { latitude: 17.4248, longitude: 78.4485 },
        premiseType: PremiseType.JEWELLERY_ESTABLISHMENT,
        inspectionDate: new Date('2026-08-22T14:30:00Z'),
        status: RaidStatus.VIOLATIONS_FOUND_SEIZED,
        allegedViolations: [
          'Non-stamped Class II high-precision electronic carat balance',
          'Use of non-standard weight unit (Local Masha/Ratti) contrary to SI metrics',
        ],
        seizureMade: true,
        panchnamaNumber: 'PANCHNAMA-HYD-2026-0002',
        summary: 'High-precision balance seized. Refused compounding, referred to Judicial Magistrate First Class.',
      },
      {
        raidCode: 'RAID-TS-2026-0003',
        squadName: 'Highway Enforcement Mobile Vigilance Squad',
        squadLeader: 'Inspector P. Nageswara Rao',
        targetBusinessName: 'Highway Oasis HPCL Fuel Dispensing Station',
        proprietorName: 'B. Srinivas Reddy',
        location: 'NH-44 Bypass Road, Medchal Town',
        district: 'Medchal-Malkajgiri',
        gpsCoordinates: { latitude: 17.6294, longitude: 78.4815 },
        premiseType: PremiseType.PETROL_PUMP,
        inspectionDate: new Date('2026-08-25T09:15:00Z'),
        status: RaidStatus.COMPLETED_CLEAN,
        allegedViolations: ['Pulsar short delivery suspicion'],
        seizureMade: false,
        summary: 'Pulsar delivery calibrated with 5L standard measure. Variance +5ml, well within legal tolerance of +/- 25ml.',
      },
    ]);

    await SeizureMemo.create([
      {
        panchnamaNumber: 'PANCHNAMA-HYD-2026-0001',
        raidCode: 'RAID-TS-2026-0001',
        inspectionDate: new Date('2026-08-18T12:30:00Z'),
        establishmentName: 'Sri Lakshmi Wholesale Spices & Agro Traders',
        address: 'Shop 42-45, Begum Bazar Main Road, Hyderabad',
        district: 'Hyderabad',
        accusedPersonName: 'K. Laxminarayana',
        accusedRole: 'Proprietor / Licensee',
        panchas: [
          {
            name: 'K. Venkateshwar Rao',
            age: 44,
            occupation: 'Dry Fruit Merchant',
            address: 'Shop 38, Begum Bazar, Hyderabad',
            phone: '+91 98490 12345',
          },
          {
            name: 'Mohd. Abdul Qadeer',
            age: 39,
            occupation: 'Spice Wholesale Dealer',
            address: 'Shop 49, Begum Bazar, Hyderabad',
            phone: '+91 94401 67890',
          },
        ],
        seizedItems: [
          {
            serialNumber: 1,
            description: '500g Cast Iron Hexagonal Weight with drilled lead bottom cavity (Net mass: 482g)',
            quantity: 4,
            identificationMarks: 'TS-LM-FAKE-998',
            reasonForSeizure: 'Drilled lead plug cavity reducing statutory mass by 18g per weight under Section 27',
            custodyMalkhanaBoxNumber: 'BOX-MALKHANA-014',
          },
          {
            serialNumber: 2,
            description: 'Counter Balancing Scale with external magnet attached to bottom pan support',
            quantity: 1,
            identificationMarks: 'SCALE-SN-88219',
            reasonForSeizure: 'Unauthorized magnetic attachment producing fraudulent zero deflection under Section 30',
            custodyMalkhanaBoxNumber: 'BOX-MALKHANA-015',
          },
        ],
        statutorySections: [
          'Section 27 (Manufacture, sale or use of non-standard weight)',
          'Section 30 (Penalty for short measurement / fraudulent device)',
          'Section 38 (Penalty for tampering with seal)',
        ],
        custodyLocation: 'Central Legal Metrology Malkhana Vault, Circle 3, Musheerabad, Hyderabad',
        compoundingStatus: CompoundingStatus.COMPOUNDED,
        compoundingFeeAmount: 25000,
        challanNumber: 'CHL-TS-COMP-2026-0089',
        investigatingOfficerName: 'Assistant Controller D. Sharma',
        officerDigitalSignatureHash: '8b74c2e5a9f19033481dcfa201bce471829e01824a733198de748123acba8812',
        remarks: 'Proprietor pleaded guilty under Section 48. Deposited compounding fee of ₹25,000 via Treasury e-Challan.',
      },
      {
        panchnamaNumber: 'PANCHNAMA-HYD-2026-0002',
        raidCode: 'RAID-TS-2026-0002',
        inspectionDate: new Date('2026-08-22T16:00:00Z'),
        establishmentName: 'Cyber Gold & Gemological Carat Centre',
        address: 'Opposite Model House, Panjagutta Circle, Hyderabad',
        district: 'Hyderabad',
        accusedPersonName: 'Vikram Jain',
        accusedRole: 'Managing Director',
        panchas: [
          {
            name: 'P. Suresh Kumar',
            age: 51,
            occupation: 'Architect / Customer Witness',
            address: 'Flat 302, Green Meadows, Somajiguda, Hyderabad',
            phone: '+91 98488 22119',
          },
          {
            name: 'G. Shravan',
            age: 35,
            occupation: 'Independent IT Consultant',
            address: 'Plot 12, Nagarjuna Hills, Panjagutta, Hyderabad',
            phone: '+91 99890 33445',
          },
        ],
        seizedItems: [
          {
            serialNumber: 1,
            description: 'Sartorius High-Precision Electronic Carat Balance (Max: 100g, e=0.001g) without valid verification stamp',
            quantity: 1,
            identificationMarks: 'SN-SAR-990142',
            reasonForSeizure: 'Commercial use of unverified high-precision balance lacking annual reverification seal under Section 24',
            custodyMalkhanaBoxNumber: 'VAULT-LOCKER-004',
          },
        ],
        statutorySections: [
          'Section 24 (Verification and stamping of weight or measure)',
          'Section 33 (Penalty for use of unverified weight or measure)',
        ],
        custodyLocation: 'High-Value Vault, Controller Legal Metrology HQ, Somajiguda, Hyderabad',
        compoundingStatus: CompoundingStatus.PROSECUTION_FILED_IN_COURT,
        compoundingFeeAmount: 50000,
        courtCaseDetails: {
          courtName: 'Hon’ble Court of Special Metropolitan Magistrate (Legal Metrology), Nampally, Hyderabad',
          ccOrFirNumber: 'CC-LEGMET-2026-1048',
          hearingDate: new Date('2026-10-15T10:30:00Z'),
          status: 'CHARGE_SHEET_FRAMED',
        },
        investigatingOfficerName: 'Assistant Controller K. Radhika',
        officerDigitalSignatureHash: '4f29a018bc928174e01923485718290348712390481239840192834091823904',
        remarks: 'Accused contested notice. Charge sheet framed before Hon’ble Magistrate under Section 33.',
      },
    ]);
  }

  // 3. Seed Phase 11: Weighbridges & IoT Electronic Data Capture (EDC) Stream
  const wbCount = await Weighbridge.countDocuments();
  if (wbCount === 0) {
    console.log('[Seed] Seeding Phase 11: Heavy Weighbridges and Real-Time IoT Telemetry Stream...');

    await Weighbridge.create([
      {
        weighbridgeId: 'WB-HYD-APMC-01',
        name: 'Bowenpally APMC Agricultural Market Weighbridge #1',
        location: 'Agricultural Produce Market Yard, Bowenpally, Secunderabad',
        district: 'Hyderabad',
        category: 'APMC_MANDI',
        operatorName: 'B. Narsimha Murthy (Chief Weighmaster)',
        operatorPhone: '+91 98480 33441',
        indicatorModel: 'Avery Weigh-Tronix E1205 Indicator',
        indicatorSerial: 'AW-IND-2024-0091',
        capacityKg: 60000,
        divisionKg: 10,
        loadCellCount: 4,
        lastCalibrationDate: new Date('2026-04-10'),
        calibrationExpiry: new Date('2027-04-09'),
        status: WeighbridgeStatus.ONLINE_NORMAL,
        remoteLockActive: false,
        firmwareVersion: 'v4.1.2-OIML-R76',
        firmwareHash: '9a84210bcdef0192847120384719283401928340',
        currentZeroOffsetKg: 2,
        maxPermissibleErrorKg: 20,
        ipAddress: '10.140.22.10',
        lastHeartbeat: new Date(),
      },
      {
        weighbridgeId: 'WB-WAR-MINING-02',
        name: 'Ramagundam Coal Pithead Weighbridge #2',
        location: 'SCCL Open Cast Project III, Ramagundam Coal Belt',
        district: 'Peddapalli',
        category: 'MINING_PITHEAD',
        operatorName: 'S. Ramakrishna (SCCL Mining Dispatch)',
        operatorPhone: '+91 94401 55662',
        indicatorModel: 'Mettler Toledo IND570 Industrial Terminal',
        indicatorSerial: 'MT-IND570-88192',
        capacityKg: 100000,
        divisionKg: 20,
        loadCellCount: 6,
        lastCalibrationDate: new Date('2026-05-15'),
        calibrationExpiry: new Date('2027-05-14'),
        status: WeighbridgeStatus.ONLINE_NORMAL,
        remoteLockActive: false,
        firmwareVersion: 'v3.8.0-SCCL',
        firmwareHash: '5e71829038410293847120394871230948120394',
        currentZeroOffsetKg: -5,
        maxPermissibleErrorKg: 40,
        ipAddress: '10.145.88.4',
        lastHeartbeat: new Date(),
      },
      {
        weighbridgeId: 'WB-HYD-TOLL-03',
        name: 'Shamshabad Highway Toll & Logistics Heavy Weighbridge',
        location: 'Outer Ring Road (ORR) Interchange, Shamshabad',
        district: 'Ranga Reddy',
        category: 'HIGHWAY_TOLL',
        operatorName: 'M. Prabhakar (Logistics Supervisor)',
        operatorPhone: '+91 98492 77881',
        indicatorModel: 'Essae Teraoka WB-600 Industrial Weighmaster',
        indicatorSerial: 'ESS-WB-60-1049',
        capacityKg: 80000,
        divisionKg: 20,
        loadCellCount: 4,
        lastCalibrationDate: new Date('2026-02-12'),
        calibrationExpiry: new Date('2027-02-11'),
        status: WeighbridgeStatus.TAMPER_ALERT,
        remoteLockActive: true,
        firmwareVersion: 'v2.9.1-MOD',
        firmwareHash: '1a90283401928340918230948102938401928341',
        currentZeroOffsetKg: 35,
        maxPermissibleErrorKg: 20,
        ipAddress: '10.142.18.99',
        lastHeartbeat: new Date(),
      },
      {
        weighbridgeId: 'WB-NAL-CEM-04',
        name: 'Miryalaguda Cement Plant Dispatch Weighbridge',
        location: 'Deccan Cements Industrial Estate, Miryalaguda',
        district: 'Nalgonda',
        category: 'CEMENT_INDUSTRIAL',
        operatorName: 'C. Janardhan Reddy',
        operatorPhone: '+91 94412 88990',
        indicatorModel: 'Cardinal 225 Navigator Indicator',
        indicatorSerial: 'CARD-225-4491',
        capacityKg: 60000,
        divisionKg: 10,
        loadCellCount: 4,
        lastCalibrationDate: new Date('2026-06-01'),
        calibrationExpiry: new Date('2027-05-31'),
        status: WeighbridgeStatus.ONLINE_NORMAL,
        remoteLockActive: false,
        firmwareVersion: 'v5.0.1-CARD',
        firmwareHash: '3d90283401928340918230948102938401928349',
        currentZeroOffsetKg: 0,
        maxPermissibleErrorKg: 20,
        ipAddress: '10.148.91.12',
        lastHeartbeat: new Date(),
      },
    ]);

    await WeighbridgeTransaction.create([
      {
        transactionId: 'TX-WB-2026-00001',
        weighbridgeId: 'WB-HYD-APMC-01',
        timestamp: new Date(Date.now() - 35 * 60 * 1000),
        vehicleNumber: 'TS-09-UB-4491',
        commodity: 'Paddy / Raw Rice Grain (10 Wheeler Truck)',
        ewayBillNumber: 'EWAY-TS-2026-9812903',
        grossWeightKg: 28450,
        tareWeightKg: 9120,
        netWeightKg: 19330,
        loadCellVoltagesMv: [2.01, 2.02, 1.99, 2.03],
        weightStabilityAchieved: true,
        tamperFlags: [],
        isAnomaly: false,
        slipNumber: 'SLIP-APMC-1001',
        operatorName: 'B. Narsimha Murthy',
      },
      {
        transactionId: 'TX-WB-2026-00002',
        weighbridgeId: 'WB-HYD-APMC-01',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        vehicleNumber: 'TS-08-GA-2219',
        commodity: 'Red Gram / Toor Dal Bags',
        ewayBillNumber: 'EWAY-TS-2026-9814421',
        grossWeightKg: 34200,
        tareWeightKg: 11400,
        netWeightKg: 22800,
        loadCellVoltagesMv: [2.00, 2.01, 2.02, 1.99],
        weightStabilityAchieved: true,
        tamperFlags: [],
        isAnomaly: false,
        slipNumber: 'SLIP-APMC-1002',
        operatorName: 'B. Narsimha Murthy',
      },
      {
        transactionId: 'TX-WB-2026-00003',
        weighbridgeId: 'WB-WAR-MINING-02',
        timestamp: new Date(Date.now() - 50 * 60 * 1000),
        vehicleNumber: 'TS-02-T-8822',
        commodity: 'Raw Thermal Coal',
        ewayBillNumber: 'EWAY-TS-2026-5510291',
        grossWeightKg: 62400,
        tareWeightKg: 18200,
        netWeightKg: 44200,
        loadCellVoltagesMv: [2.02, 2.03, 2.01, 2.02, 2.00, 2.04],
        weightStabilityAchieved: true,
        tamperFlags: [],
        isAnomaly: false,
        slipNumber: 'SLIP-MINE-4001',
        operatorName: 'S. Ramakrishna',
      },
      {
        transactionId: 'TX-WB-2026-00004',
        weighbridgeId: 'WB-HYD-TOLL-03',
        timestamp: new Date(Date.now() - 120 * 60 * 1000),
        vehicleNumber: 'AP-29-TA-9012',
        commodity: 'Steel TMT Bars & Structural Billets',
        ewayBillNumber: 'EWAY-TS-2026-1194820',
        grossWeightKg: 42100,
        tareWeightKg: 12400,
        netWeightKg: 29700,
        loadCellVoltagesMv: [2.45, 1.82, 1.70, 2.50],
        weightStabilityAchieved: false,
        tamperFlags: ['LOADCELL_IMBALANCE_ALERT', 'ZERO_DRIFT_EXCEEDED'],
        isAnomaly: true,
        anomalyReason: 'Severe load-cell voltage imbalance (0.80 mV/V spread). Zero point drifted by +35kg beyond legal MPE.',
        slipNumber: 'SLIP-TOLL-8801',
        operatorName: 'M. Prabhakar',
      },
      {
        transactionId: 'TX-WB-2026-00005',
        weighbridgeId: 'WB-NAL-CEM-04',
        timestamp: new Date(Date.now() - 20 * 60 * 1000),
        vehicleNumber: 'TS-05-UB-1049',
        commodity: 'Portland Pozzolana Cement Bags (50kg)',
        ewayBillNumber: 'EWAY-TS-2026-7718290',
        grossWeightKg: 48500,
        tareWeightKg: 14200,
        netWeightKg: 34300,
        loadCellVoltagesMv: [2.01, 2.00, 2.02, 2.01],
        weightStabilityAchieved: true,
        tamperFlags: [],
        isAnomaly: false,
        slipNumber: 'SLIP-CEM-2001',
        operatorName: 'C. Janardhan Reddy',
      },
    ]);
  }
}
