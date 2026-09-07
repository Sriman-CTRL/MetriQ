import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Tag,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Layers,
  FileCheck2,
  RefreshCw,
  X,
} from 'lucide-react';
import { api } from '../api';

export function SealLedger() {
  const [seals, setSeals] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, available: 0, affixed: 0, damaged: 0, tampered: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [tamperModalOpen, setTamperModalOpen] = useState(false);
  const [selectedSeal, setSelectedSeal] = useState<any>(null);

  // Form states for batch generation
  const [prefix, setPrefix] = useState('TS-LM-2026');
  const [startNum, setStartNum] = useState('200');
  const [count, setCount] = useState(25);
  const [sealType, setSealType] = useState('LEAD_WIRE');
  const [generating, setGenerating] = useState(false);
  const [tamperReason, setTamperReason] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        api.seals.list({ status: statusFilter, search }),
        api.seals.getStats(),
      ]);
      if (listRes.success && listRes.data) setSeals(listRes.data);
      if (statsRes.success && statsRes.data) setStats(statsRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, search]);

  const handleGenerateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await api.seals.batchGenerate({
        prefix,
        startNumber: startNum,
        count: Number(count),
        sealType,
      });
      if (res.success) {
        setBatchModalOpen(false);
        setActionSuccess(`Successfully minted ${res.data?.count} statutory seals under batch ${res.data?.batchNumber}.`);
        loadData();
        setTimeout(() => setActionSuccess(''), 5000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to issue batch');
    } finally {
      setGenerating(false);
    }
  };

  const handleReportTamper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeal || !tamperReason) return;
    try {
      const res = await api.seals.reportTamper({
        sealNumber: selectedSeal.sealNumber,
        reason: tamperReason,
      });
      if (res.success) {
        setTamperModalOpen(false);
        setSelectedSeal(null);
        setTamperReason('');
        setActionSuccess(`Seal ${selectedSeal.sealNumber} flagged as TAMPERED and escalated to Enforcement Squad.`);
        loadData();
        setTimeout(() => setActionSuccess(''), 5000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to record tamper status');
    }
  };

  return (
    <div className="seal-ledger-module">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eff8ff', color: '#175cd3', padding: '3px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
            <Lock size={13} /> STATUTORY CUSTODY CHAIN · LEGAL METROLOGY ACT, 2009
          </div>
          <h2 style={{ margin: 0, fontSize: 22, color: '#073b69' }}>Digital Seal &amp; Security Hologram Registry</h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: 13 }}>
            Prevents black-market seal reuse, enforces serialized custody to LMOs, and tracks physical seals on verified instruments.
          </p>
        </div>
        <button
          className="primary"
          onClick={() => setBatchModalOpen(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <Plus size={16} /> Issue Statutory Seal Batch
        </button>
      </div>

      {actionSuccess && (
        <div style={{ background: '#ecfdf3', color: '#027a48', padding: '12px 16px', borderRadius: 6, fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={16} /> {actionSuccess}
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Serialized Seals</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#073b69', marginTop: 4 }}>{stats.total || 0}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Central &amp; field custody</div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #bbf7d0', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#15803d', textTransform: 'uppercase' }}>Available In Officer Custody</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#16a34a', marginTop: 4 }}>{stats.available || 0}</div>
          <div style={{ fontSize: 12, color: '#15803d', marginTop: 4 }}>Ready to affix during verification</div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #bfdbfe', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase' }}>Affixed to Active Scales</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#2563eb', marginTop: 4 }}>{stats.affixed || 0}</div>
          <div style={{ fontSize: 12, color: '#1d4ed8', marginTop: 4 }}>Bound with cryptographic certs</div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #fecaca', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#b91c1c', textTransform: 'uppercase' }}>Flagged Tampered / Broken</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#dc2626', marginTop: 4 }}>{stats.tampered || 0}</div>
          <div style={{ fontSize: 12, color: '#b91c1c', marginTop: 4 }}>Enforcement proceedings active</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
          <div style={{ position: 'relative', minWidth: 260 }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search seal #, batch, instrument, officer..."
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
            <option value="">All Seal Statuses</option>
            <option value="AVAILABLE">Available (Officer Custody)</option>
            <option value="AFFIXED">Affixed to Certified Scale</option>
            <option value="FLAGGED_TAMPERED">Flagged Tampered / Broken</option>
            <option value="DAMAGED_VOID">Damaged / Voided</option>
          </select>
        </div>

        <button className="outline small" onClick={loadData} title="Refresh seal registry">
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {/* Seals Table */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475467', fontWeight: 600 }}>
                <th style={{ padding: '10px 14px' }}>Seal Number</th>
                <th style={{ padding: '10px 14px' }}>Type</th>
                <th style={{ padding: '10px 14px' }}>Batch</th>
                <th style={{ padding: '10px 14px' }}>Status</th>
                <th style={{ padding: '10px 14px' }}>Custody / Affixed To</th>
                <th style={{ padding: '10px 14px' }}>Certificate Ref</th>
                <th style={{ padding: '10px 14px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>
                    Loading statutory seal registry...
                  </td>
                </tr>
              ) : seals.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>
                    No seals found matching criteria. Click "Issue Statutory Seal Batch" to generate serialized inventory.
                  </td>
                </tr>
              ) : (
                seals.map((s) => {
                  let badgeBg = '#f1f5f9';
                  let badgeColor = '#475467';
                  if (s.status === 'AVAILABLE') {
                    badgeBg = '#ecfdf3';
                    badgeColor = '#027a48';
                  } else if (s.status === 'AFFIXED') {
                    badgeBg = '#eff8ff';
                    badgeColor = '#175cd3';
                  } else if (s.status === 'FLAGGED_TAMPERED') {
                    badgeBg = '#fef3f2';
                    badgeColor = '#b42318';
                  }

                  return (
                    <tr key={s._id || s.sealNumber} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#073b69' }}>
                        {s.sealNumber}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: 11, background: '#f8fafc', border: '1px solid #e2e8f0', padding: '2px 6px', borderRadius: 4 }}>
                          {s.sealType?.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#64748b', fontSize: 12 }}>
                        {s.batchNumber}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ background: badgeBg, color: badgeColor, padding: '3px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                          {s.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        {s.status === 'AFFIXED' ? (
                          <div>
                            <b style={{ color: '#073b69' }}>{s.affixedInstrumentId}</b>
                            <div style={{ fontSize: 11, color: '#64748b' }}>{s.affixedMerchantName || 'Merchant'}</div>
                          </div>
                        ) : (
                          <div style={{ color: '#475467' }}>{s.allocatedOfficerName || 'Central Treasury'}</div>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#475467' }}>
                        {s.affixedCertificateNumber ? (
                          <span style={{ fontFamily: 'monospace' }}>{s.affixedCertificateNumber}</span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        {s.status === 'AFFIXED' && (
                          <button
                            className="outline small"
                            style={{ color: '#b42318', borderColor: '#fecdca', fontSize: 11, padding: '2px 8px' }}
                            onClick={() => {
                              setSelectedSeal(s);
                              setTamperModalOpen(true);
                            }}
                          >
                            <AlertTriangle size={12} /> Report Tamper
                          </button>
                        )}
                        {s.status === 'AVAILABLE' && (
                          <span style={{ fontSize: 11, color: '#027a48', fontWeight: 600 }}>Ready for Use</span>
                        )}
                        {s.status === 'FLAGGED_TAMPERED' && (
                          <span style={{ fontSize: 11, color: '#b42318', fontWeight: 600 }}>Under Investigation</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Issue Batch */}
      {batchModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 8, maxWidth: 500, width: '100%', padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, color: '#073b69', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Layers size={18} /> Issue Official Seal Series
              </h3>
              <button className="icon-btn" onClick={() => setBatchModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleGenerateBatch}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Series Prefix
                </label>
                <input
                  type="text"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  required
                  style={{ width: '100%', padding: 8, fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 6 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Start Number
                  </label>
                  <input
                    type="number"
                    value={startNum}
                    onChange={(e) => setStartNum(e.target.value)}
                    required
                    style={{ width: '100%', padding: 8, fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 6 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Quantity (Count)
                  </label>
                  <input
                    type="number"
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    max={100}
                    min={1}
                    required
                    style={{ width: '100%', padding: 8, fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 6 }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Physical Seal Medium
                </label>
                <select
                  value={sealType}
                  onChange={(e) => setSealType(e.target.value)}
                  style={{ width: '100%', padding: 8, fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 6, background: '#fff' }}
                >
                  <option value="LEAD_WIRE">Statutory Lead &amp; Wire Seal (Clamp)</option>
                  <option value="HOLOGRAPHIC_VOID">Tamper-Evident Holographic VOID Sticker</option>
                  <option value="ELECTRONIC_RFID">Electronic NFC / RFID Seal Tag</option>
                  <option value="TAMPER_INDICATING_TAPE">High-Security Calibration Port Tape</option>
                </select>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: 10, fontSize: 12, color: '#475467', marginBottom: 16 }}>
                <b>Statutory Guarantee:</b> Generated serial numbers are logged into the immutable state audit ledger. Duplicate seal numbers are mathematically prevented.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="outline" onClick={() => setBatchModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary" disabled={generating}>
                  {generating ? 'Generating...' : `Mint ${count} Seals`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Report Tamper */}
      {tamperModalOpen && selectedSeal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 8, maxWidth: 480, width: '100%', padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, color: '#b42318', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={18} /> Report Broken / Tampered Seal
              </h3>
              <button className="icon-btn" onClick={() => setTamperModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleReportTamper}>
              <div style={{ marginBottom: 12, fontSize: 13 }}>
                Target Seal: <b>{selectedSeal.sealNumber}</b>
                <br />
                Affixed Instrument: <b>{selectedSeal.affixedInstrumentId}</b> ({selectedSeal.affixedMerchantName})
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Inspection Observations &amp; Evidence Note
                </label>
                <textarea
                  value={tamperReason}
                  onChange={(e) => setTamperReason(e.target.value)}
                  placeholder="Describe evidence of broken wire, altered hologram, or unauthorized microchip access..."
                  rows={4}
                  required
                  style={{ width: '100%', padding: 8, fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 6 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="outline" onClick={() => setTamperModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary" style={{ background: '#b42318' }}>
                  Confirm Tamper &amp; Flag Enforcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
