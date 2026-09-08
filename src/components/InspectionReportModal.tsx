import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  X,
  Printer,
  FileCheck,
  AlertTriangle,
  Scale,
  Calendar,
  User,
  Building,
  BadgeCheck,
  Download,
} from 'lucide-react';

interface InspectionReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  instrument: any;
  mismatch: boolean;
  onSaveReport?: (report: any) => void;
}

export const InspectionReportModal: React.FC<InspectionReportModalProps> = ({
  isOpen,
  onClose,
  instrument,
  mismatch,
  onSaveReport,
}) => {
  const [saved, setSaved] = useState(false);
  const [reportNumber] = useState(`INSP-2026-HYD-${Math.floor(1000 + Math.random() * 9000)}`);
  const [dateStr] = useState(new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }));

  if (!isOpen) return null;

  const handleSave = () => {
    setSaved(true);
    if (onSaveReport) {
      onSaveReport({
        reportNumber,
        date: dateStr,
        instrumentId: instrument?.instrumentId || 'INS-HYD-0001',
        status: mismatch ? 'FLAGGED_TAMPER' : 'COMPLIANT',
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="grievance-modal-overlay">
      <div
        className="grievance-modal"
        style={{
          maxWidth: 720,
          background: '#ffffff',
          borderRadius: 8,
          boxShadow: '0 20px 45px rgba(0,0,0,0.25)',
          padding: 0,
          overflow: 'hidden',
        }}
      >
        {/* Modal Top Bar */}
        <div
          style={{
            background: mismatch ? '#7f1d1d' : '#064e3b',
            color: '#fff',
            padding: '16px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {mismatch ? (
              <ShieldAlert size={26} color="#fca5a5" />
            ) : (
              <CheckCircle2 size={26} color="#86efac" />
            )}
            <div>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.85, fontWeight: 700 }}>
                {mismatch ? 'Statutory Tamper & Non-Compliance Notice' : 'Verification Compliance Report'}
              </div>
              <h2 style={{ margin: 0, fontSize: 18, color: '#fff', fontWeight: 800 }}>
                Form 1: Field Inspection &amp; Physical Evidence Audit
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Modal Body: Formal Government Inspection Report */}
        <div style={{ padding: '24px 28px', maxHeight: '75vh', overflowY: 'auto' }}>
          {/* Header Metadata */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e2e8f0', paddingBottom: 16, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Report Reference</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{reportNumber}</div>
              <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
                Section 15, Legal Metrology Act, 2009
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Inspection Date</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{dateStr}</div>
              <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>Division: Hyderabad Central Circle</div>
            </div>
          </div>

          {/* Finding Status Box */}
          <div
            style={{
              background: mismatch ? '#fef2f2' : '#f0fdf4',
              border: `1px solid ${mismatch ? '#fecaca' : '#bbf7d0'}`,
              borderRadius: 8,
              padding: 16,
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {mismatch ? (
                <AlertTriangle size={24} color="#dc2626" />
              ) : (
                <BadgeCheck size={24} color="#16a34a" />
              )}
              <div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: 0.5,
                    color: mismatch ? '#991b1b' : '#166534',
                    textTransform: 'uppercase',
                  }}
                >
                  {mismatch ? 'PHYSICAL TAMPERING & NON-COMPLIANCE CONFIRMED' : 'PHYSICAL VERIFICATION PASSED: FULLY COMPLIANT'}
                </span>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: mismatch ? '#7f1d1d' : '#14532d', lineHeight: 1.4 }}>
                  {mismatch
                    ? 'Security lead seal severed/altered (#LM-2026-0814-TAMPERED) and serial number mismatch detected against state baseline. Instrument seized under Section 15(1)(b).'
                    : 'Security lead seal (#LM-2026-0814) intact with genuine state stamping mark. Calibration within Maximum Permissible Error (MPE) tolerances.'}
                </p>
              </div>
            </div>
          </div>

          {/* Inspection Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 6, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>
                Instrument Inspected
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                {instrument?.instrumentId || 'INS-HYD-0001'}
              </div>
              <div style={{ fontSize: 12, color: '#334155', marginTop: 2 }}>
                Type: {instrument?.type || 'Electronic Weighing Scale'} (Class III)
              </div>
              <div style={{ fontSize: 12, color: '#334155' }}>
                Serial No: {mismatch ? (instrument?.serialNumber || 'EWS300-98231').replace(/\d+$/, '999 (MISMATCH)') : (instrument?.serialNumber || 'EWS300-98231')}
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 6, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>
                Commercial Establishment
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                {instrument?.ownerName || 'Ram & Sons Grocery Store'}
              </div>
              <div style={{ fontSize: 12, color: '#334155', marginTop: 2 }}>
                Location: Begum Bazar Main Market, Hyderabad
              </div>
              <div style={{ fontSize: 12, color: '#334155' }}>
                Certificate: {instrument?.certificateNumber || 'LM-HYD-2026-000184'}
              </div>
            </div>
          </div>

          {/* Evidence Comparison Table */}
          <table style={{ width: '100%', minWidth: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 20 }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569' }}>Inspection Parameter</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569' }}>Registered Baseline</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569' }}>Observed Evidence</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: '#475569' }}>Verification Result</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '8px 12px', fontWeight: 600 }}>Security Wire / Lead Seal</td>
                <td style={{ padding: '8px 12px' }}>#LM-2026-0814 (Intact)</td>
                <td style={{ padding: '8px 12px', color: mismatch ? '#dc2626' : '#16a34a', fontWeight: 600 }}>
                  {mismatch ? 'Altered / Severed Seal' : '#LM-2026-0814 (Intact)'}
                </td>
                <td style={{ padding: '8px 12px', fontWeight: 700, color: mismatch ? '#dc2626' : '#16a34a' }}>
                  {mismatch ? 'FAIL (Violation Sec 24)' : 'PASS (Compliant)'}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '8px 12px', fontWeight: 600 }}>Chassis Serial Match</td>
                <td style={{ padding: '8px 12px' }}>{instrument?.serialNumber || 'EWS300-98231'}</td>
                <td style={{ padding: '8px 12px', color: mismatch ? '#dc2626' : '#16a34a', fontWeight: 600 }}>
                  {mismatch ? (instrument?.serialNumber || 'EWS300-98231').replace(/\d+$/, '999') : (instrument?.serialNumber || 'EWS300-98231')}
                </td>
                <td style={{ padding: '8px 12px', fontWeight: 700, color: mismatch ? '#dc2626' : '#16a34a' }}>
                  {mismatch ? 'FAIL (Chassis Swapped)' : 'PASS (Matched)'}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '8px 12px', fontWeight: 600 }}>Calibration Drift (MPE)</td>
                <td style={{ padding: '8px 12px' }}>±0.5g Standard Allowance</td>
                <td style={{ padding: '8px 12px', color: mismatch ? '#dc2626' : '#16a34a', fontWeight: 600 }}>
                  {mismatch ? '+8.5g (Excess Inaccuracy)' : '±0.1g (Within Limit)'}
                </td>
                <td style={{ padding: '8px 12px', fontWeight: 700, color: mismatch ? '#dc2626' : '#16a34a' }}>
                  {mismatch ? 'FAIL (Short-Weighing)' : 'PASS (Compliant)'}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Legal Metrology Enforcement Directives */}
          <div style={{ background: '#f8fafc', padding: 14, borderRadius: 6, border: '1px solid #e2e8f0', marginBottom: 20, fontSize: 12, color: '#334155' }}>
            <b style={{ color: '#0f172a', display: 'block', marginBottom: 4 }}>
              Statutory Officer Directive &amp; Audit Trail Endorsement:
            </b>
            {mismatch ? (
              <p style={{ margin: 0, lineHeight: 1.5 }}>
                Pursuant to powers under Section 15 of the Legal Metrology Act, 2009, the subject instrument is seized to Malkhana custody. Compounding summons issued under Section 48 for compounding fee adjudication. Case docket forwarded to JMFC Court in event of non-compounding.
              </p>
            ) : (
              <p style={{ margin: 0, lineHeight: 1.5 }}>
                Instrument and weights verified on-site by inspecting officer. Quarterly verification stamp endorsed in Form 3 register. Stamping validity renewed for statutory commercial usage.
              </p>
            )}
          </div>

          {/* Signatures */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
            <div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Inspecting Officer</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Officer R. Kumar, LMO</div>
              <div style={{ fontSize: 11, color: '#0284c7' }}>Digital ID: LMO-TS-HYD-042 (Verified)</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#64748b' }}>Authorizing Authority</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Controller of Legal Metrology</div>
              <div style={{ fontSize: 11, color: '#16a34a' }}>Cryptographic SHA-256 Hash Verified</div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div
          style={{
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            padding: '14px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {saved ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#16a34a', fontSize: 13, fontWeight: 700 }}>
              <CheckCircle2 size={16} />
              Inspection Report recorded in state audit trail registry!
            </div>
          ) : (
            <div style={{ fontSize: 12, color: '#64748b' }}>
              Ready for endorsement &amp; registry logging.
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#fff',
                border: '1px solid #cbd5e1',
                padding: '8px 14px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                color: '#334155',
                cursor: 'pointer',
              }}
            >
              <Printer size={14} /> Print Memo
            </button>
            {!saved && (
              <button
                onClick={handleSave}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#0284c7',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                <FileCheck size={14} /> Record &amp; Save Report
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: '#334155',
                border: 'none',
                padding: '8px 16px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
