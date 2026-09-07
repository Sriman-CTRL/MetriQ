import { useState, useEffect } from 'react';
import {
  CreditCard,
  Landmark,
  Receipt,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  ExternalLink,
  ShieldCheck,
  Building,
  ArrowRight,
  Printer,
  Sparkles,
  QrCode,
  Check,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { api } from '../api';

export function TreasuryChallanDesk() {
  const [challans, setChallans] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [activePaymentChallan, setActivePaymentChallan] = useState<any | null>(null);
  const [receiptModal, setReceiptModal] = useState<any | null>(null);

  // New challan form
  const [form, setForm] = useState({
    applicantName: '',
    businessName: '',
    district: 'Hyderabad',
    baseFee: '450',
    lateFeePenalty: '0',
    applicationId: `APP-2026-${Math.floor(100000 + Math.random() * 900000)}`,
  });

  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [isProcessingPay, setIsProcessingPay] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, listRes] = await Promise.all([
        api.treasury.getStats(),
        api.treasury.listChallans({ status: statusFilter, search }),
      ]);
      if (statsRes.success) setStats(statsRes.data);
      if (listRes.success && listRes.data) setChallans(listRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, search]);

  const handleCreateChallan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.treasury.generateChallan(form);
      if (res.success) {
        setIsGenerateOpen(false);
        setForm({
          applicantName: '',
          businessName: '',
          district: 'Hyderabad',
          baseFee: '450',
          lateFeePenalty: '0',
          applicationId: `APP-2026-${Math.floor(100000 + Math.random() * 900000)}`,
        });
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulatePayment = async () => {
    if (!activePaymentChallan) return;
    setIsProcessingPay(true);
    try {
      const res = await api.treasury.payChallan({
        challanNumber: activePaymentChallan.challanNumber,
        paymentMethod,
      });
      if (res.success) {
        setActivePaymentChallan(null);
        setReceiptModal(res.data);
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingPay(false);
    }
  };

  return (
    <div className="treasury-desk" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0d3858 0%, #154c79 100%)',
          color: '#fff',
          borderRadius: 8,
          padding: '24px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255,255,255,0.15)',
              padding: '4px 10px',
              borderRadius: 20,
              fontSize: 12,
              marginBottom: 8,
              fontWeight: 600,
            }}
          >
            <Landmark size={15} /> Telangana Cyber Treasury / IFMIS Integrated (Head of Account: 0435-00-101-00-01)
          </div>
          <h1 style={{ fontSize: 24, margin: '4px 0', color: '#fff', fontWeight: 700 }}>
            e-Challan &amp; Treasury Revenue Reconciliation Desk
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: '#dbe8f2', maxWidth: 660 }}>
            Automated statutory fee calculations, instant UPI/Net Banking reconciliation, DDO head accounting, and official treasury scroll receipts for weights and measures verification.
          </p>
        </div>

        <button
          onClick={() => setIsGenerateOpen(true)}
          style={{
            background: '#fff',
            color: '#073b69',
            border: 'none',
            padding: '10px 18px',
            borderRadius: 6,
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Plus size={16} /> Generate e-Challan
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
        <div style={{ background: '#fff', border: '1px solid #d4e0e8', borderRadius: 6, padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#617a8c', fontSize: 12, fontWeight: 600 }}>
            <span>TOTAL TREASURY REVENUE</span>
            <Landmark size={16} color="#073b69" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#073b69', marginTop: 6 }}>
            ₹{(stats?.totalCollected || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: '#0d8a43', marginTop: 4, fontWeight: 600 }}>
            ✓ Major Head 0435 Settled
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #d4e0e8', borderRadius: 6, padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#617a8c', fontSize: 12, fontWeight: 600 }}>
            <span>BASE STAMPING FEES</span>
            <Receipt size={16} color="#0c4d87" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#0c4d87', marginTop: 6 }}>
            ₹{(stats?.baseFeeTotal || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: '#617a8c', marginTop: 4 }}>
            Sub-Head 101 Net Fees
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #d4e0e8', borderRadius: 6, padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#617a8c', fontSize: 12, fontWeight: 600 }}>
            <span>GST &amp; SURCHARGES (18%)</span>
            <Building size={16} color="#456073" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#456073', marginTop: 6 }}>
            ₹{(stats?.gstTotal || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: '#617a8c', marginTop: 4 }}>
            CGST + SGST Reconciled
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #d4e0e8', borderRadius: 6, padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#617a8c', fontSize: 12, fontWeight: 600 }}>
            <span>SETTLED CHALLANS</span>
            <CheckCircle2 size={16} color="#0d8a43" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#0d8a43', marginTop: 6 }}>
            {stats?.paidCount ?? 0}
          </div>
          <div style={{ fontSize: 11, color: '#617a8c', marginTop: 4 }}>
            Pending Payment: {stats?.pendingCount ?? 0}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div style={{ background: '#fff', border: '1px solid #c9d8e2', borderRadius: 8, padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '7px 10px', borderRadius: 4, border: '1px solid #c9d8e2', fontSize: 12, background: '#fff' }}
            >
              <option value="">All Challan Statuses</option>
              <option value="SETTLED_TREASURY">Settled in Treasury</option>
              <option value="PAID">Paid / Awaiting Scroll</option>
              <option value="GENERATED">Generated / Unpaid</option>
            </select>
          </div>

          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search challans..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: '7px 10px 7px 30px',
                borderRadius: 4,
                border: '1px solid #c9d8e2',
                fontSize: 12,
                width: 220,
              }}
            />
            <Search size={14} color="#7592a6" style={{ position: 'absolute', left: 9, top: 10 }} />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f5f8fa', borderBottom: '2px solid #d4e0e8', color: '#073b69', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px' }}>Challan No</th>
                <th style={{ padding: '10px 12px' }}>Merchant / Applicant</th>
                <th style={{ padding: '10px 12px' }}>Accounting Head</th>
                <th style={{ padding: '10px 12px' }}>Base Fee + GST</th>
                <th style={{ padding: '10px 12px' }}>Total Amount</th>
                <th style={{ padding: '10px 12px' }}>Status</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#617a8c' }}>
                    Loading e-Challan records...
                  </td>
                </tr>
              ) : challans.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#617a8c' }}>
                    No treasury challans found.
                  </td>
                </tr>
              ) : (
                challans.map((chl) => (
                  <tr key={chl._id || chl.challanNumber} style={{ borderBottom: '1px solid #e5edf2' }}>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 700, color: '#073b69' }}>
                      {chl.challanNumber}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 600, color: '#183247' }}>{chl.businessName}</div>
                      <div style={{ fontSize: 11, color: '#617a8c' }}>
                        {chl.applicantName} ({chl.district})
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 11, color: '#456073' }}>
                      <div><b>Major:</b> 0435 (Legal Metrology)</div>
                      <div><b>Sub:</b> 101 (Stamping Fees)</div>
                      <div style={{ fontSize: 10, color: '#7a8e9e' }}>DDO: 25000302001</div>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#456073', fontSize: 12 }}>
                      ₹{chl.baseFee} + ₹{chl.gstAmount} GST
                      {chl.lateFeePenalty > 0 && (
                        <div style={{ color: '#b42318', fontSize: 11 }}>+ ₹{chl.lateFeePenalty} Late Fee</div>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 800, color: '#073b69', fontSize: 14 }}>
                      ₹{chl.totalAmount}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 700,
                          background:
                            chl.status === 'SETTLED_TREASURY'
                              ? '#e7f7ed'
                              : chl.status === 'PAID'
                              ? '#e1effa'
                              : '#fff8e6',
                          color:
                            chl.status === 'SETTLED_TREASURY'
                              ? '#0d8a43'
                              : chl.status === 'PAID'
                              ? '#073b69'
                              : '#b26b00',
                        }}
                      >
                        {chl.status === 'SETTLED_TREASURY' ? '✓ Settled Treasury' : chl.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      {chl.status === 'GENERATED' ? (
                        <button
                          onClick={() => setActivePaymentChallan(chl)}
                          style={{
                            padding: '6px 12px',
                            background: '#073b69',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <CreditCard size={13} /> Pay e-Challan
                        </button>
                      ) : (
                        <button
                          onClick={() => setReceiptModal(chl)}
                          style={{
                            padding: '6px 12px',
                            background: '#f0f5f9',
                            color: '#073b69',
                            border: '1px solid #c4d7e5',
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Receipt size={13} /> View Receipt
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Generate Challan */}
      {isGenerateOpen && (
        <div className="grievance-modal-overlay" onClick={() => setIsGenerateOpen(false)}>
          <div className="grievance-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <h2 style={{ fontSize: 18, color: '#073b69', marginBottom: 12 }}>Create Statutory e-Challan</h2>

            {/* Quick Demo Presets */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, alignSelf: 'center' }}>Demo Presets:</span>
              <button
                type="button"
                onClick={() => {
                  setForm({
                    businessName: 'HPCL Jubilee Retail Outlet',
                    applicantName: 'Suresh Reddy',
                    district: 'Hyderabad',
                    baseFee: '2000',
                    lateFeePenalty: '0',
                    applicationId: `APP-2026-${Math.floor(100000 + Math.random() * 900000)}`,
                  });
                }}
                style={{ fontSize: 11, padding: '4px 8px', borderRadius: 4, border: '1px solid #c9d8e2', background: '#f0f5f9', cursor: 'pointer', color: '#073b69', fontWeight: 600 }}
              >
                Petrol Dispenser Re-Verification (4 Units)
              </button>
              <button
                type="button"
                onClick={() => {
                  setForm({
                    businessName: 'Telangana Agri Weighbridge Services',
                    applicantName: 'M. Venkatram',
                    district: 'Khammam',
                    baseFee: '4000',
                    lateFeePenalty: '800',
                    applicationId: `APP-2026-${Math.floor(100000 + Math.random() * 900000)}`,
                  });
                }}
                style={{ fontSize: 11, padding: '4px 8px', borderRadius: 4, border: '1px solid #c9d8e2', background: '#f0f5f9', cursor: 'pointer', color: '#073b69', fontWeight: 600 }}
              >
                Weighbridge with 30-Day Late Penalty
              </button>
            </div>

            <form onSubmit={handleCreateChallan} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Business Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Commercial Mart"
                  value={form.businessName}
                  onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 4, border: '1px solid #c9d8e2' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>Applicant Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Owner / Proprietor"
                    value={form.applicantName}
                    onChange={(e) => setForm({ ...form, applicantName: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 4, border: '1px solid #c9d8e2' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>District</label>
                  <input
                    type="text"
                    required
                    value={form.district}
                    onChange={(e) => setForm({ ...form, district: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 4, border: '1px solid #c9d8e2' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>Base Stamping Fee (₹)</label>
                  <input
                    type="number"
                    required
                    value={form.baseFee}
                    onChange={(e) => setForm({ ...form, baseFee: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 4, border: '1px solid #c9d8e2' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>Late Penalty (₹)</label>
                  <input
                    type="number"
                    value={form.lateFeePenalty}
                    onChange={(e) => setForm({ ...form, lateFeePenalty: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 4, border: '1px solid #c9d8e2' }}
                  />
                </div>
              </div>

              <div style={{ background: '#f5f8fa', padding: 12, borderRadius: 6, fontSize: 12, color: '#456073' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Base Fee + Penalty:</span>
                  <b>₹{Number(form.baseFee) + Number(form.lateFeePenalty)}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>GST (18%):</span>
                  <b>₹{Math.round((Number(form.baseFee) + Number(form.lateFeePenalty)) * 0.18)}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #d4e0e8', paddingTop: 6, fontSize: 14, color: '#073b69', fontWeight: 800 }}>
                  <span>Total Payable:</span>
                  <span>
                    ₹{Math.round((Number(form.baseFee) + Number(form.lateFeePenalty)) * 1.18)}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setIsGenerateOpen(false)}
                  style={{ padding: '8px 14px', background: '#f5f8fa', border: '1px solid #ccd9e2', borderRadius: 4, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', background: '#073b69', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 700, cursor: 'pointer' }}
                >
                  Issue e-Challan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Pay Challan */}
      {activePaymentChallan && (
        <div className="grievance-modal-overlay" onClick={() => setActivePaymentChallan(null)}>
          <div className="grievance-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <h2 style={{ fontSize: 18, color: '#073b69', marginBottom: 4 }}>Telangana State Cyber Treasury Gateway</h2>
            <p style={{ fontSize: 12, color: '#617a8c', marginBottom: 14 }}>
              Challan No: <b>{activePaymentChallan.challanNumber}</b> | Head: <b>0435-00-101</b>
            </p>

            <div style={{ background: '#f4f8fb', border: '1px solid #d8e6ef', borderRadius: 6, padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 13, color: '#183247', marginBottom: 6 }}>
                Remitter: <b>{activePaymentChallan.businessName}</b>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#073b69' }}>
                Amount: ₹{activePaymentChallan.totalAmount}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 8 }}>Select Payment Mode:</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {['UPI', 'NET_BANKING', 'CYBER_TREASURY', 'DEBIT_CREDIT'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentMethod(mode)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 6,
                      border: '1px solid',
                      borderColor: paymentMethod === mode ? '#073b69' : '#d2dfe7',
                      background: paymentMethod === mode ? '#eef5fc' : '#fff',
                      color: paymentMethod === mode ? '#073b69' : '#35536b',
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    {mode.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === 'UPI' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#f8fafc', padding: 12, borderRadius: 6, border: '1px dashed #cbd5e1', marginBottom: 14 }}>
                <div style={{ width: 64, height: 64, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <QrCode size={52} color="#073b69" />
                </div>
                <div style={{ fontSize: 11, color: '#475569' }}>
                  <div style={{ fontWeight: 700, color: '#073b69', marginBottom: 2 }}>Scan &amp; Pay via BHIM / PhonePe / GPay</div>
                  <div>VPA: <b>cybertreasury.tg@sbi</b></div>
                  <div style={{ color: '#0d8a43', fontWeight: 600, marginTop: 2 }}>✓ Zero Transaction Surcharge</div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={() => setActivePaymentChallan(null)}
                style={{ padding: '8px 14px', background: '#f5f8fa', border: '1px solid #ccd9e2', borderRadius: 4, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingPay}
                onClick={handleSimulatePayment}
                style={{
                  padding: '10px 18px',
                  background: '#0d8a43',
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
                {isProcessingPay ? 'Reconciling Treasury...' : 'Authorize & Remit Statutory Fee'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Official Treasury Receipt */}
      {receiptModal && (
        <div className="grievance-modal-overlay" onClick={() => setReceiptModal(null)}>
          <div className="grievance-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580 }}>
            {/* Header */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid #073b69', paddingBottom: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#073b69', letterSpacing: '0.08em' }}>
                GOVERNMENT OF TELANGANA • DIRECTORATE OF TREASURIES AND ACCOUNTS
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#183247', margin: '4px 0' }}>
                CYBER TREASURY STATUTORY e-CHALLAN SCROLL RECEIPT
              </div>
              <div style={{ fontSize: 11, color: '#617a8c' }}>
                Issued under Telangana Treasury Code (TTC) Form 10 &amp; Legal Metrology Act, 2009
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12, marginBottom: 14, background: '#f8fafc', padding: 12, borderRadius: 6 }}>
              <div><b>Challan Number:</b> <span style={{ fontFamily: 'monospace', color: '#073b69', fontWeight: 700 }}>{receiptModal.challanNumber}</span></div>
              <div><b>Scroll Number:</b> <span style={{ fontFamily: 'monospace', color: '#0d8a43', fontWeight: 700 }}>{receiptModal.treasuryScrollNumber || 'SCR-2026-98124'}</span></div>
              <div><b>Transaction Ref:</b> <span style={{ fontFamily: 'monospace' }}>{receiptModal.transactionReference || 'TXN-UPI-982173901928'}</span></div>
              <div><b>Payment Mode:</b> <b>{receiptModal.paymentMethod || 'UPI'}</b></div>
              <div><b>Major Head:</b> 0435 (Legal Metrology)</div>
              <div><b>Sub Head:</b> 101 (Stamping Fees)</div>
              <div><b>Remitter:</b> {receiptModal.businessName}</div>
              <div><b>Applicant:</b> {receiptModal.applicantName}</div>
            </div>

            <div style={{ background: '#f5f8fa', border: '1px solid #d4e0e8', borderRadius: 6, padding: 12, fontSize: 13, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>Base Stamping Fee:</span>
                <span>₹{receiptModal.baseFee}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>Late Fee Penalty:</span>
                <span>₹{receiptModal.lateFeePenalty || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>Goods &amp; Service Tax (18%):</span>
                <span>₹{receiptModal.gstAmount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #073b69', paddingTop: 6, fontWeight: 800, color: '#073b69', fontSize: 15 }}>
                <span>Total Amount Remitted:</span>
                <span>₹{receiptModal.totalAmount}</span>
              </div>
            </div>

            <div style={{ textAlign: 'center', fontSize: 11, color: '#0d8a43', fontWeight: 700, marginBottom: 16, background: '#e7f7ed', padding: '6px 10px', borderRadius: 4 }}>
              ✓ Statutorily Acknowledged &amp; Deposited in Consolidated Fund of Telangana
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={() => window.print()}
                style={{ padding: '8px 14px', background: '#f0f5f9', border: '1px solid #c4d7e5', borderRadius: 4, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}
              >
                <Printer size={14} /> Print Formal Receipt
              </button>
              <button
                onClick={() => setReceiptModal(null)}
                style={{ padding: '8px 16px', background: '#073b69', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 700, cursor: 'pointer', fontSize: 12 }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
