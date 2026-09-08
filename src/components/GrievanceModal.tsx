import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  X,
  Send,
  Building,
  QrCode,
  FileEdit,
  Camera,
  Sparkles,
} from 'lucide-react';
import { api } from '../api';
import { useI18n } from '../i18n';

interface GrievanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillInstrumentId?: string;
  prefillCertificateNumber?: string;
}

const MARKET_PRESETS = [
  {
    id: 'PRESET-1',
    label: 'Begum Bazar Spices - 150g Short-Weighing',
    market: 'Begum Bazar Wholesale Kirana Market',
    merchantName: 'Sri Venkateshwara Spices & Dry Fruits',
    location: 'Shop 14-2-89, Begum Bazar Road, Hyderabad',
    instrumentId: 'INS-HYD-0001',
    certificateNumber: 'LM-HYD-2026-000184',
    violationType: 'Short-Weighing / Faulty Calibration',
    description: 'Purchased 1 kg chili and cumin seeds; scale display recorded 1000g but independent test weight showed net weight of only 850g (150g short-weighed). Stamping seal is missing or altered.',
  },
  {
    id: 'PRESET-2',
    label: 'Kothapet Fruit Market - Cut / Broken Lead Wire Seal',
    market: 'Kothapet Wholesale Fruit Commission Yard',
    merchantName: 'Kothapet Fruit Commission Stall #24',
    location: 'Platform 3, Wholesale Fruit Mandi, Dilsukhnagar, Hyderabad',
    instrumentId: 'INS-HYD-0003',
    certificateNumber: 'LM-HYD-2026-000310',
    violationType: 'Verification Seal Broken or Altered (Tampered)',
    description: 'Lead verification wire seal on the calibration access port is visibly severed and hanging loose. Calibration screw shows fresh tool marks.',
  },
  {
    id: 'PRESET-3',
    label: 'Secunderabad Mandi - Zero Offset (+120g Tare Inaccuracy)',
    market: 'Secunderabad APMC Mandi Yard',
    merchantName: 'Bharat Pulses & Grains Traders',
    location: 'Plot 42, APMC Mandi Yard, Secunderabad',
    instrumentId: 'INS-HYD-0002',
    certificateNumber: 'LM-HYD-2026-000201',
    violationType: 'Short-Weighing / Faulty Calibration',
    description: 'Platform scale display shows +120g before any item is placed on the platter. Merchant refused to reset the tare to 0.000 kg when requested.',
  },
  {
    id: 'PRESET-4',
    label: 'Charminar Jewelry Market - Expired Calibration Certificate',
    market: 'Gulzar Houz Jewellers Street',
    merchantName: 'Al-Madina Jewellers & Bullion',
    location: 'Shop 22-1-404, Charminar Jewellers Street, Hyderabad',
    instrumentId: 'INS-HYD-0005',
    certificateNumber: 'LM-HYD-2026-000552',
    violationType: 'Expired Verification Certificate',
    description: 'Quarterly verification certificate and annual stamping sticker expired in November 2025. Merchant refused to show statutory Form 3 certificate.',
  },
];

