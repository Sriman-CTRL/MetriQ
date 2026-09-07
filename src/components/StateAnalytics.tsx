import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Download,
  ShieldCheck,
  AlertTriangle,
  Award,
  Calendar,
  Building2,
  DollarSign,
  Scale,
  ExternalLink,
  Flame,
  CheckCircle2,
  Printer,
  Compass,
  FileSpreadsheet,
} from 'lucide-react';
import { api } from '../api';

export function StateAnalytics() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('FY 2026-27');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [isPrintSummaryOpen, setIsPrintSummaryOpen] = useState(false);

  const fetchOverview = async (range: string) => {
    setLoading(true);
    try {
      const res = await api.analytics.getOverview(range);
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview(timeRange);
  }, [timeRange]);

  const kpi = data?.kpi || {
    totalRegisteredScales: 46850,
    stateComplianceAverage: 96.3,
    statutoryFeesRealized: '₹55.8 Lakh',
    averageTurnaroundDays: 2.4,
    totalViolations: 218,
    activeRaids: 6,
    monitoredWeighbridges: 14,
  };

  const monthlyTrends = data?.monthlyTrends || [
    { month: 'Apr 2026', verifications: 1420, revenue: 639000, compliance: 94.2 },
    { month: 'May 2026', verifications: 1680, revenue: 756000, compliance: 95.1 },
    { month: 'Jun 2026', verifications: 1850, revenue: 832500, compliance: 96.0 },
    { month: 'Jul 2026', verifications: 2120, revenue: 954000, compliance: 96.8 },
    { month: 'Aug 2026', verifications: 2450, revenue: 1102500, compliance: 97.4 },
    { month: 'Sep 2026', verifications: 2890, revenue: 1300500, compliance: 98.1 },
  ];

  const districtCompliance = data?.districtCompliance || [
    {
      district: 'Hyderabad Central',
      complianceRate: 98.4,
      instruments: 12450,
      violations: 18,
      riskLevel: 'LOW',
      mandiType: 'Urban Commercial & Retail Malls',
      recommendedAction: 'Routine Annual Stamping',
    },
    {
      district: 'Cyberabad IT Corridor',
      complianceRate: 97.8,
      instruments: 9800,
      violations: 12,
      riskLevel: 'LOW',
      mandiType: 'Supermarkets & Hypermarkets',
      recommendedAction: 'Standard Surveillance',
    },
    {
      district: 'Warangal Urban',
      complianceRate: 95.1,
      instruments: 5400,
      violations: 24,
      riskLevel: 'LOW',
      mandiType: 'Grain & Cotton Trading APMC',
      recommendedAction: 'Random Lot Sampling',
    },
    {
      district: 'Rachakonda Industrial',
      complianceRate: 94.5,
      instruments: 8200,
      violations: 42,
      riskLevel: 'MEDIUM',
      mandiType: 'Manufacturing & Steel Weighbridges',
      recommendedAction: 'Targeted Load Cell Scrutiny',
    },
    {
      district: 'Karimnagar Grain Hub',
      complianceRate: 92.6,
      instruments: 6100,
      violations: 58,
      riskLevel: 'HIGH',
      mandiType: 'Paddy Procurement Mandis',
      recommendedAction: 'Priority Flying Squad Raid (Sec 15)',
    },
    {
      district: 'Nizamabad Mandi',
      complianceRate: 91.8,
      instruments: 4900,
      violations: 64,
      riskLevel: 'HIGH',
      mandiType: 'Turmeric & Oilseed Market Yard',
      recommendedAction: 'Priority Flying Squad Raid (Sec 15)',
    },
  ];

  const categoryDistribution = data?.categoryDistribution || [
    { name: 'Commercial Counter Scales (Class III)', value: 58, color: '#073b69' },
    { name: 'Fuel Dispensers & Flow Meters', value: 18, color: '#175cd3' },
    { name: 'Heavy Weighbridges (Class IV)', value: 12, color: '#027a48' },
    { name: 'Precision Lab Balances (Class II)', value: 8, color: '#d97706' },
    { name: 'Automatic Packing Machines', value: 4, color: '#7c3aed' },
  ];

  const statutoryOutcomeData = data?.statutoryOutcomeData || [
    { name: 'First-Attempt Compliant', value: 82, color: '#12b76a' },
    { name: 'Tolerance Re-adjusted & Stamped', value: 14, color: '#f79009' },
    { name: 'Tampered / Seized under Sec 30', value: 4, color: '#f04438' },
  ];

  const toleranceErrorSpread = data?.toleranceErrorSpread || [
    { band: 'Within ±0.5e (Strict MPE)', count: 38410, percentage: 82.0, status: 'VERIFIED' },
    { band: '±0.5e to ±1.0e (Acceptable)', count: 5620, percentage: 12.0, status: 'RE-ADJUSTED' },
    { band: '±1.0e to ±2.0e (Over MPE)', count: 1870, percentage: 4.0, status: 'REJECTED' },
    { band: 'Gross Fraud (>2.0e / Altered)', count: 950, percentage: 2.0, status: 'SEIZED_SEC_30' },
  ];

  const handleExportCSV = () => {
    const headers = [
      'District',
      'Mandi / Sector Type',
      'Compliance Rate (%)',
      'Active Instruments',
      'Violations Detected',
      'Risk Classification',
      'Recommended Statutory Action',
    ];
    const rows = districtCompliance.map((d: any) => [
      `"${d.district}"`,
      `"${d.mandiType || 'Commercial'}"`,
      d.complianceRate,
      d.instruments,
      d.violations,
      `"${d.riskLevel}"`,
      `"${d.recommendedAction || 'Surveillance'}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `METRIQ_State_Compliance_BI_Radar_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDispatchSquad = (districtName: string) => {
    // Direct link to Enforcement Raid module with district pre-selected
    navigate(`/dashboard/admin/raids?district=${encodeURIComponent(districtName)}`);
  };

  return (
    <div className="state-analytics-module" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Executive Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #073b69 0%, #0d528f 100%)',
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
              gap: 6,
              background: 'rgba(255,255,255,0.15)',
              color: '#fff',
              padding: '4px 10px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            <BarChart3 size={14} /> Legal Metrology Act, 2009 • Statewide Compliance &amp; BI Radar
          </div>
          <h1 style={{ fontSize: 24, margin: '2px 0 6px', color: '#fff', fontWeight: 800 }}>
            State Metrological Compliance &amp; BI Radar
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: '#d8e7f3', maxWidth: 700 }}>
            Real-time intelligence on mandi compliance rates, revenue collection via Cyber Treasury, statutory error margins, and priority flying squad deployments.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            style={{
              padding: '9px 14px',
              fontSize: 13,
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 6,
              background: '#fff',
              color: '#073b69',
              fontWeight: 700,
            }}
          >
            <option value="FY 2026-27">Fiscal Year 2026-27</option>
            <option value="Q2 2026">Q2 2026 (Jul - Sep)</option>
            <option value="Last 30 Days">Last 30 Days</option>
          </select>

          <button
            onClick={handleExportCSV}
            style={{
              background: '#fff',
              color: '#073b69',
              border: 'none',
              padding: '9px 16px',
              borderRadius: 6,
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <FileSpreadsheet size={15} /> Export CSV Radar
          </button>

          <button
            onClick={() => setIsPrintSummaryOpen(true)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.4)',
              padding: '9px 16px',
              borderRadius: 6,
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Printer size={15} /> Print Summary
          </button>
        </div>
      </div>

      {/* High Risk Mandi Enforcement Alert Banner */}
      <div
        style={{
          background: '#fff8f0',
          border: '1px solid #f97316',
          borderLeft: '5px solid #ea580c',
          borderRadius: 6,
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: '#ffedd5', color: '#ea580c', padding: 8, borderRadius: '50%' }}>
            <Flame size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, color: '#9a3412', fontSize: 13 }}>
              CRITICAL CLUSTER DETECTED: Karimnagar Grain Hub &amp; Nizamabad Mandi
            </div>
            <div style={{ fontSize: 12, color: '#7c2d12', marginTop: 2 }}>
              High-frequency short-weighing complaints (&gt;120 grievances) during peak paddy and oilseed procurement. Immediate Section 15 surprise raid recommended.
            </div>
          </div>
        </div>

        <button
          onClick={() => handleDispatchSquad('Karimnagar Grain Hub')}
          style={{
            background: '#ea580c',
            color: '#fff',
            border: 'none',
            padding: '8px 14px',
            borderRadius: 6,
            fontWeight: 700,
            fontSize: 12,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <AlertTriangle size={14} /> Deploy Flying Squad to Karimnagar
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '16px 18px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Total Registered Scales
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#073b69', marginTop: 4 }}>
            {Number(kpi.totalRegisteredScales).toLocaleString()}
          </div>
          <div style={{ fontSize: 12, color: '#16a34a', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <TrendingUp size={14} /> +14.2% YoY Digitization
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #bbf7d0', borderRadius: 8, padding: '16px 18px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#15803d', textTransform: 'uppercase' }}>
            State Compliance Average
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#16a34a', marginTop: 4 }}>
            {kpi.stateComplianceAverage}%
          </div>
          <div style={{ fontSize: 12, color: '#15803d', marginTop: 4 }}>
            Target: &ge;95% (OIML R-76 standard)
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '16px 18px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase' }}>
            Statutory Fees Realized
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#2563eb', marginTop: 4 }}>
            {kpi.statutoryFeesRealized}
          </div>
          <div style={{ fontSize: 12, color: '#1d4ed8', marginTop: 4 }}>
            Major Head 0435 Remittance
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #fedf89', borderRadius: 8, padding: '16px 18px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#b54708', textTransform: 'uppercase' }}>
            Average Turnaround Time
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#b54708', marginTop: 4 }}>
            {kpi.averageTurnaroundDays} Days
          </div>
          <div style={{ fontSize: 12, color: '#b54708', marginTop: 4 }}>
            Down from 21 days (paper era)
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #fecdd3', borderRadius: 8, padding: '16px 18px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#be123c', textTransform: 'uppercase' }}>
            Enforcement Seizures
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#e11d48', marginTop: 4 }}>
            {kpi.totalViolations}
          </div>
          <div style={{ fontSize: 12, color: '#be123c', marginTop: 4 }}>
            Active Flying Squads: {kpi.activeRaids}
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: 20 }}>
        {/* Verification Growth & Revenue Trend */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#073b69', marginBottom: 4 }}>
            Monthly Verification Volume &amp; Statutory Revenue
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
            Demonstrating rapid statewide merchant onboarding under Legal Metrology Act, 2009
          </div>
          <div style={{ height: 280, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" fontSize={12} stroke="#64748b" />
                <YAxis fontSize={12} stroke="#64748b" />
                <Tooltip
                  formatter={(val: any, name: string) => [
                    name === 'verifications' ? `${val} Units` : `₹${val.toLocaleString()}`,
                    name === 'verifications' ? 'Verified Units' : 'Statutory Fee',
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="verifications" fill="#073b69" name="Verified Scales" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* District Compliance Comparison */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#073b69', marginBottom: 4 }}>
            District-Wise Legal Metrology Compliance Index
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
            Enables targeted deployment of surprise inspection squads to lagging mandis
          </div>
          <div style={{ height: 280, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtCompliance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[85, 100]} fontSize={12} stroke="#64748b" unit="%" />
                <YAxis dataKey="district" type="category" fontSize={11} stroke="#64748b" width={140} />
                <Tooltip formatter={(val: any) => [`${val}%`, 'Compliance Rate']} />
                <Bar dataKey="complianceRate" fill="#12b76a" name="Compliance Rate (%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* District Risk Ranking & Flying Squad Tactical Table */}
      <div style={{ background: '#fff', border: '1px solid #c9d8e2', borderRadius: 8, padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, color: '#073b69', fontWeight: 700 }}>
              District Enforcement Radar &amp; Flying Squad Action Deck
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#617a8c' }}>
              Correlates trader density, APMC mandi transactions, and citizen tamper grievances to trigger Section 15 surprise raids.
            </p>
          </div>
          <span style={{ fontSize: 12, color: '#0d8a43', fontWeight: 700, background: '#e7f7ed', padding: '4px 10px', borderRadius: 12 }}>
            ✓ 6 Active Enforcement Sectors
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f5f8fa', borderBottom: '2px solid #d4e0e8', color: '#073b69', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px' }}>District Sector</th>
                <th style={{ padding: '10px 12px' }}>Mandi / Commercial Hub</th>
                <th style={{ padding: '10px 12px' }}>Active Instruments</th>
                <th style={{ padding: '10px 12px' }}>Compliance Rate</th>
                <th style={{ padding: '10px 12px' }}>Violations</th>
                <th style={{ padding: '10px 12px' }}>Risk Index</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Enforcement Action</th>
              </tr>
            </thead>
            <tbody>
              {districtCompliance.map((d: any) => (
                <tr key={d.district} style={{ borderBottom: '1px solid #e5edf2' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: '#073b69' }}>
                    {d.district}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#456073', fontSize: 12 }}>
                    {d.mandiType || 'Commercial & Retail'}
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                    {d.instruments.toLocaleString()}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 70, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${d.complianceRate}%`,
                            height: '100%',
                            background: d.complianceRate >= 95 ? '#12b76a' : d.complianceRate >= 93 ? '#f79009' : '#f04438',
                          }}
                        />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 12 }}>{d.complianceRate}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', color: d.violations > 30 ? '#b42318' : '#456073', fontWeight: d.violations > 30 ? 700 : 400 }}>
                    {d.violations} cases
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 700,
                        background:
                          d.riskLevel === 'HIGH'
                            ? '#fee4e2'
                            : d.riskLevel === 'MEDIUM'
                            ? '#fef0c7'
                            : '#ecfdf3',
                        color:
                          d.riskLevel === 'HIGH'
                            ? '#b42318'
                            : d.riskLevel === 'MEDIUM'
                            ? '#b54708'
                            : '#027a48',
                      }}
                    >
                      {d.riskLevel}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleDispatchSquad(d.district)}
                      style={{
                        padding: '5px 10px',
                        fontSize: 11,
                        fontWeight: 700,
                        borderRadius: 4,
                        border: 'none',
                        cursor: 'pointer',
                        background: d.riskLevel === 'HIGH' ? '#ea580c' : '#073b69',
                        color: '#fff',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <ShieldCheck size={13} /> {d.riskLevel === 'HIGH' ? 'Raid Mandi (Sec 15)' : 'Dispatch Inspection'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Second Row: Distributions & Tolerance Spread */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
        {/* Category Breakdown */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#073b69', marginBottom: 4 }}>
            Instrument Category Distribution
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
            Breakdown across statutory classes under Seventh Schedule
          </div>
          <div style={{ height: 240, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => [`${val}%`, 'Share']} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Statutory Inspection Outcomes */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#073b69', marginBottom: 4 }}>
            Field Verification Outcomes &amp; Tamper Enforcement
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
            Audit trail results from LMO field testing across the state
          </div>
          <div style={{ height: 240, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statutoryOutcomeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statutoryOutcomeData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => [`${val}%`, 'Outcome']} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tolerance Error Margin Analysis (OIML R-76 MPE) */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#073b69', marginBottom: 4 }}>
            OIML R-76 Maximum Permissible Error (MPE) Distribution
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>
            Statewide laboratory and field error deviation curves
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {toleranceErrorSpread.map((item: any) => (
              <div
                key={item.band}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 6,
                  padding: '10px 12px',
                  background: item.status === 'SEIZED_SEC_30' ? '#fff5f5' : '#f8fafc',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                  <span style={{ color: item.status === 'SEIZED_SEC_30' ? '#b42318' : '#073b69' }}>
                    {item.band}
                  </span>
                  <span style={{ color: item.status === 'SEIZED_SEC_30' ? '#b42318' : '#16a34a' }}>
                    {item.percentage}% ({item.count.toLocaleString()} scales)
                  </span>
                </div>
                <div style={{ width: '100%', height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${item.percentage}%`,
                      height: '100%',
                      background:
                        item.status === 'VERIFIED'
                          ? '#16a34a'
                          : item.status === 'RE-ADJUSTED'
                          ? '#f59e0b'
                          : item.status === 'REJECTED'
                          ? '#ea580c'
                          : '#dc2626',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Printable Executive Summary Modal */}
      {isPrintSummaryOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 8,
              maxWidth: 780,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 28,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
            }}
          >
            {/* Official Report Header */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid #073b69', paddingBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#64748b', letterSpacing: '0.05em' }}>
                GOVERNMENT OF TELANGANA • DEPARTMENT OF LEGAL METROLOGY
              </div>
              <h2 style={{ fontSize: 18, color: '#073b69', margin: '6px 0 2px' }}>
                EXECUTIVE BI &amp; COMPLIANCE RADAR REPORT (SMART INDIA HACKATHON 2026)
              </h2>
              <div style={{ fontSize: 11, color: '#64748b' }}>
                Report Generated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()} • Cycle: {timeRange}
              </div>
            </div>

            {/* Summary Highlights */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, background: '#f8fafc', padding: 12, borderRadius: 6 }}>
              <div>
                <div style={{ fontSize: 10, color: '#64748b' }}>TOTAL INSTRUMENTS</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#073b69' }}>
                  {Number(kpi.totalRegisteredScales).toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#64748b' }}>STATE COMPLIANCE</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#16a34a' }}>
                  {kpi.stateComplianceAverage}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#64748b' }}>TREASURY REVENUE</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#2563eb' }}>
                  {kpi.statutoryFeesRealized}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#64748b' }}>SEIZURES / FRAUDS</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#b91c1c' }}>
                  {kpi.totalViolations}
                </div>
              </div>
            </div>

            {/* Table in Print */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#073b69', marginBottom: 6 }}>
                District-Wise Enforcement Standing:
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                    <th style={{ padding: 6 }}>District</th>
                    <th style={{ padding: 6 }}>Scales</th>
                    <th style={{ padding: 6 }}>Compliance</th>
                    <th style={{ padding: 6 }}>Violations</th>
                    <th style={{ padding: 6 }}>Risk Level</th>
                  </tr>
                </thead>
                <tbody>
                  {districtCompliance.map((d: any) => (
                    <tr key={d.district} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: 6, fontWeight: 600 }}>{d.district}</td>
                      <td style={{ padding: 6 }}>{d.instruments.toLocaleString()}</td>
                      <td style={{ padding: 6 }}>{d.complianceRate}%</td>
                      <td style={{ padding: 6 }}>{d.violations}</td>
                      <td style={{ padding: 6, fontWeight: 700, color: d.riskLevel === 'HIGH' ? '#b91c1c' : '#027a48' }}>
                        {d.riskLevel}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
              <button
                className="outline"
                onClick={() => setIsPrintSummaryOpen(false)}
                style={{ padding: '8px 16px', borderRadius: 4, cursor: 'pointer' }}
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                style={{
                  background: '#073b69',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: 4,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Printer size={15} /> Print Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
