import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, X, Send } from 'lucide-react';
import { api } from '../api';
import { useI18n } from '../i18n';

interface GrievanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillInstrumentId?: string;
  prefillCertificateNumber?: string;
}

export const GrievanceModal: React.FC<GrievanceModalProps> = ({
  isOpen,
  onClose,
  prefillInstrumentId = '',
  prefillCertificateNumber = '',
}) => {
  const { t } = useI18n();
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

  if (!isOpen) return null;

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
    onClose();
  };

  return (
    <div className="grievance-modal-overlay">
      <div className="grievance-modal">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ background: '#fef3f2', padding: 8, borderRadius: 6, color: '#d92d20' }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, color: '#073b69' }}>
                Citizen Grievance &amp; Violation Report
              </h3>
              <small style={{ color: '#667085' }}>Legal Metrology Statutory Consumer Protection</small>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#667085' }}
          >
            <X size={20} />
          </button>
        </div>

        {submittedId ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ display: 'inline-flex', background: '#ecfdf3', padding: 16, borderRadius: '50%', color: '#039855', marginBottom: 16 }}>
              <CheckCircle2 size={36} />
            </div>
            <h3 style={{ color: '#027a48', margin: '0 0 8px 0' }}>Grievance Successfully Registered</h3>
            <p style={{ color: '#344054', fontSize: 14, margin: '0 0 16px 0' }}>
              Your complaint has been transmitted directly to the State Legal Metrology Enforcement Cell.
            </p>
            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 6, border: '1px solid #e2e8f0', marginBottom: 20 }}>
              <span style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>
                Statutory Tracking ID
              </span>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#073b69', marginTop: 4 }}>
                {submittedId}
              </div>
            </div>
            <button className="primary" onClick={handleReset} style={{ width: '100%' }}>
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {errorMsg && (
              <div style={{ background: '#fef3f2', color: '#b42318', padding: '10px 12px', borderRadius: 6, fontSize: 13 }}>
                {errorMsg}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#344054', marginBottom: 4 }}>
                Type of Violation *
              </label>
              <select
                value={violationType}
                onChange={(e) => setViolationType(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid #d0d5dd', fontSize: 13 }}
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
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#344054', marginBottom: 4 }}>
                  Instrument ID (Optional)
                </label>
                <input
                  placeholder="e.g. INS-HYD-0001"
                  value={instrumentId}
                  onChange={(e) => setInstrumentId(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid #d0d5dd', fontSize: 13 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#344054', marginBottom: 4 }}>
                  Certificate No. (Optional)
                </label>
                <input
                  placeholder="e.g. LM-HYD-2026-000184"
                  value={certificateNumber}
                  onChange={(e) => setCertificateNumber(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid #d0d5dd', fontSize: 13 }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#344054', marginBottom: 4 }}>
                  Merchant / Shop Name
                </label>
                <input
                  placeholder="e.g. Ram & Sons Grocery"
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid #d0d5dd', fontSize: 13 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#344054', marginBottom: 4 }}>
                  Market / Location
                </label>
                <input
                  placeholder="e.g. Begum Bazar, Hyderabad"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid #d0d5dd', fontSize: 13 }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#344054', marginBottom: 4 }}>
                Details of Discrepancy *
              </label>
              <textarea
                rows={3}
                placeholder="Explain the incident (e.g. scale read 1.0 kg but actual net weight was 850g, verification seal was cut)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid #d0d5dd', fontSize: 13, resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#344054', marginBottom: 4 }}>
                  Your Name (Optional)
                </label>
                <input
                  placeholder="Anonymous or Name"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid #d0d5dd', fontSize: 13 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#344054', marginBottom: 4 }}>
                  Mobile (For SMS updates)
                </label>
                <input
                  placeholder="10-digit number"
                  value={reporterPhone}
                  onChange={(e) => setReporterPhone(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid #d0d5dd', fontSize: 13 }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              <button type="button" className="outline" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="danger" disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Send size={14} />
                {loading ? 'Filing Report...' : 'File Grievance'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
