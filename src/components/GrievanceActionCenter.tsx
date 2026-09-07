import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Search,
  RefreshCw,
  CheckCircle2,
  FileText,
  UserCheck,
  Scale,
  DollarSign,
  X,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../api';

export function GrievanceActionCenter() {
  const [grievances, setGrievances] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, pending: 0, investigating: 0, confirmedViolations: 0, resolved: 0, totalPenaltiesCompounded: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedGrievance, setSelectedGrievance] = useState<any>(null);

  // Action modal state
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('INSPECTOR_DISPATCHED');
  const [officerRemarks, setOfficerRemarks] = useState('');
  const [penaltyAmount, setPenaltyAmount] = useState(10000);
  const [assignedOfficer, setAssignedOfficer] = useState('Officer R. Kumar (LMO)');
  const [updating, setUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        api.grievances.list({ status: statusFilter, search }),
        api.grievances.getStats(),
      ]);
      if (listRes.success && listRes.data) setGrievances(listRes.data);
      if (statsRes.success && statsRes.data) setStats(statsRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, search]);

  const handleOpenAction = (g: any) => {
    setSelectedGrievance(g);
    setNewStatus(g.status === 'SUBMITTED' ? 'INSPECTOR_DISPATCHED' : 'VIOLATION_CONFIRMED');
    setOfficerRemarks(g.officerRemarks || '');
    setPenaltyAmount(g.penaltyAmount || 10000);
    setActionModalOpen(true);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGrievance) return;
    setUpdating(true);
    try {
      const res = await api.grievances.updateStatus(selectedGrievance.grievanceId, {
        status: newStatus,
        officerRemarks,
        penaltyAmount: Number(penaltyAmount),
        assignedOfficerName: assignedOfficer,
      });

      if (res.success) {
        setActionModalOpen(false);
        setSuccessMsg(`Grievance ${selectedGrievance.grievanceId} updated to ${newStatus}. Statutory enforcement notice logged.`);
        loadData();
        setTimeout(() => setSuccessMsg(''), 5000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update grievance');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="grievance-action-center">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fef3f2', color: '#b42318', padding: '3px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
            <ShieldAlert size={13} /> ENFORCEMENT &amp; VIGILANCE CELL · SECTION 30 / 38
          </div>
          <h2 style={{ margin: 0, fontSize: 22, color: '#073b69' }}>Citizen Grievance &amp; Violation Redressal Desk</h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: 13 }}>
            Triage short-weighing complaints, dispatch flying inspection squads, and issue compounding seizure notices.
          </p>
        </div>
      </div>

      {successMsg && (
        <div style={{ background: '#ecfdf3', color: '#027a48', padding: '12px 16px', borderRadius: 6, fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      {/* Stats Ribbon */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Complaints</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#073b69', marginTop: 4 }}>{stats.total || 0}</div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #fedf89', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#b54708', textTransform: 'uppercase' }}>Pending Scrutiny</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#b54708', marginTop: 4 }}>{stats.pending || 0}</div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #bfdbfe', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase' }}>Squads Dispatched</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#2563eb', marginTop: 4 }}>{stats.investigating || 0}</div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #fecdca', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#b42318', textTransform: 'uppercase' }}>Violations Confirmed</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#dc2626', marginTop: 4 }}>{stats.confirmedViolations || 0}</div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #bbf7d0', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#15803d', textTransform: 'uppercase' }}>Compounded Penalties</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#16a34a', marginTop: 4 }}>
            ₹{(stats.totalPenaltiesCompounded || 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
          <div style={{ position: 'relative', minWidth: 260 }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by ID, merchant name, location, instrument..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 10px 8px 34px', fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 6 }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '8px 12px', fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 6, background: '#fff' }}
          >
            <option value="">All Complaint Statuses</option>
            <option value="SUBMITTED">Newly Submitted (Citizen)</option>
            <option value="INSPECTOR_DISPATCHED">Inspector Squad Dispatched</option>
            <option value="VIOLATION_CONFIRMED">Violation Confirmed On-Site</option>
            <option value="PENALTY_COMPOUNDED">Penalty Compounded</option>
            <option value="RESOLVED">Resolved &amp; Closed</option>
          </select>
        </div>

        <button className="outline small" onClick={loadData}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {/* Grievances List */}
      <div style={{ display: 'grid', gap: 12 }}>
        {loading ? (
          <div style={{ background: '#fff', padding: 24, textAlign: 'center', color: '#64748b', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            Loading grievances...
          </div>
        ) : grievances.length === 0 ? (
          <div style={{ background: '#fff', padding: 24, textAlign: 'center', color: '#64748b', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            No grievances found matching criteria.
          </div>
        ) : (
          grievances.map((g) => {
            let statusBg = '#f1f5f9';
            let statusColor = '#475467';
            if (g.status === 'SUBMITTED') {
              statusBg = '#fef3f2';
              statusColor = '#b42318';
            } else if (g.status === 'INSPECTOR_DISPATCHED') {
              statusBg = '#eff8ff';
              statusColor = '#175cd3';
            } else if (g.status === 'VIOLATION_CONFIRMED') {
              statusBg = '#fef08a';
              statusColor = '#854d0e';
            } else if (g.status === 'PENALTY_COMPOUNDED' || g.status === 'RESOLVED') {
              statusBg = '#ecfdf3';
              statusColor = '#027a48';
            }

            return (
              <div
                key={g._id || g.grievanceId}
                style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 18 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#073b69', fontSize: 14 }}>
                      {g.grievanceId}
                    </span>
                    <span style={{ background: statusBg, color: statusColor, padding: '3px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                      {g.status.replace(/_/g, ' ')}
                    </span>
                    <span style={{ fontSize: 12, color: '#64748b' }}>
                      Filed: {new Date(g.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <button
                    className="outline small"
                    onClick={() => handleOpenAction(g)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    Take Statutory Action <ChevronRight size={14} />
                  </button>
                </div>

                <div style={{ fontSize: 14, fontWeight: 700, color: '#b42318', marginBottom: 4 }}>
                  {g.violationType}
                </div>

                <p style={{ fontSize: 13, color: '#334155', margin: '0 0 10px 0' }}>
                  {g.description}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12, color: '#475467', background: '#f8fafc', padding: '8px 12px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                  <div>
                    <b>Merchant:</b> {g.merchantName || 'Not specified'}
                  </div>
                  <div>
                    <b>Location:</b> {g.location || 'Hyderabad'}
                  </div>
                  {g.instrumentId && (
                    <div>
                      <b>Instrument:</b> <span style={{ fontFamily: 'monospace' }}>{g.instrumentId}</span>
                    </div>
                  )}
                  {g.certificateNumber && (
                    <div>
                      <b>Certificate:</b> <span style={{ fontFamily: 'monospace' }}>{g.certificateNumber}</span>
                    </div>
                  )}
                  {g.penaltyAmount > 0 && (
                    <div style={{ color: '#027a48', fontWeight: 700 }}>
                      Compounded Penalty: ₹{g.penaltyAmount.toLocaleString()}
                    </div>
                  )}
                </div>

                {g.officerRemarks && (
                  <div style={{ marginTop: 10, fontSize: 12, color: '#0369a1', background: '#f0f9ff', padding: '6px 10px', borderRadius: 4 }}>
                    <b>Officer Remarks:</b> {g.officerRemarks}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Action Modal */}
      {actionModalOpen && selectedGrievance && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 8, maxWidth: 540, width: '100%', padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, color: '#073b69', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Scale size={18} /> Statutory Action: {selectedGrievance.grievanceId}
              </h3>
              <button className="icon-btn" onClick={() => setActionModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Statutory Enforcement Stage
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  style={{ width: '100%', padding: 8, fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 6, background: '#fff' }}
                >
                  <option value="INSPECTOR_DISPATCHED">Dispatch Flying Squad (Surprise Check)</option>
                  <option value="INVESTIGATING">Physical Weight Testing In Progress</option>
                  <option value="VIOLATION_CONFIRMED">Violation Confirmed (Issue Section 30 Notice)</option>
                  <option value="SEIZURE_ORDER_ISSUED">Confiscate Unverified Machine (Seizure Order)</option>
                  <option value="PENALTY_COMPOUNDED">Compound Offence &amp; Collect Penalty</option>
                  <option value="RESOLVED">Resolution Complete (Re-verified &amp; Sealed)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Assigned LMO / Inspector
                  </label>
                  <input
                    type="text"
                    value={assignedOfficer}
                    onChange={(e) => setAssignedOfficer(e.target.value)}
                    required
                    style={{ width: '100%', padding: 8, fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 6 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Compounding Penalty (₹)
                  </label>
                  <input
                    type="number"
                    value={penaltyAmount}
                    onChange={(e) => setPenaltyAmount(Number(e.target.value))}
                    min={0}
                    step={1000}
                    style={{ width: '100%', padding: 8, fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 6 }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Statutory Findings &amp; Enforcement Order
                </label>
                <textarea
                  value={officerRemarks}
                  onChange={(e) => setOfficerRemarks(e.target.value)}
                  placeholder="E.g. Inspection conducted under Section 30. Tolerance error of +120g verified using standard weights. Notice issued..."
                  rows={4}
                  required
                  style={{ width: '100%', padding: 8, fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 6 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="outline" onClick={() => setActionModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary" disabled={updating}>
                  {updating ? 'Recording...' : 'Execute Statutory Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
