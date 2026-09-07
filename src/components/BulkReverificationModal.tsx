import React, { useState } from 'react';
import {
  Scale,
  CheckSquare,
  Square,
  FileCheck2,
  Calendar,
  X,
  CreditCard,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../api';

interface BulkReverificationModalProps {
  instruments: any[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkReverificationModal({ instruments, isOpen, onClose, onSuccess }: BulkReverificationModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    instruments.filter((i) => i.status === 'Expired' || i.status === 'EXPIRED').map((i) => i.id || i.instrumentId)
  );
  const [preferredDate, setPreferredDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().slice(0, 10);
  });
  const [preferredSlot, setPreferredSlot] = useState('MORNING');
  const [locationNote, setLocationNote] = useState('All machines available at central warehouse counter.');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === instruments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(instruments.map((i) => i.id || i.instrumentId));
    }
  };

  // Fee calculation: ₹450 per standard electronic counter scale, ₹1500 for weighbridge
  const estimatedFee = selectedIds.reduce((sum, id) => {
    const inst = instruments.find((i) => (i.id || i.instrumentId) === id);
    const fee = inst?.type?.toLowerCase().includes('weighbridge') ? 1500 : 450;
    return sum + fee;
  }, 0);

  const gst = Math.round(estimatedFee * 0.18);
  const total = estimatedFee + gst;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) {
      alert('Please select at least one instrument for bulk re-verification.');
      return;
    }
    setSubmitting(true);
    try {
      // Submit application for the selected instruments
      const firstInst = instruments.find((i) => (i.id || i.instrumentId) === selectedIds[0]);
      await api.applications.create({
        applicantName: firstInst?.owner || 'Demo Retail Enterprises',
        businessName: firstInst?.owner || 'Demo Retail Enterprises',
        mobile: '98480 99999',
        email: 'owner@metriq.demo',
        verificationType: 'PERIODIC_REVERIFICATION',
        location: {
          address: firstInst?.location || '12, Market Road, Hyderabad',
          district: 'Hyderabad',
          state: 'Telangana',
        },
        instruments: selectedIds.map((id) => {
          const inst = instruments.find((i) => (i.id || i.instrumentId) === id);
          return {
            instrumentId: id,
            type: inst?.type || 'Electronic Weighing Instrument',
            manufacturer: inst?.manufacturer || 'Standard Metrology Corp',
            model: inst?.model || 'EWS-300',
            serialNumber: inst?.serial || id,
            capacity: inst?.capacity || '300 kg',
            accuracyClass: 'Class III',
          };
        }),
        feeAmount: total,
      });

      setSubmitted(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2500);
    } catch (err: any) {
      alert(err.message || 'Failed to submit bulk re-verification');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 8, maxWidth: 640, width: '100%', padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#175cd3', textTransform: 'uppercase' }}>
              TRADER CONVENIENCE · LEGAL METROLOGY ACT, 2009
            </div>
            <h3 style={{ margin: 0, fontSize: 18, color: '#073b69', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Scale size={20} /> Bulk Annual Re-Verification Application
            </h3>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          <div style={{ padding: '32px 16px', textAlign: 'center' }}>
            <CheckCircle2 size={48} color="#16a34a" style={{ margin: '0 auto 12px auto' }} />
            <h4 style={{ margin: 0, color: '#073b69', fontSize: 18 }}>Bulk Re-Verification Submitted!</h4>
            <p style={{ color: '#64748b', fontSize: 14, margin: '8px 0 0 0' }}>
              Consolidated re-verification requested for {selectedIds.length} weighing scales. Application forwarded to Hyderabad Circle Legal Metrology Office for officer dispatch.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px 0' }}>
              Select all commercial instruments due for periodic statutory stamping. Single consolidated fee remittance with automatic inspection slot booking.
            </p>

            {/* Instrument Selection List */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: 12, marginBottom: 16, background: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
                  Select Instruments ({selectedIds.length} of {instruments.length} selected)
                </span>
                <button type="button" className="outline small" onClick={selectAll} style={{ fontSize: 11, padding: '2px 8px' }}>
                  {selectedIds.length === instruments.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div style={{ display: 'grid', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
                {instruments.map((inst) => {
                  const id = inst.id || inst.instrumentId;
                  const isChecked = selectedIds.includes(id);
                  const isExpired = inst.status === 'Expired' || inst.status === 'EXPIRED';

                  return (
                    <div
                      key={id}
                      onClick={() => toggleSelect(id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 10px',
                        background: '#fff',
                        border: isChecked ? '1px solid #93c5fd' : '1px solid #e2e8f0',
                        borderRadius: 6,
                        cursor: 'pointer',
                      }}
                    >
                      {isChecked ? (
                        <CheckSquare size={16} color="#2563eb" />
                      ) : (
                        <Square size={16} color="#94a3b8" />
                      )}
                      <div style={{ flex: 1, fontSize: 12 }}>
                        <b style={{ color: '#073b69' }}>{id}</b> · {inst.type} ({inst.capacity || 'Class III'})
                        <div style={{ color: '#64748b', fontSize: 11 }}>
                          Serial: {inst.serial || 'N/A'} · Current Cert: {inst.certificate || 'N/A'}
                        </div>
                      </div>
                      {isExpired ? (
                        <span style={{ fontSize: 10, background: '#fef3f2', color: '#b42318', padding: '2px 6px', borderRadius: 10, fontWeight: 700 }}>
                          EXPIRED
                        </span>
                      ) : (
                        <span style={{ fontSize: 10, background: '#ecfdf3', color: '#027a48', padding: '2px 6px', borderRadius: 10, fontWeight: 700 }}>
                          VALID
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Date & Slot Scheduling */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Preferred Verification Date
                </label>
                <input
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  required
                  style={{ width: '100%', padding: 8, fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 6 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Time Window
                </label>
                <select
                  value={preferredSlot}
                  onChange={(e) => setPreferredSlot(e.target.value)}
                  style={{ width: '100%', padding: 8, fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 6, background: '#fff' }}
                >
                  <option value="MORNING">Morning (10:00 AM – 01:00 PM)</option>
                  <option value="AFTERNOON">Afternoon (02:00 PM – 05:00 PM)</option>
                </select>
              </div>
            </div>

            {/* Statutory Fee Calculator */}
            <div style={{ background: '#eff8ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: 14, marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#1e40af', marginBottom: 4 }}>
                <span>Statutory Testing Fee ({selectedIds.length} instruments):</span>
                <b>₹{estimatedFee.toLocaleString()}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginBottom: 6 }}>
                <span>GST @ 18% (Telangana State Treasury):</span>
                <span>₹{gst.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800, color: '#073b69', borderTop: '1px solid #dbeafe', paddingTop: 6 }}>
                <span>Total Treasury Remittance:</span>
                <span>₹{total.toLocaleString()}</span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="outline" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="primary" disabled={submitting || selectedIds.length === 0}>
                {submitting ? 'Submitting Application...' : `Pay & Submit (${selectedIds.length} Scales)`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
