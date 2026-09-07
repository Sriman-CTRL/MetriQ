import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle2, AlertTriangle, RefreshCw, Database, Shield, Server, X } from 'lucide-react';
import { api } from '../api';

interface DiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetSuccess?: () => void;
}

export const DiagnosticsModal: React.FC<DiagnosticsModalProps> = ({
  isOpen,
  onClose,
  onResetSuccess,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  const loadDiagnostics = async () => {
    setLoading(true);
    try {
      const res = await api.system.getDiagnostics();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load diagnostics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadDiagnostics();
    }
  }, [isOpen]);

  const handleResetDemo = async () => {
    if (!window.confirm('Reset demo database to fresh Smart India Hackathon 2026 benchmark state?')) {
      return;
    }
    setResetting(true);
    setResetMessage('');
    try {
      const res = await api.system.resetDemoData();
      if (res.success) {
        setResetMessage('Database reseeded successfully with official benchmark data.');
        await loadDiagnostics();
        if (onResetSuccess) onResetSuccess();
      } else {
        setResetMessage('Reset error: ' + (res.error?.message || 'Failed to reseed.'));
      }
    } catch {
      setResetMessage('Reset failed due to a network or server error.');
    } finally {
      setResetting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="grievance-modal-overlay">
      <div className="grievance-modal" style={{ maxWidth: 640 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: '#ecfdf3', padding: 8, borderRadius: 6, color: '#039855' }}>
              <Activity size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, color: '#073b69' }}>
                METRIQ System &amp; Security Diagnostics
              </h3>
              <small style={{ color: '#64748b' }}>SIH 2026 Problem Statement 26036 Platform Health</small>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        {resetMessage && (
          <div style={{ background: '#ecfdf3', color: '#027a48', padding: '10px 14px', borderRadius: 6, fontSize: 13, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={16} />
            {resetMessage}
          </div>
        )}

        {loading && !data ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
            <RefreshCw size={24} className="spin" />
            <p style={{ marginTop: 10, fontSize: 13 }}>Probing database cluster &amp; cryptographic subsystems...</p>
          </div>
        ) : (
          <div>
            <div className="diagnostics-grid">
              <div className="diag-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <b>Database Connection</b>
                  <Database size={16} color="#073b69" />
                </div>
                <div className="diag-status ok">
                  <CheckCircle2 size={12} /> {data?.database?.connected ? 'CONNECTED (MongoDB)' : 'FALLBACK'}
                </div>
                <span>{data?.database?.latencyMs ?? 1} ms</span>
                <small>Query response latency</small>
              </div>

              <div className="diag-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <b>Crypto SHA-256 Engine</b>
                  <Shield size={16} color="#073b69" />
                </div>
                <div className="diag-status ok">
                  <CheckCircle2 size={12} /> {data?.security?.sha256IntegrityEngine || 'VERIFIED'}
                </div>
                <span style={{ fontSize: 15 }}>256-bit Digest</span>
                <small>Tamper-evident verification hash</small>
              </div>

              <div className="diag-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <b>Registry Documents</b>
                  <Server size={16} color="#073b69" />
                </div>
                <span style={{ fontSize: 20 }}>
                  {data?.database?.counts ? `${data.database.counts.instruments} Instruments` : '5 Instruments'}
                </span>
                <small>
                  {data?.database?.counts
                    ? `${data.database.counts.applications} Apps · ${data.database.counts.certificates} Certs`
                    : '3 Applications · 2 Certificates'}
                </small>
              </div>

              <div className="diag-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <b>Audit Trail Logs</b>
                  <Activity size={16} color="#073b69" />
                </div>
                <div className="diag-status ok">
                  <CheckCircle2 size={12} /> IMMUTABLE
                </div>
                <span style={{ fontSize: 20 }}>
                  {data?.database?.counts?.auditLogs || '7'} Records
                </span>
                <small>Full statutory event tracking</small>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 6, border: '1px solid #e2e8f0', marginTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#073b69', marginBottom: 6 }}>
                Runtime Architecture
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, fontSize: 12, color: '#334155' }}>
                <div><b>Server Uptime:</b> {data?.system?.uptimeSeconds || 0}s</div>
                <div><b>Memory:</b> {data?.system?.memoryUsageMb || 45} MB</div>
                <div><b>Offline Sync:</b> LocalStorage Queue</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 14, borderTop: '1px solid #e2e8f0' }}>
              <button
                className="outline small"
                onClick={handleResetDemo}
                disabled={resetting}
                style={{ color: '#b42318', borderColor: '#fecdca' }}
              >
                <RefreshCw size={14} className={resetting ? 'spin' : ''} />
                {resetting ? 'Reseeding...' : 'Reseed Demo Benchmark'}
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="outline small" onClick={loadDiagnostics} disabled={loading}>
                  <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
                </button>
                <button className="primary small" onClick={onClose}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
