export type Role = 'owner' | 'office' | 'field' | 'admin'
export type ApplicationStatus = 'Submitted' | 'Under Scrutiny' | 'Assigned' | 'Scheduled' | 'Field Verification' | 'Certificate Issued'

export type Instrument = { id: string; type: string; manufacturer: string; model: string; serial: string; capacity: string; owner: string; location: string; certificate: string; status: 'Verified' | 'Expired' | 'Pending' | 'Flagged'; expiry: string }
export type Application = { id: string; applicant: string; business: string; instrument: string; district: string; submitted: string; priority: 'Normal' | 'High'; status: ApplicationStatus; officer?: string; date?: string }
export type Audit = { time: string; action: string; detail: string }

export const certificate = {
  id: 'LM-HYD-2026-000184', instrumentId: 'INS-HYD-0001', type: 'Electronic Weighing Scale', manufacturer: 'ABC Weigh Systems Pvt. Ltd.', model: 'EWS-300', serial: 'EWS300-98231', capacity: '300 kg', owner: 'Demo Retail Enterprises', location: 'Hyderabad, Telangana', verificationDate: '12 August 2026', validUntil: '11 August 2027', officer: 'Officer R. Kumar', hash: '9f72cbb0e4a6c2f8...a82d'
}

export const instruments: Instrument[] = [
  { id: 'INS-HYD-0001', type: 'Electronic Weighing Scale', manufacturer: 'ABC Weigh Systems', model: 'EWS-300', serial: 'EWS300-98231', capacity: '300 kg', owner: 'Demo Retail Enterprises', location: 'Hyderabad', certificate: certificate.id, status: 'Verified', expiry: '11 Aug 2027' },
  { id: 'INS-HYD-0002', type: 'Retail Weighing Scale', manufacturer: 'Prism Metrics', model: 'RS-30', serial: 'PRS-300154', capacity: '30 kg', owner: 'Deccan Mart', location: 'Hyderabad', certificate: 'LM-HYD-2026-000178', status: 'Verified', expiry: '20 Sep 2027' },
  { id: 'INS-WGL-0003', type: 'Platform Scale', manufacturer: 'ABC Weigh Systems', model: 'PS-500', serial: 'ABC-500003', capacity: '500 kg', owner: 'Warangal Traders', location: 'Warangal', certificate: 'LM-WGL-2026-000055', status: 'Verified', expiry: '03 Nov 2027' },
  { id: 'INS-HYD-0004', type: 'Measuring Instrument', manufacturer: 'Precise Labs', model: 'ML-10', serial: 'PL-10987', capacity: '10 L', owner: 'Demo Retail Enterprises', location: 'Hyderabad', certificate: 'LM-HYD-2025-000076', status: 'Expired', expiry: '15 Aug 2026' },
  { id: 'INS-VJA-0005', type: 'Weighbridge', manufacturer: 'MassLine', model: 'WB-60', serial: 'ML-602229', capacity: '60 t', owner: 'Coastal Logistics', location: 'Vijayawada', certificate: 'LM-VJA-2026-000091', status: 'Verified', expiry: '02 Dec 2027' },
  { id: 'INS-BLR-0006', type: 'Electronic Weighing Scale', manufacturer: 'Metricon', model: 'MX-150', serial: 'MTX-15011', capacity: '150 kg', owner: 'Bengaluru Fresh', location: 'Bengaluru', certificate: 'LM-BLR-2026-000011', status: 'Pending', expiry: '-' },
  { id: 'INS-CHE-0007', type: 'Platform Scale', manufacturer: 'ScalePro', model: 'SP-200', serial: 'SP-200912', capacity: '200 kg', owner: 'Chennai Foods', location: 'Chennai', certificate: 'LM-CHE-2026-000038', status: 'Verified', expiry: '15 Jan 2028' },
  { id: 'INS-MUM-0008', type: 'Retail Weighing Scale', manufacturer: 'Prism Metrics', model: 'RS-15', serial: 'PRS-150801', capacity: '15 kg', owner: 'Mumbai Bazaar', location: 'Mumbai', certificate: 'LM-MUM-2026-000209', status: 'Flagged', expiry: '11 Oct 2027' }
]

export const applications: Application[] = [
  { id: 'APP-HYD-2026-001245', applicant: 'A. Sharma', business: 'Demo Retail Enterprises', instrument: 'Electronic Weighing Scale', district: 'Hyderabad', submitted: '14 Aug 2026', priority: 'High', status: 'Field Verification', officer: 'Officer R. Kumar', date: '18 Aug 2026, 10:30 AM' },
  { id: 'APP-WGL-2026-000129', applicant: 'M. Reddy', business: 'Warangal Traders', instrument: 'Platform Scale', district: 'Warangal', submitted: '13 Aug 2026', priority: 'Normal', status: 'Under Scrutiny' },
  { id: 'APP-HYD-2026-001244', applicant: 'S. Khan', business: 'Deccan Mart', instrument: 'Retail Weighing Scale', district: 'Hyderabad', submitted: '12 Aug 2026', priority: 'Normal', status: 'Scheduled', officer: 'Officer R. Kumar', date: '19 Aug 2026, 2:00 PM' },
  { id: 'APP-VJA-2026-000310', applicant: 'P. Naidu', business: 'Coastal Logistics', instrument: 'Weighbridge', district: 'Vijayawada', submitted: '11 Aug 2026', priority: 'High', status: 'Assigned', officer: 'Officer V. Rao' },
  { id: 'APP-BLR-2026-000041', applicant: 'K. Das', business: 'Bengaluru Fresh', instrument: 'Electronic Weighing Scale', district: 'Bengaluru', submitted: '10 Aug 2026', priority: 'Normal', status: 'Submitted' },
  { id: 'APP-CHE-2026-000225', applicant: 'R. Iyer', business: 'Chennai Foods', instrument: 'Platform Scale', district: 'Chennai', submitted: '09 Aug 2026', priority: 'Normal', status: 'Certificate Issued', officer: 'Officer P. Suresh' }
]

export const auditSeed: Audit[] = [
  { time: '18 Aug 2026 09:10', action: 'Application submitted', detail: 'APP-HYD-2026-001245' },
  { time: '18 Aug 2026 09:25', action: 'Application approved', detail: 'Officer S. Rao' },
  { time: '18 Aug 2026 09:30', action: 'Assigned to LMO', detail: 'Officer R. Kumar' },
  { time: '18 Aug 2026 11:42', action: 'Verification completed', detail: 'Result: PASS' },
  { time: '18 Aug 2026 11:43', action: 'Certificate generated', detail: certificate.id },
  { time: '18 Aug 2026 11:44', action: 'Digital QR activated', detail: 'Registry verified' }
]
