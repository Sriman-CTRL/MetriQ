import crypto from 'crypto';

export interface CanonicalCertificateData {
  certificateNumber: string;
  instrumentId: string;
  type: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  capacity: string;
  ownerName: string;
  location: string;
  verificationDate: string;
  validUntil: string;
  officerName: string;
}

/**
 * Creates a deterministic canonical representation of the certificate
 * to guarantee cryptographic SHA-256 integrity checks.
 */
export function buildCanonicalCertificateString(data: CanonicalCertificateData): string {
  const normalized: Record<string, string> = {
    capacity: data.capacity.trim(),
    certificateNumber: data.certificateNumber.trim(),
    instrumentId: data.instrumentId.trim(),
    location: data.location.trim(),
    manufacturer: data.manufacturer.trim(),
    model: data.model.trim(),
    officerName: data.officerName.trim(),
    ownerName: data.ownerName.trim(),
    serialNumber: data.serialNumber.trim(),
    type: data.type.trim(),
    validUntil: data.validUntil.trim(),
    verificationDate: data.verificationDate.trim(),
  };

  // Sort keys deterministically
  const sortedKeys = Object.keys(normalized).sort();
  return sortedKeys.map((key) => `${key}=${normalized[key]}`).join('|');
}

/**
 * Computes SHA-256 hex digest for certificate integrity.
 */
export function generateCertificateHash(data: CanonicalCertificateData): string {
  const canonical = buildCanonicalCertificateString(data);
  return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
}

/**
 * Verifies certificate cryptographic integrity.
 */
export function verifyCertificateIntegrity(
  data: CanonicalCertificateData,
  storedHash: string
): { isValid: boolean; calculatedHash: string } {
  const calculatedHash = generateCertificateHash(data);
  const isValid = calculatedHash.toLowerCase() === storedHash.toLowerCase();
  return { isValid, calculatedHash };
}
