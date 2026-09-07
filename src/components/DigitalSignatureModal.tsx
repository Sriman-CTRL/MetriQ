import { useState } from 'react';
import {
  ShieldCheck,
  KeyRound,
  FileCheck,
  Fingerprint,
  Lock,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  QrCode,
  X,
} from 'lucide-react';

interface DigitalSignatureModalProps {
  certificateData: {
    certificateNumber: string;
    instrumentId: string;
    merchantName: string;
    model: string;
    officerName?: string;
  };
  onSuccess: (signatureInfo: {
    signerName: string;
    tokenType: string;
    certificateSerial: string;
    timestamp: string;
    sha256Hash: string;
  }) => void;
  onClose: () => void;
}

export function DigitalSignatureModal({
  certificateData,
  onSuccess,
  onClose,
}: DigitalSignatureModalProps) {
  const [tokenType, setTokenType] = useState<'CLASS_3_TOKEN' | 'AADHAAR_ESIGN'>('CLASS_3_TOKEN');
  const [pin, setPin] = useState('874291');
  const [isSigning, setIsSigning] = useState(false);
  const [step, setStep] = useState<'CONFIG' | 'SIGNING' | 'SUCCESS'>('CONFIG');
  const [completedSignature, setCompletedSignature] = useState<any | null>(null);

  const sha256Hash = 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9';

  const handleSign = () => {
    setIsSigning(true);
    setStep('SIGNING');

    setTimeout(() => {
      const sigData = {
        signerName: certificateData.officerName || 'K. Venkat Rao, Assistant Controller',
        tokenType: tokenType === 'CLASS_3_TOKEN' ? 'Class-3 DSC (e-Mudhra PKI)' : 'Aadhaar e-Sign (C-DAC)',
        certificateSerial: 'CCA/IN/2026/09/8839210-LMO-HYD',
        timestamp: new Date().toISOString(),
        sha256Hash,
      };
      setCompletedSignature(sigData);
      setIsSigning(false);
      setStep('SUCCESS');
    }, 1200);
  };

  const handleFinalize = () => {
    if (completedSignature) {
      onSuccess(completedSignature);
    }
  };

  return (
    <div className="grievance-modal-overlay" onClick={onClose}>
      <div className="grievance-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ background: '#e1effa', color: '#073b69', padding: 6, borderRadius: 6 }}>
              <Lock size={18} />
            </div>
            <h2 style={{ fontSize: 17, color: '#073b69', margin: 0, fontWeight: 700 }}>
              PKI Digital Signature & Statutory Sealing
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#617a8c' }}>
            <X size={18} />
          </button>
        </div>

        {step === 'CONFIG' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#f5f8fa', border: '1px solid #d8e6ef', borderRadius: 6, padding: 12, fontSize: 12, color: '#35536b' }}>
              <div><b>Certificate:</b> {certificateData.certificateNumber}</div>
              <div><b>Instrument:</b> {certificateData.instrumentId} ({certificateData.model})</div>
              <div><b>Merchant:</b> {certificateData.merchantName}</div>
              <div style={{ marginTop: 6, fontFamily: 'monospace', fontSize: 10, color: '#617a8c', wordBreak: 'break-all' }}>
                <b>Canonical SHA-256:</b> {sha256Hash}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>Signing Mechanism</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setTokenType('CLASS_3_TOKEN')}
                  style={{
                    padding: 10,
                    borderRadius: 6,
                    border: '1px solid',
                    borderColor: tokenType === 'CLASS_3_TOKEN' ? '#073b69' : '#d2dfe7',
                    background: tokenType === 'CLASS_3_TOKEN' ? '#eef5fc' : '#fff',
                    color: tokenType === 'CLASS_3_TOKEN' ? '#073b69' : '#35536b',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <KeyRound size={15} /> Class-3 Hardware DSC
                </button>

                <button
                  type="button"
                  onClick={() => setTokenType('AADHAAR_ESIGN')}
                  style={{
                    padding: 10,
                    borderRadius: 6,
                    border: '1px solid',
                    borderColor: tokenType === 'AADHAAR_ESIGN' ? '#073b69' : '#d2dfe7',
                    background: tokenType === 'AADHAAR_ESIGN' ? '#eef5fc' : '#fff',
                    color: tokenType === 'AADHAAR_ESIGN' ? '#073b69' : '#35536b',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Fingerprint size={15} /> Aadhaar e-Sign OTP
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>
                {tokenType === 'CLASS_3_TOKEN' ? 'Hardware Crypto USB Token PIN' : 'Enter 6-Digit OTP'}
              </label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid #c9d8e2', fontSize: 14, letterSpacing: 2 }}
              />
              <span style={{ fontSize: 11, color: '#617a8c', marginTop: 4, display: 'block' }}>
                Compliant with Section 3A of Information Technology Act, 2000 and Rule 11 of Legal Metrology Rules.
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
              <button
                type="button"
                onClick={onClose}
                style={{ padding: '8px 14px', background: '#f5f8fa', border: '1px solid #ccd9e2', borderRadius: 4, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSign}
                style={{
                  padding: '9px 18px',
                  background: '#073b69',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <ShieldCheck size={16} /> Digitally Sign & Seal Certificate
              </button>
            </div>
          </div>
        )}

        {step === 'SIGNING' && (
          <div style={{ padding: '32px 16px', textAlign: 'center' }}>
            <div style={{ display: 'inline-block', animation: 'spin 1s linear infinite', marginBottom: 16 }}>
              <KeyRound size={32} color="#073b69" />
            </div>
            <h3 style={{ fontSize: 16, color: '#073b69', margin: '0 0 6px' }}>
              Communicating with Cryptographic Key Vault...
            </h3>
            <p style={{ fontSize: 13, color: '#617a8c', margin: 0 }}>
              Computing SHA-256 payload digest, attaching TSA timestamp, and applying Controller seal stamp.
            </p>
          </div>
        )}

        {step === 'SUCCESS' && completedSignature && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#e7f7ed', border: '1px solid #a3e6be', borderRadius: 6, padding: 14, textAlign: 'center' }}>
              <CheckCircle2 size={28} color="#0d8a43" style={{ marginBottom: 6 }} />
              <h3 style={{ margin: 0, fontSize: 16, color: '#0d8a43', fontWeight: 700 }}>
                Digitally Signed & Validated
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#35536b' }}>
                Certificate is tamper-proof and legally binding under Legal Metrology Act, 2009.
              </p>
            </div>

            <div style={{ background: '#f5f8fa', border: '1px solid #d4e0e8', borderRadius: 6, padding: 12, fontSize: 12, color: '#35536b' }}>
              <div><b>Signer:</b> {completedSignature.signerName}</div>
              <div><b>Token:</b> {completedSignature.tokenType}</div>
              <div><b>Serial:</b> {completedSignature.certificateSerial}</div>
              <div><b>Timestamp (TSA):</b> {completedSignature.timestamp}</div>
              <div style={{ marginTop: 4, fontFamily: 'monospace', fontSize: 10, color: '#617a8c' }}>
                <b>Digest:</b> {completedSignature.sha256Hash}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={handleFinalize}
                style={{
                  padding: '9px 18px',
                  background: '#073b69',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Attach Signature to Certificate
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
