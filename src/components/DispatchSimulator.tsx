import { useState, useEffect } from 'react';
import {
  Send,
  MessageSquare,
  Smartphone,
  Mail,
  CheckCircle2,
  Clock,
  Search,
  BellRing,
  AlertTriangle,
  Play,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { api } from '../api';

export function DispatchSimulator() {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState('');
  const [search, setSearch] = useState('');
  const [isSweeping, setIsSweeping] = useState(false);
  const [sweepMsg, setSweepMsg] = useState<string | null>(null);

  // New Alert Composer Modal
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeForm, setComposeForm] = useState({
    recipientName: '',
    recipientPhone: '98480 12345',
    recipientEmail: 'merchant@metriq.demo',
    channel: 'SMS',
    trigger: 'STATUTORY_EXPIRY_REMINDER',
    messageBody: 'Statutory Notice under Rule 14, Legal Metrology Act, 2009: Verification for your commercial weighing scale expires in 15 days. Apply on METRIQ to avoid compounding penalties. DLT-ID: 110716829102938',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, logsRes] = await Promise.all([
        api.dispatch.getStats(),
        api.dispatch.listLogs({ channel: channelFilter, search }),
      ]);
      if (statsRes.success) setStats(statsRes.data);
      if (logsRes.success && logsRes.data) setLogs(logsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [channelFilter, search]);

  const handleRunSweep = async () => {
    setIsSweeping(true);
    setSweepMsg(null);
    try {
      const res = await api.dispatch.simulateExpirySweep();
      if (res.success) {
        setSweepMsg(res.message || 'Dispatched statutory notices to instrument owners.');
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSweeping(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.dispatch.sendNotification(composeForm);
      if (res.success) {
        setIsComposeOpen(false);
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="dispatch-simulator" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #073b69 0%, #0d5c9c 100%)',
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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: 20, fontSize: 12, marginBottom: 8, fontWeight: 600 }}>
            <BellRing size={15} /> TRAI DLT Compliant (Header: TS-LEGMET) • Rule 14 Statutory Notices
          </div>
          <h1 style={{ fontSize: 24, margin: '4px 0', color: '#fff', fontWeight: 700 }}>
            Automated Multi-Channel Dispatch & Notice Engine
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: '#d8e7f3', maxWidth: 660 }}>
            Trigger real-time statutory SMS reminders, interactive WhatsApp certificate cards, and legal email notices to merchants, mandis, and enforcement vigilance squads.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleRunSweep}
            disabled={isSweeping}
            style={{
              background: '#0d8a43',
              color: '#fff',
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
            <Play size={15} /> {isSweeping ? 'Sweeping Database...' : 'Run 30-Day Expiry Sweep'}
          </button>
          <button
            onClick={() => setIsComposeOpen(true)}
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
            <Send size={15} /> Compose Notice
          </button>
        </div>
      </div>

      {sweepMsg && (
        <div style={{ background: '#e7f7ed', border: '1px solid #a3e6be', color: '#0d8a43', padding: '12px 16px', borderRadius: 6, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
          <CheckCircle2 size={16} /> {sweepMsg}
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
        <div style={{ background: '#fff', border: '1px solid #d4e0e8', borderRadius: 6, padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#617a8c', fontSize: 12, fontWeight: 600 }}>
            <span>TOTAL DISPATCHED</span>
            <Send size={16} color="#073b69" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#073b69', marginTop: 6 }}>
            {stats?.totalDispatched ?? logs.length}
          </div>
          <div style={{ fontSize: 11, color: '#0d8a43', marginTop: 4, fontWeight: 600 }}>
            ✓ {stats?.deliveryRate ?? 100}% Delivered Successfully
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #d4e0e8', borderRadius: 6, padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#617a8c', fontSize: 12, fontWeight: 600 }}>
            <span>SMS (TRAI DLT HEADER)</span>
            <Smartphone size={16} color="#0c4d87" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#0c4d87', marginTop: 6 }}>
            {stats?.smsCount ?? 0}
          </div>
          <div style={{ fontSize: 11, color: '#617a8c', marginTop: 4 }}>
            Header: <b>TS-LEGMET</b>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #d4e0e8', borderRadius: 6, padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#617a8c', fontSize: 12, fontWeight: 600 }}>
            <span>WHATSAPP BOT CARDS</span>
            <MessageSquare size={16} color="#0d8a43" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#0d8a43', marginTop: 6 }}>
            {stats?.whatsappCount ?? 0}
          </div>
          <div style={{ fontSize: 11, color: '#617a8c', marginTop: 4 }}>
            Interactive QR & PDF Cards
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #d4e0e8', borderRadius: 6, padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#617a8c', fontSize: 12, fontWeight: 600 }}>
            <span>DELIVERY LATENCY</span>
            <Clock size={16} color="#456073" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#456073', marginTop: 6 }}>
            {stats?.averageLatencyMs ?? 380} ms
          </div>
          <div style={{ fontSize: 11, color: '#617a8c', marginTop: 4 }}>
            Govt SMS Gateway Tier-1
          </div>
        </div>
      </div>

      {/* Log Feed */}
      <div style={{ background: '#fff', border: '1px solid #c9d8e2', borderRadius: 8, padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              style={{ padding: '7px 10px', borderRadius: 4, border: '1px solid #c9d8e2', fontSize: 12, background: '#fff' }}
            >
              <option value="">All Channels (SMS / WhatsApp / Email)</option>
              <option value="SMS">SMS (DLT Header)</option>
              <option value="WHATSAPP">WhatsApp Official Card</option>
              <option value="EMAIL">Email Formal Notice</option>
            </select>
          </div>

          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search notifications..."
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#617a8c' }}>Loading notification feed...</div>
          ) : logs.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#617a8c' }}>No notifications dispatched yet.</div>
          ) : (
            logs.map((item) => (
              <div
                key={item._id || item.dispatchId}
                style={{
                  border: '1px solid #d4e0e8',
                  borderRadius: 6,
                  padding: 14,
                  background: item.channel === 'WHATSAPP' ? '#fcfefd' : '#fff',
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto',
                  gap: 16,
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ paddingTop: 2 }}>
                  {item.channel === 'SMS' ? (
                    <div style={{ background: '#e1effa', color: '#073b69', padding: 8, borderRadius: 6 }}>
                      <Smartphone size={20} />
                    </div>
                  ) : item.channel === 'WHATSAPP' ? (
                    <div style={{ background: '#e7f7ed', color: '#0d8a43', padding: 8, borderRadius: 6 }}>
                      <MessageSquare size={20} />
                    </div>
                  ) : (
                    <div style={{ background: '#f5f8fa', color: '#456073', padding: 8, borderRadius: 6 }}>
                      <Mail size={20} />
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#073b69', fontSize: 13 }}>
                      {item.dispatchId}
                    </span>
                    <span style={{ background: '#f0f5f9', color: '#073b69', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12 }}>
                      {item.channel} • {item.senderHeader}
                    </span>
                    <span style={{ fontSize: 11, color: '#617a8c' }}>
                      To: <b>{item.recipientName}</b> ({item.recipientPhone || item.recipientEmail})
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      color: '#183247',
                      background: item.channel === 'WHATSAPP' ? '#f0f9f3' : '#f8fafc',
                      padding: 10,
                      borderRadius: 6,
                      border: '1px solid #e2ecf2',
                      whiteSpace: 'pre-line',
                      lineHeight: 1.5,
                      fontFamily: item.channel === 'WHATSAPP' ? 'system-ui' : 'inherit',
                    }}
                  >
                    {item.messageBody}
                  </div>

                  {item.instrumentId && (
                    <div style={{ fontSize: 11, color: '#617a8c', marginTop: 4 }}>
                      Instrument: <b>{item.instrumentId}</b>
                      {item.certificateNumber && <span> • Certificate: <b>{item.certificateNumber}</b></span>}
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#0d8a43', fontWeight: 700 }}>
                    <CheckCircle2 size={13} /> {item.status}
                  </span>
                  <div style={{ fontSize: 11, color: '#617a8c' }}>
                    {new Date(item.sentAt).toLocaleTimeString()} ({item.deliveryLatencyMs || 320}ms)
                  </div>
                  <div style={{ fontSize: 10, color: '#8aa0b0' }}>DLT ID: {item.dltTemplateId || '110716829102938'}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal: Compose Notice */}
      {isComposeOpen && (
        <div className="grievance-modal-overlay" onClick={() => setIsComposeOpen(false)}>
          <div className="grievance-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <h2 style={{ fontSize: 18, color: '#073b69', marginBottom: 12 }}>Compose Statutory Metrology Notice</h2>
            <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>Delivery Channel</label>
                  <select
                    value={composeForm.channel}
                    onChange={(e) => setComposeForm({ ...composeForm, channel: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 4, border: '1px solid #c9d8e2' }}
                  >
                    <option value="SMS">SMS (DLT Header TS-LEGMET)</option>
                    <option value="WHATSAPP">WhatsApp Official Card</option>
                    <option value="EMAIL">Email Formal Legal Notice</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>Statutory Trigger</label>
                  <select
                    value={composeForm.trigger}
                    onChange={(e) => setComposeForm({ ...composeForm, trigger: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 4, border: '1px solid #c9d8e2' }}
                  >
                    <option value="STATUTORY_EXPIRY_REMINDER">Rule 14 Expiry Reminder</option>
                    <option value="CERTIFICATE_ISSUED">Certificate Ready & QR</option>
                    <option value="SEIZURE_ALERT">Seizure Notice (Sec 15)</option>
                    <option value="VIOLATION_COMPOUNDED">Compounding Fine Levied</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Recipient Name / Business</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sri Venkateshwara Traders"
                  value={composeForm.recipientName}
                  onChange={(e) => setComposeForm({ ...composeForm, recipientName: e.target.value })}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 4, border: '1px solid #c9d8e2' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>Mobile Number (SMS/WhatsApp)</label>
                  <input
                    type="text"
                    required
                    value={composeForm.recipientPhone}
                    onChange={(e) => setComposeForm({ ...composeForm, recipientPhone: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 4, border: '1px solid #c9d8e2' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>Email Address</label>
                  <input
                    type="email"
                    value={composeForm.recipientEmail}
                    onChange={(e) => setComposeForm({ ...composeForm, recipientEmail: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 4, border: '1px solid #c9d8e2' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Statutory Message Payload</label>
                <textarea
                  rows={4}
                  required
                  value={composeForm.messageBody}
                  onChange={(e) => setComposeForm({ ...composeForm, messageBody: e.target.value })}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 4, border: '1px solid #c9d8e2', fontSize: 12 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  style={{ padding: '8px 14px', background: '#f5f8fa', border: '1px solid #ccd9e2', borderRadius: 4, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', background: '#073b69', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Send size={14} /> Send Statutory Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