export const GrievanceModal: React.FC<GrievanceModalProps> = ({
  isOpen,
  onClose,
  prefillInstrumentId = '',
  prefillCertificateNumber = '',
}) => {
  const { t } = useI18n();
  const [entryMode, setEntryMode] = useState<'MANUAL' | 'PRESET' | 'SCAN'>('MANUAL');
  const [instrumentId, setInstrumentId] = useState(prefillInstrumentId);
  const [certificateNumber, setCertificateNumber] = useState(prefillCertificateNumber);
  const [merchantName, setMerchantName] = useState('');
  const [location, setLocation] = useState('');
  const [violationType, setViolationType] = useState('Short-Weighing / Faulty Calibration');
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [autofillSuccess, setAutofillSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof MARKET_PRESETS[0]) => {
    setInstrumentId(preset.instrumentId);
    setCertificateNumber(preset.certificateNumber);
    setMerchantName(preset.merchantName);
    setLocation(preset.location);
    setViolationType(preset.violationType);
    setDescription(preset.description);
    setAutofillSuccess(`Autofilled details from "${preset.market}". You can review or edit below.`);
    setEntryMode('MANUAL');
  };

  const handleSimulateScan = () => {
    setInstrumentId('INS-HYD-0001');
    setCertificateNumber('LM-HYD-2026-000184');
    setMerchantName('Ram & Sons Grocery Store');
    setLocation('Begum Bazar Main Market, Hyderabad');
    setViolationType('Verification Seal Broken or Altered (Tampered)');
    setDescription('QR scan verified instrument record in state database. Lead verification wire seal reported physically broken by consumer.');
    setAutofillSuccess('QR code scanned! Instrument ID & Certificate verified and auto-populated.');
    setEntryMode('MANUAL');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMsg('Please describe the observed measurement violation.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.grievances.submit({
        instrumentId,
        certificateNumber,
        merchantName,
        location,
        violationType,
        description,
        reporterName,
        reporterPhone,
      });

      if (res.success && res.data?.grievanceId) {
        setSubmittedId(res.data.grievanceId);
      } else {
        setErrorMsg(res.error?.message || 'Failed to submit grievance. Please try again.');
      }
    } catch {
      setErrorMsg('Network error while filing grievance. Please check connectivity.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmittedId(null);
    setDescription('');
    setAutofillSuccess(null);
    onClose();
  };

  return (
    <div className="grievance-modal-overlay">
      <div className="grievance-modal" id="citizen-grievance-modal">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: '#fef2f2', padding: 8, borderRadius: 8, color: '#dc2626' }}>
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, color: '#073b69', fontWeight: 800 }}>
                Citizen Grievance &amp; Violation Report
              </h3>
              <small style={{ color: '#64748b', fontSize: 12 }}>
                Report short-weighing, faulty scales, or broken verification seals
              </small>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {submittedId ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ display: 'inline-flex', background: '#ecfdf3', padding: 16, borderRadius: '50%', color: '#039855', marginBottom: 16 }}>
              <CheckCircle2 size={40} />
            </div>
            <h3 style={{ color: '#027a48', margin: '0 0 8px 0', fontSize: 18, fontWeight: 800 }}>
              Grievance Successfully Registered
            </h3>
            <p style={{ color: '#334155', fontSize: 14, margin: '0 0 16px 0', lineHeight: 1.5 }}>
              Your complaint has been transmitted to the Legal Metrology Flying Squad and Enforcement Cell. A surprise raid team will be dispatched.
            </p>
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 20 }}>
              <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
                Statutory Tracking ID
              </span>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#073b69', marginTop: 4 }}>
                {submittedId}
              </div>
              <small style={{ color: '#94a3b8', fontSize: 11, marginTop: 4, display: 'block' }}>
                Keep this ID for tracking investigation updates.
              </small>
            </div>
            <button className="primary" onClick={handleReset} style={{ width: '100%' }}>
              Done
            </button>
          </div>
        ) : (
          <div>
            {/* Mode Selector Tabs: Manual vs Registered Market Preset vs Scan QR */}
            <div style={{ display: 'flex', gap: 6, background: '#f1f5f9', padding: 4, borderRadius: 8, marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => setEntryMode('MANUAL')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: entryMode === 'MANUAL' ? '#fff' : 'transparent',
                  color: entryMode === 'MANUAL' ? '#073b69' : '#64748b',
                  boxShadow: entryMode === 'MANUAL' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                <FileEdit size={14} />
                Manual Entry
              </button>

              <button
                type="button"
                onClick={() => setEntryMode('PRESET')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: entryMode === 'PRESET' ? '#fff' : 'transparent',
                  color: entryMode === 'PRESET' ? '#073b69' : '#64748b',
                  boxShadow: entryMode === 'PRESET' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                <Building size={14} />
                Select Market Preset (1-Click)
              </button>

              <button
                type="button"
                onClick={() => setEntryMode('SCAN')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: entryMode === 'SCAN' ? '#fff' : 'transparent',
                  color: entryMode === 'SCAN' ? '#073b69' : '#64748b',
                  boxShadow: entryMode === 'SCAN' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                <QrCode size={14} />
                Scan Scale QR
              </button>
            </div>

            {/* Autofill Banner */}
            {autofillSuccess && (
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '10px 14px', borderRadius: 6, fontSize: 12, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={16} color="#059669" />
                <span>{autofillSuccess}</span>
              </div>
            )}

            {/* Entry Mode 2: Market Presets */}
            {entryMode === 'PRESET' && (
              <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
                  Choose a commercial market / registered scale incident to auto-fill details:
                </div>
                {MARKET_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: 12,
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      background: '#fff',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#0284c7';
                      e.currentTarget.style.background = '#f0f9ff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#cbd5e1';
                      e.currentTarget.style.background = '#fff';
                    }}
                  >
                    <Building size={20} color="#0284c7" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <b style={{ display: 'block', fontSize: 13, color: '#0f172a' }}>{p.label}</b>
                      <small style={{ color: '#64748b', fontSize: 11, display: 'block', marginTop: 2 }}>
                        {p.merchantName} · {p.location}
                      </small>
                      <div style={{ display: 'inline-block', marginTop: 4, background: '#fee2e2', color: '#b91c1c', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>
                        {p.violationType}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Entry Mode 3: QR / Photo Scan */}
            {entryMode === 'SCAN' && (
              <div style={{ textAlign: 'center', padding: '24px 16px', background: '#f8fafc', border: '1px dashed #94a3b8', borderRadius: 8, marginBottom: 16 }}>
                <Camera size={36} color="#0284c7" style={{ margin: '0 auto 10px' }} />
                <h4 style={{ margin: '0 0 6px', fontSize: 14, color: '#0f172a' }}>Scan Scale QR Code or Stamping Plate</h4>
                <p style={{ margin: '0 0 14px', fontSize: 12, color: '#64748b' }}>
                  Point your camera at the official government verification QR sticker affixed on the scale.
                </p>
                <button
                  type="button"
                  onClick={handleSimulateScan}
                  className="primary small"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <QrCode size={14} />
                  Simulate QR Scan (Begum Bazar Scale INS-HYD-0001)
                </button>
              </div>
            )}

            {/* Form Fields (Editable in all modes) */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {errorMsg && (
                <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '10px 12px', borderRadius: 6, fontSize: 13 }}>
                  {errorMsg}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Type of Violation *
                </label>
                <select
                  value={violationType}
                  onChange={(e) => setViolationType(e.target.value)}
                  style={{ width: '100%', padding: '9px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, background: '#fff' }}
                >
                  <option>Short-Weighing / Faulty Calibration</option>
                  <option>Verification Seal Broken or Altered (Tampered)</option>
                  <option>Expired Verification Certificate</option>
                  <option>Merchant Refused to Display Statutory Certificate</option>
                  <option>Unauthorized Non-Standard Weight / Measure</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Instrument ID (Optional)
                  </label>
                  <input
                    placeholder="e.g. INS-HYD-0001"
                    value={instrumentId}
                    onChange={(e) => setInstrumentId(e.target.value)}
                    style={{ width: '100%', padding: '9px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Certificate No. (Optional)
                  </label>
                  <input
                    placeholder="e.g. LM-HYD-2026-000184"
                    value={certificateNumber}
                    onChange={(e) => setCertificateNumber(e.target.value)}
                    style={{ width: '100%', padding: '9px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Merchant / Shop Name *
                  </label>
                  <input
                    placeholder="e.g. Ram & Sons Grocery"
                    value={merchantName}
                    onChange={(e) => setMerchantName(e.target.value)}
                    required
                    style={{ width: '100%', padding: '9px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Market / Location *
                  </label>
                  <input
                    placeholder="e.g. Begum Bazar, Hyderabad"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                    style={{ width: '100%', padding: '9px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Details of Discrepancy / Evidence *
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe observed short weight (e.g. scale read 1000g but actual net weight was 850g), damaged seal, or unverified scale..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  style={{ width: '100%', padding: '9px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Your Name (Optional)
                  </label>
                  <input
                    placeholder="Anonymous or Name"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    style={{ width: '100%', padding: '9px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Mobile Number (For Status SMS)
                  </label>
                  <input
                    placeholder="10-digit mobile"
                    value={reporterPhone}
                    onChange={(e) => setReporterPhone(e.target.value)}
                    style={{ width: '100%', padding: '9px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="outline" onClick={onClose} disabled={loading}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="danger"
                  disabled={loading}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#dc2626', color: '#fff', padding: '10px 18px', borderRadius: 6, fontWeight: 700, border: 'none', cursor: 'pointer' }}
                >
                  <Send size={15} />
                  {loading ? 'Filing Statutory Report...' : 'Submit Grievance to Flying Squad'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
