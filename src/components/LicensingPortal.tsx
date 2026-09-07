import { useState, useEffect } from 'react';
import {
  Award,
  FileCheck,
  Scale,
  ShieldCheck,
  Plus,
  Search,
  Calendar,
  Building,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  FileText,
  BadgeCheck,
  Eye,
  Printer,
  Ban,
  QrCode,
  Check,
  RotateCcw,
} from 'lucide-react';
import { api } from '../api';

export function LicensingPortal() {
  const [activeTab, setActiveTab] = useState<'licenses' | 'tac' | 'standards'>('licenses');
  const [licenses, setLicenses] = useState<any[]>([]);
  const [tacs, setTacs] = useState<any[]>([]);
  const [standards, setStandards] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals
  const [isNewLicenseOpen, setIsNewLicenseOpen] = useState(false);
  const [isNewTacOpen, setIsNewTacOpen] = useState(false);
  const [isCalibrateOpen, setIsCalibrateOpen] = useState<any | null>(null);

  // Certificate Viewer Modals
  const [selectedLicense, setSelectedLicense] = useState<any | null>(null);
  const [selectedTac, setSelectedTac] = useState<any | null>(null);
  const [selectedStandard, setSelectedStandard] = useState<any | null>(null);

  // Form states
  const [newLic, setNewLic] = useState({
    licenseType: 'MANUFACTURER',
    businessName: '',
    proprietorName: '',
    panNumber: '',
    gstin: '',
    address: '',
    district: 'Hyderabad',
    securityDeposit: 50000,
    authorizedCategories: 'Electronic Weighing Machines (Class II & Class III)',
  });

  const [newTac, setNewTac] = useState({
    tacNumber: '',
    manufacturerName: '',
    brandModel: '',
    instrumentClass: 'Class III',
    maxCapacity: '30 kg',
    verificationScaleInterval: 'e = 1g',
    loadCellSpecs: 'Single point aluminium load cell, IP65',
    softwareVersionHash: 'SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    sealingPlan: 'Clamp wire seal through calibration plate cover and display chassis.',
  });

  const [calibForm, setCalibForm] = useState({
    calibratingLaboratory: 'Regional Reference Standards Laboratory (RRSL), Bangalore',
    certificateNumber: '',
    measuredDeviationMg: '1.2',
    maxPermissibleErrorMg: '5.0',
    remarks: 'Calibrated against secondary standard stainless steel mass standards.',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, licRes, tacRes, stdRes] = await Promise.all([
        api.licensing.getStats(),
        api.licensing.listLicenses({ search, type: typeFilter }),
        api.licensing.listTac({ search }),
        api.licensing.listStandards(),
      ]);
      if (statsRes.success) setStats(statsRes.data);
      if (licRes.success && licRes.data) setLicenses(licRes.data);
      if (tacRes.success && tacRes.data) setTacs(tacRes.data);
      if (stdRes.success && stdRes.data) setStandards(stdRes.data);
    } catch (err) {
      console.error('Failed to load licensing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, typeFilter]);

  const handleToggleLicenseStatus = async (lic: any) => {
    const nextStatus = lic.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const res = await api.licensing.updateLicenseStatus(lic._id || lic.licenseNumber, {
        status: nextStatus,
        remarks:
          nextStatus === 'SUSPENDED'
            ? 'Suspended under Section 19 due to calibration non-compliance'
            : 'Re-instated by Controller of Legal Metrology',
      });
      if (res.success) {
        loadData();
      }
    } catch (err) {
      console.error('Failed to update license status:', err);
    }
  };

  const handleRenewLicense = async (lic: any) => {
    try {
      const res = await api.licensing.updateLicenseStatus(lic._id || lic.licenseNumber, {
        status: 'ACTIVE',
        remarks: 'Annual renewal approved under Section 23 upon payment of fee and verification of calibration logs.',
      });
      if (res.success) {
        alert(`License ${lic.licenseNumber} renewed for statutory period of 1 year.`);
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.licensing.createLicense({
        ...newLic,
        authorizedCategories: [newLic.authorizedCategories],
      });
      if (res.success) {
        setIsNewLicenseOpen(false);
        setNewLic({
          licenseType: 'MANUFACTURER',
          businessName: '',
          proprietorName: '',
          panNumber: '',
          gstin: '',
          address: '',
          district: 'Hyderabad',
          securityDeposit: 50000,
          authorizedCategories: 'Electronic Weighing Machines (Class II & Class III)',
        });
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTac = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.licensing.createTac(newTac);
      if (res.success) {
        setIsNewTacOpen(false);
        setNewTac({
          tacNumber: '',
          manufacturerName: '',
          brandModel: '',
          instrumentClass: 'Class III',
          maxCapacity: '30 kg',
          verificationScaleInterval: 'e = 1g',
          loadCellSpecs: 'Single point aluminium load cell, IP65',
          softwareVersionHash: 'SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
          sealingPlan: 'Clamp wire seal through calibration plate cover and display chassis.',
        });
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCalibrate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCalibrateOpen) return;
    try {
      const res = await api.licensing.calibrateStandard(isCalibrateOpen._id || isCalibrateOpen.kitId, calibForm);
      if (res.success) {
        setIsCalibrateOpen(null);
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="licensing-portal" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #073b69 0%, #0c4d87 100%)',
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
            <BadgeCheck size={15} /> Legal Metrology Act, 2009 (Sections 19, 20, 22 &amp; 23)
          </div>
          <h1 style={{ fontSize: 24, margin: '4px 0', color: '#fff', fontWeight: 700 }}>
            Manufacturer, Repairer Licensing &amp; Model Approval (TAC)
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: '#d8e7f3', maxWidth: 680 }}>
            State registry of licensed scale manufacturers (LM-1), certified repairers (LM-2), dealers (LM-3), central Model Approval certificates (OIML R-76), and secondary standard calibration traceability.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsNewLicenseOpen(true)}
            style={{
              background: '#fff',
              color: '#073b69',
              border: 'none',
              padding: '10px 16px',
              borderRadius: 6,
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Plus size={16} /> Issue License
          </button>
          <button
            onClick={() => setIsNewTacOpen(true)}
            style={{
              background: '#e0edff',
              color: '#073b69',
              border: 'none',
              padding: '10px 16px',
              borderRadius: 6,
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Award size={16} /> Register TAC
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <div style={{ background: '#fff', border: '1px solid #d4e0e8', borderRadius: 6, padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#617a8c', fontSize: 12, fontWeight: 600 }}>
            <span>ACTIVE LICENSES</span>
            <Building size={16} color="#073b69" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#073b69', marginTop: 6 }}>
            {stats?.activeLicenses ?? licenses.length}
          </div>
          <div style={{ fontSize: 11, color: '#617a8c', marginTop: 4 }}>
            {stats?.manufacturers ?? 2} Manufacturers • {stats?.repairers ?? 1} Repairers
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #d4e0e8', borderRadius: 6, padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#617a8c', fontSize: 12, fontWeight: 600 }}>
            <span>TYPE APPROVALS (TAC)</span>
            <Award size={16} color="#0c4d87" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#0c4d87', marginTop: 6 }}>
            {stats?.totalTacs ?? tacs.length}
          </div>
          <div style={{ fontSize: 11, color: '#0d8a43', marginTop: 4, fontWeight: 600 }}>
            ✓ OIML R-76 Standard Compliant
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #d4e0e8', borderRadius: 6, padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#617a8c', fontSize: 12, fontWeight: 600 }}>
            <span>WORKING STANDARDS</span>
            <Scale size={16} color="#183247" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#183247', marginTop: 6 }}>
            {stats?.totalWorkingStandards ?? standards.length}
          </div>
          <div style={{ fontSize: 11, color: '#617a8c', marginTop: 4 }}>
            RRSL / State Standards Certified
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #d4e0e8', borderRadius: 6, padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#617a8c', fontSize: 12, fontWeight: 600 }}>
            <span>STANDARDS DUE/EXPIRING</span>
            <AlertTriangle size={16} color="#b26b00" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#b26b00', marginTop: 6 }}>
            {stats?.standardsDueSoon ?? 1}
          </div>
          <div style={{ fontSize: 11, color: '#617a8c', marginTop: 4 }}>
            Annual NPL/RRSL Recalibration
          </div>
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div style={{ background: '#fff', border: '1px solid #c9d8e2', borderRadius: 8, padding: 18 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #e1ebf0',
            paddingBottom: 14,
            marginBottom: 16,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('licenses')}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                border: '1px solid',
                borderColor: activeTab === 'licenses' ? '#073b69' : '#d2dfe7',
                background: activeTab === 'licenses' ? '#073b69' : '#f7fafc',
                color: activeTab === 'licenses' ? '#fff' : '#35536b',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Building size={15} /> Statutory Licenses (LM-1, 2, 3)
            </button>
            <button
              onClick={() => setActiveTab('tac')}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                border: '1px solid',
                borderColor: activeTab === 'tac' ? '#073b69' : '#d2dfe7',
                background: activeTab === 'tac' ? '#073b69' : '#f7fafc',
                color: activeTab === 'tac' ? '#fff' : '#35536b',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Award size={15} /> Model Approval (TAC) Registry
            </button>
            <button
              onClick={() => setActiveTab('standards')}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                border: '1px solid',
                borderColor: activeTab === 'standards' ? '#073b69' : '#d2dfe7',
                background: activeTab === 'standards' ? '#073b69' : '#f7fafc',
                color: activeTab === 'standards' ? '#fff' : '#35536b',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Scale size={15} /> Working Standards Traceability
            </button>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {activeTab === 'licenses' && (
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: 4, border: '1px solid #c9d8e2', fontSize: 12, background: '#fff' }}
              >
                <option value="">All License Types</option>
                <option value="MANUFACTURER">Manufacturers (LM-1)</option>
                <option value="REPAIRER">Repairers (LM-2)</option>
                <option value="DEALER">Dealers (LM-3)</option>
              </select>
            )}

            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search records..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  padding: '7px 10px 7px 30px',
                  borderRadius: 4,
                  border: '1px solid #c9d8e2',
                  fontSize: 12,
                  width: 200,
                }}
              />
              <Search size={14} color="#7592a6" style={{ position: 'absolute', left: 9, top: 10 }} />
            </div>
          </div>
        </div>

        {/* Tab 1: Licenses */}
        {activeTab === 'licenses' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f5f8fa', borderBottom: '2px solid #d4e0e8', color: '#073b69', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px' }}>License No</th>
                  <th style={{ padding: '10px 12px' }}>Type</th>
                  <th style={{ padding: '10px 12px' }}>Business / Proprietor</th>
                  <th style={{ padding: '10px 12px' }}>District</th>
                  <th style={{ padding: '10px 12px' }}>Security Deposit</th>
                  <th style={{ padding: '10px 12px' }}>Valid Until</th>
                  <th style={{ padding: '10px 12px' }}>Status</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#617a8c' }}>
                      Loading license records...
                    </td>
                  </tr>
                ) : licenses.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#617a8c' }}>
                      No licenses found matching query.
                    </td>
                  </tr>
                ) : (
                  licenses.map((lic) => (
                    <tr key={lic._id || lic.licenseNumber} style={{ borderBottom: '1px solid #e5edf2' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#073b69', fontFamily: 'monospace' }}>
                        {lic.licenseNumber}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 700,
                            background:
                              lic.licenseType === 'MANUFACTURER'
                                ? '#e1effa'
                                : lic.licenseType === 'REPAIRER'
                                ? '#fef3f2'
                                : '#f0f9ff',
                            color:
                              lic.licenseType === 'MANUFACTURER'
                                ? '#073b69'
                                : lic.licenseType === 'REPAIRER'
                                ? '#b42318'
                                : '#026aa2',
                          }}
                        >
                          {lic.licenseType}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 600, color: '#183247' }}>{lic.businessName}</div>
                        <div style={{ fontSize: 11, color: '#617a8c' }}>Proprietor: {lic.proprietorName} • PAN: {lic.panNumber}</div>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#456073' }}>{lic.district}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#183247' }}>
                        ₹{(lic.securityDeposit || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#456073' }}>
                        {new Date(lic.validUntil).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 700,
                            background: lic.status === 'ACTIVE' ? '#e7f7ed' : '#fee4e2',
                            color: lic.status === 'ACTIVE' ? '#0d8a43' : '#b42318',
                          }}
                        >
                          {lic.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            onClick={() => setSelectedLicense(lic)}
                            style={{
                              padding: '5px 9px',
                              background: '#f0f5f9',
                              color: '#073b69',
                              border: '1px solid #c4d7e5',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <Eye size={13} /> View Certificate
                          </button>

                          <button
                            onClick={() => handleToggleLicenseStatus(lic)}
                            style={{
                              padding: '5px 9px',
                              background: lic.status === 'ACTIVE' ? '#fff1f0' : '#e6f7ed',
                              color: lic.status === 'ACTIVE' ? '#cf1322' : '#0d8a43',
                              border: `1px solid ${lic.status === 'ACTIVE' ? '#ffa39e' : '#b7eb8f'}`,
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            {lic.status === 'ACTIVE' ? <Ban size={12} /> : <Check size={12} />}
                            {lic.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: TAC / Model Approval */}
        {activeTab === 'tac' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {tacs.map((tac) => (
              <div
                key={tac._id || tac.tacNumber}
                style={{
                  border: '1px solid #d4e0e8',
                  borderRadius: 6,
                  padding: 16,
                  background: '#fafcfe',
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 1fr 0.8fr',
                  gap: 16,
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#073b69', fontSize: 14 }}>
                      {tac.tacNumber}
                    </span>
                    <span style={{ background: '#e7f7ed', color: '#0d8a43', fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>
                      {tac.oimlStandard || 'OIML R-76'}
                    </span>
                  </div>
                  <h3 style={{ margin: '2px 0 6px', fontSize: 15, color: '#183247' }}>{tac.brandModel}</h3>
                  <div style={{ fontSize: 12, color: '#617a8c' }}>Manufacturer: <b>{tac.manufacturerName}</b></div>
                </div>

                <div style={{ fontSize: 12, color: '#456073', display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div><b>Class:</b> {tac.instrumentClass} • <b>Capacity:</b> {tac.maxCapacity}</div>
                  <div><b>Interval:</b> {tac.verificationScaleInterval}</div>
                  <div><b>Load Cell:</b> {tac.loadCellSpecs}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#7a8e9e' }}>
                    {tac.softwareVersionHash?.slice(0, 36)}...
                  </div>
                </div>

                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                  <span style={{ fontSize: 11, color: '#0d8a43', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircle2 size={13} /> {tac.status}
                  </span>
                  <div style={{ fontSize: 11, color: '#617a8c' }}>
                    Valid until: {new Date(tac.validUntil).toLocaleDateString()}
                  </div>
                  <button
                    onClick={() => setSelectedTac(tac)}
                    style={{
                      padding: '5px 10px',
                      background: '#073b69',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      marginTop: 2,
                    }}
                  >
                    <Eye size={12} /> Inspect TAC Spec Sheet
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Working Standards Traceability */}
        {activeTab === 'standards' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {standards.map((std) => (
              <div
                key={std._id || std.kitId}
                style={{
                  border: '1px solid #d4e0e8',
                  borderRadius: 6,
                  padding: 16,
                  background: '#fff',
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 1fr 0.8fr',
                  gap: 16,
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#073b69', fontSize: 14 }}>
                      {std.kitId}
                    </span>
                    <span style={{ background: '#e1effa', color: '#073b69', fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>
                      {std.accuracyClass}
                    </span>
                  </div>
                  <h3 style={{ margin: '2px 0 6px', fontSize: 14, color: '#183247' }}>{std.kitName}</h3>
                  <div style={{ fontSize: 12, color: '#617a8c' }}>
                    Assigned Officer: <b>{std.assignedOfficerName}</b> ({std.district})
                  </div>
                </div>

                <div style={{ fontSize: 12, color: '#456073', display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div><b>Calibrated By:</b> {std.calibratingLaboratory}</div>
                  <div><b>Certificate No:</b> <span style={{ fontFamily: 'monospace' }}>{std.calibrationCertificateNumber}</span></div>
                  <div><b>Last Calibrated:</b> {new Date(std.lastCalibrationDate).toLocaleDateString()}</div>
                  <div style={{ color: std.status === 'DUE_SOON' ? '#b26b00' : '#0d8a43', fontWeight: 700 }}>
                    <b>Next Due:</b> {new Date(std.nextCalibrationDueDate).toLocaleDateString()}
                  </div>
                </div>

                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 700,
                      background: std.status === 'CALIBRATED_ACTIVE' ? '#e7f7ed' : '#fff8e6',
                      color: std.status === 'CALIBRATED_ACTIVE' ? '#0d8a43' : '#b26b00',
                    }}
                  >
                    {std.status}
                  </span>
                  <div style={{ display: 'inline-flex', gap: 6 }}>
                    <button
                      onClick={() => setSelectedStandard(std)}
                      style={{
                        padding: '6px 10px',
                        background: '#f0f5f9',
                        color: '#073b69',
                        border: '1px solid #c4d7e5',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Eye size={12} /> View Certificate
                    </button>
                    <button
                      onClick={() => {
                        setIsCalibrateOpen(std);
                        setCalibForm({
                          calibratingLaboratory: std.calibratingLaboratory || 'RRSL Bangalore',
                          certificateNumber: `RRSL/CAL/2026/${Math.floor(1000 + Math.random() * 9000)}`,
                          measuredDeviationMg: '1.2',
                          maxPermissibleErrorMg: '5.0',
                          remarks: 'Annual re-calibration completed against national secondary mass standards.',
                        });
                      }}
                      style={{
                        padding: '6px 12px',
                        background: '#073b69',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Wrench size={12} /> Log Recalibration
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: View Official License Certificate (Form LM-1/2/3) */}
      {selectedLicense && (
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
          onClick={() => setSelectedLicense(null)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 8,
              maxWidth: 720,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 28,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
              border: '2px solid #073b69',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Crest & Header */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid #073b69', paddingBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#073b69', letterSpacing: '0.08em' }}>
                GOVERNMENT OF TELANGANA • DEPARTMENT OF LEGAL METROLOGY
              </div>
              <h2 style={{ fontSize: 18, color: '#073b69', margin: '6px 0 2px', fontWeight: 800 }}>
                {selectedLicense.licenseType === 'MANUFACTURER'
                  ? 'FORM LM-1: LICENCE TO MANUFACTURE WEIGHTS OR MEASURES'
                  : selectedLicense.licenseType === 'REPAIRER'
                  ? 'FORM LM-2: LICENCE TO REPAIR WEIGHTS OR MEASURES'
                  : 'FORM LM-3: LICENCE TO DEAL IN WEIGHTS OR MEASURES'}
              </h2>
              <div style={{ fontSize: 11, color: '#64748b' }}>
                [Issued under Section 23 of Legal Metrology Act, 2009 read with Rule 11 of Telangana Legal Metrology (Enforcement) Rules, 2011]
              </div>
            </div>

            {/* License Body Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: '#f8fafc', padding: 14, borderRadius: 6, fontSize: 13 }}>
              <div>
                <span style={{ color: '#64748b', fontSize: 11 }}>LICENCE NUMBER:</span>
                <div style={{ fontWeight: 800, color: '#073b69', fontFamily: 'monospace' }}>
                  {selectedLicense.licenseNumber}
                </div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: 11 }}>STATUTORY STATUS:</span>
                <div style={{ fontWeight: 800, color: selectedLicense.status === 'ACTIVE' ? '#0d8a43' : '#b42318' }}>
                  {selectedLicense.status}
                </div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: 11 }}>BUSINESS NAME:</span>
                <div style={{ fontWeight: 700, color: '#183247' }}>{selectedLicense.businessName}</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: 11 }}>PROPRIETOR / APPLICANT:</span>
                <div style={{ fontWeight: 600 }}>{selectedLicense.proprietorName}</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: 11 }}>REGISTERED ADDRESS:</span>
                <div>{selectedLicense.address} ({selectedLicense.district})</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: 11 }}>SECURITY DEPOSIT BOND:</span>
                <div style={{ fontWeight: 700, color: '#073b69' }}>
                  ₹{(selectedLicense.securityDeposit || 0).toLocaleString()} (Govt. Treasury Treasury Head 8443)
                </div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: 11 }}>AUTHORIZED SCOPE / CATEGORIES:</span>
                <div style={{ fontWeight: 600, color: '#073b69' }}>
                  {Array.isArray(selectedLicense.authorizedCategories)
                    ? selectedLicense.authorizedCategories.join(', ')
                    : selectedLicense.authorizedCategories}
                </div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: 11 }}>VALIDITY PERIOD:</span>
                <div style={{ fontWeight: 600 }}>
                  Valid Until: {new Date(selectedLicense.validUntil).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Conditions of License */}
            <div style={{ border: '1px dashed #cbd5e1', borderRadius: 6, padding: 12, fontSize: 11, color: '#475569' }}>
              <b>Statutory Conditions of Licence:</b>
              <ol style={{ margin: '4px 0 0', paddingLeft: 18, lineHeight: 1.5 }}>
                <li>The licensee shall not manufacture/repair any weighing instrument that deviates from the Central Model Approval (TAC).</li>
                <li>The licensee shall maintain a statutory register in Form LM-4 and submit monthly returns to the Controller.</li>
                <li>All working standards and test weights shall be recalibrated annually at the RRSL under Section 22.</li>
              </ol>
            </div>

            {/* Digital Signature & Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 48, height: 48, background: '#f1f5f9', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}>
                  <QrCode size={36} color="#073b69" />
                </div>
                <div style={{ fontSize: 10, color: '#64748b' }}>
                  <div>Digitally Sealed &amp; Verified</div>
                  <div style={{ fontFamily: 'monospace' }}>SHA256: 9e4f71a0b3c582...</div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#073b69' }}>CONTROLLER OF LEGAL METROLOGY</div>
                <div style={{ fontSize: 10, color: '#64748b' }}>Government of Telangana, Hyderabad</div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
              <button
                type="button"
                onClick={() => setSelectedLicense(null)}
                style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 4, cursor: 'pointer' }}
              >
                Close
              </button>
              <button
                type="button"
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
                <Printer size={15} /> Print License
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: View TAC Approval Certificate */}
      {selectedTac && (
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
          onClick={() => setSelectedTac(null)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 8,
              maxWidth: 720,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 28,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
              border: '2px solid #0c4d87',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', borderBottom: '2px solid #0c4d87', paddingBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#0c4d87', letterSpacing: '0.08em' }}>
                CENTRAL GOVERNMENT OF INDIA • MINISTRY OF CONSUMER AFFAIRS
              </div>
              <h2 style={{ fontSize: 18, color: '#073b69', margin: '6px 0 2px', fontWeight: 800 }}>
                CERTIFICATE OF APPROVAL OF MODEL OF WEIGHING INSTRUMENT (TAC)
              </h2>
              <div style={{ fontSize: 11, color: '#64748b' }}>
                Issued under Section 19 of Legal Metrology Act, 2009 &amp; General Rules, 2011 (OIML R-76 Recommendation)
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 6, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
              <div>
                <span style={{ fontSize: 11, color: '#64748b' }}>TAC CERTIFICATE NO:</span>
                <div style={{ fontWeight: 800, fontFamily: 'monospace', color: '#073b69' }}>{selectedTac.tacNumber}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b' }}>ACCURACY CLASS:</span>
                <div style={{ fontWeight: 800, color: '#0d8a43' }}>{selectedTac.instrumentClass} ({selectedTac.oimlStandard || 'OIML R-76'})</div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b' }}>MANUFACTURER:</span>
                <div style={{ fontWeight: 700 }}>{selectedTac.manufacturerName}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b' }}>BRAND &amp; MODEL:</span>
                <div style={{ fontWeight: 700 }}>{selectedTac.brandModel}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b' }}>MAX CAPACITY &amp; INTERVAL:</span>
                <div style={{ fontWeight: 600 }}>Cap: {selectedTac.maxCapacity} • e = {selectedTac.verificationScaleInterval}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b' }}>LOAD CELL SPECS:</span>
                <div style={{ fontWeight: 600 }}>{selectedTac.loadCellSpecs}</div>
              </div>
            </div>

            <div style={{ background: '#eff8ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: 12, fontSize: 12 }}>
              <div style={{ fontWeight: 700, color: '#1d4ed8', marginBottom: 4 }}>Cryptographic Firmware Verification Hash:</div>
              <div style={{ fontFamily: 'monospace', fontSize: 11, wordBreak: 'break-all', color: '#073b69' }}>
                {selectedTac.softwareVersionHash || 'SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069'}
              </div>
            </div>

            <div style={{ background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: 6, padding: 12, fontSize: 12 }}>
              <div style={{ fontWeight: 700, color: '#374151', marginBottom: 4 }}>Sealing Plan &amp; Anti-Tamper Provision:</div>
              <div style={{ color: '#4b5563' }}>{selectedTac.sealingPlan}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
              <button
                type="button"
                onClick={() => setSelectedTac(null)}
                style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 4, cursor: 'pointer' }}
              >
                Close
              </button>
              <button
                type="button"
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
                <Printer size={15} /> Print TAC Certificate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: View Working Standard Calibration Certificate */}
      {selectedStandard && (
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
          onClick={() => setSelectedStandard(null)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 8,
              maxWidth: 680,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 28,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
              border: '2px solid #183247',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', borderBottom: '2px solid #183247', paddingBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#183247', letterSpacing: '0.08em' }}>
                REGIONAL REFERENCE STANDARDS LABORATORY (RRSL)
              </div>
              <h2 style={{ fontSize: 18, color: '#073b69', margin: '6px 0 2px', fontWeight: 800 }}>
                CERTIFICATE OF TRACEABILITY OF WORKING STANDARD MASS
              </h2>
              <div style={{ fontSize: 11, color: '#64748b' }}>
                Traceable to National Prototype Kilogram No. 57 at CSIR-National Physical Laboratory (NPL), New Delhi
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 6, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
              <div>
                <span style={{ fontSize: 11, color: '#64748b' }}>STANDARD KIT ID:</span>
                <div style={{ fontWeight: 800, fontFamily: 'monospace', color: '#073b69' }}>{selectedStandard.kitId}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b' }}>ACCURACY CLASS:</span>
                <div style={{ fontWeight: 800, color: '#073b69' }}>Class {selectedStandard.accuracyClass}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b' }}>KIT DESCRIPTION:</span>
                <div style={{ fontWeight: 700 }}>{selectedStandard.kitName}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b' }}>CUSTODY OFFICER:</span>
                <div style={{ fontWeight: 700 }}>{selectedStandard.assignedOfficerName} ({selectedStandard.district})</div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b' }}>CALIBRATION CERTIFICATE NO:</span>
                <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{selectedStandard.calibrationCertificateNumber}</div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b' }}>CALIBRATING LAB:</span>
                <div style={{ fontWeight: 600 }}>{selectedStandard.calibratingLaboratory}</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
              <button
                type="button"
                onClick={() => setSelectedStandard(null)}
                style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 4, cursor: 'pointer' }}
              >
                Close
              </button>
              <button
                type="button"
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
                <Printer size={15} /> Print Certificate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Issue Official License */}
      {isNewLicenseOpen && (
        <div className="grievance-modal-overlay" onClick={() => setIsNewLicenseOpen(false)}>
          <div className="grievance-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ fontSize: 18, color: '#073b69', margin: 0 }}>Issue Statutory Legal Metrology License</h2>
            </div>

            {/* Quick Demo Presets */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, alignSelf: 'center' }}>Demo Presets:</span>
              <button
                type="button"
                onClick={() => {
                  setNewLic({
                    licenseType: 'MANUFACTURER',
                    businessName: 'Telangana Precision Instruments Pvt Ltd',
                    proprietorName: 'Srikanth Rao',
                    panNumber: 'AAACT7891M',
                    gstin: '36AAACT7891M1Z8',
                    address: 'Plot 42, IDA Cherlapally, Medchal-Malkajgiri',
                    district: 'Hyderabad',
                    securityDeposit: 50000,
                    authorizedCategories: 'Electronic Counter Scales (Class III), Platform Weighbridges (Class IV)',
                  });
                }}
                style={{ fontSize: 11, padding: '4px 8px', borderRadius: 4, border: '1px solid #c9d8e2', background: '#f0f5f9', cursor: 'pointer', color: '#073b69', fontWeight: 600 }}
              >
                Scale Manufacturer (LM-1)
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewLic({
                    licenseType: 'REPAIRER',
                    businessName: 'Deccan Scale Service & Calibration Workshop',
                    proprietorName: 'Mohammed Rafi',
                    panNumber: 'BBMTR1245P',
                    gstin: '36BBMTR1245P1Z2',
                    address: 'Shop 14, Osmangunj Grain Market, Hyderabad',
                    district: 'Hyderabad',
                    securityDeposit: 25000,
                    authorizedCategories: 'Mechanical & Electronic Weighing Instruments up to 500kg',
                  });
                }}
                style={{ fontSize: 11, padding: '4px 8px', borderRadius: 4, border: '1px solid #c9d8e2', background: '#f0f5f9', cursor: 'pointer', color: '#073b69', fontWeight: 600 }}
              >
                Certified Repairer (LM-2)
              </button>
            </div>

            <form onSubmit={handleCreateLicense} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>License Type</label>
                  <select
                    value={newLic.licenseType}
                    onChange={(e) => setNewLic({ ...newLic, licenseType: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 4, border: '1px solid #c9d8e2' }}
                  >
                    <option value="MANUFACTURER">Manufacturer (LM-1)</option>
                    <option value="REPAIRER">Repairer (LM-2)</option>
                    <option value="DEALER">Dealer (LM-3)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>Security Deposit (₹)</label>
                  <input
                    type="number"
                    required
                    value={newLic.securityDeposit}
                    onChange={(e) => setNewLic({ ...newLic, securityDeposit: Number(e.target.value) })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 4, border: '1px solid #c9d8e2' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Business Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Metrology Systems"
                  value={newLic.businessName}
                  onChange={(e) => setNewLic({ ...newLic, businessName: e.target.value })}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 4, border: '1px solid #c9d8e2' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>Proprietor Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Full legal name"
                    value={newLic.proprietorName}
                    onChange={(e) => setNewLic({ ...newLic, proprietorName: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 4, border: '1px solid #c9d8e2' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>PAN Number</label>
                  <input
                    type="text"
                    required
                    placeholder="AAAAA0000A"
                    value={newLic.panNumber}
                    onChange={(e) => setNewLic({ ...newLic, panNumber: e.target.value.toUpperCase() })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 4, border: '1px solid #c9d8e2' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Registered Address</label>
                <input
                  type="text"
                  required
                  placeholder="Premises, Street, District"
                  value={newLic.address}
                  onChange={(e) => setNewLic({ ...newLic, address: e.target.value })}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 4, border: '1px solid #c9d8e2' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Authorized Instrument Categories</label>
                <input
                  type="text"
                  required
                  value={newLic.authorizedCategories}
                  onChange={(e) => setNewLic({ ...newLic, authorizedCategories: e.target.value })}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 4, border: '1px solid #c9d8e2' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setIsNewLicenseOpen(false)}
                  style={{ padding: '8px 14px', background: '#f5f8fa', border: '1px solid #ccd9e2', borderRadius: 4, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', background: '#073b69', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 700, cursor: 'pointer' }}
                >
                  Issue Official License
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New TAC */}
      {isNewTacOpen && (
        <div className="grievance-modal-overlay" onClick={() => setIsNewTacOpen(false)}>
          <div className="grievance-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580 }}>
            <h2 style={{ fontSize: 18, color: '#073b69', marginBottom: 12 }}>Register Model Approval (Type Approval Certificate)</h2>

            {/* Quick Preset */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, alignSelf: 'center' }}>Preset:</span>
              <button
                type="button"
                onClick={() => {
                  setNewTac({
                    tacNumber: `IND/09/2026/${Math.floor(100 + Math.random() * 900)}`,
                    manufacturerName: 'Bharat Scale Works Ltd',
                    brandModel: 'Kisan-Weigh Pro 50kg Digital Counter Scale',
                    instrumentClass: 'Class III',
                    maxCapacity: '50 kg',
                    verificationScaleInterval: 'e = 2 g',
                    loadCellSpecs: 'Single point aluminium load cell, IP65, 2.0 mV/V sensitivity',
                    softwareVersionHash: 'SHA256:4a8b79f1c3e098a54d6829bf45e1289dc390b1fa67',
                    sealingPlan: 'Security wire pass-through on calibration plate and display case.',
                  });
                }}
                style={{ fontSize: 11, padding: '4px 8px', borderRadius: 4, border: '1px solid #c9d8e2', background: '#f0f5f9', cursor: 'pointer', color: '#073b69', fontWeight: 600 }}
              >
                Class III Commercial Scale Preset
              </button>
            </div>

            <form onSubmit={handleCreateTac} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>TAC Certificate Number</label>
                  <input
                    type="text"
                    required
                    placeholder="IND/09/2026/XXX"
                    value={newTac.tacNumber}
                    onChange={(e) => setNewTac({ ...newTac, tacNumber: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 4, border: '1px solid #c9d8e2' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>Accuracy Class</label>
                  <select
                    value={newTac.instrumentClass}
                    onChange={(e) => setNewTac({ ...newTac, instrumentClass: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 4, border: '1px solid #c9d8e2' }}
                  >
                    <option value="Class I">Class I (Special Accuracy / Analytical)</option>
                    <option value="Class II">Class II (High Accuracy / Laboratory)</option>
                    <option value="Class III">Class III (Medium Accuracy / Commercial)</option>
                    <option value="Class IV">Class IV (Ordinary Accuracy / Weighbridges)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Manufacturer</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Avery India Metrology"
                  value={newTac.manufacturerName}
                  onChange={(e) => setNewTac({ ...newTac, manufacturerName: e.target.value })}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 4, border: '1px solid #c9d8e2' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Brand &amp; Model Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Eagle Pro 30kg Digital Bench Scale"
                  value={newTac.brandModel}
                  onChange={(e) => setNewTac({ ...newTac, brandModel: e.target.value })}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 4, border: '1px solid #c9d8e2' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>Max Capacity</label>
                  <input
                    type="text"
                    required
                    placeholder="30 kg"
                    value={newTac.maxCapacity}
                    onChange={(e) => setNewTac({ ...newTac, maxCapacity: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 4, border: '1px solid #c9d8e2' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>Scale Interval (e)</label>
                  <input
                    type="text"
                    required
                    placeholder="e = 1 g"
                    value={newTac.verificationScaleInterval}
                    onChange={(e) => setNewTac({ ...newTac, verificationScaleInterval: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 4, border: '1px solid #c9d8e2' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Load Cell Technical Specification</label>
                <input
                  type="text"
                  required
                  value={newTac.loadCellSpecs}
                  onChange={(e) => setNewTac({ ...newTac, loadCellSpecs: e.target.value })}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 4, border: '1px solid #c9d8e2' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Firmware Version SHA-256 Hash</label>
                <input
                  type="text"
                  required
                  value={newTac.softwareVersionHash}
                  onChange={(e) => setNewTac({ ...newTac, softwareVersionHash: e.target.value })}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 4, border: '1px solid #c9d8e2', fontFamily: 'monospace', fontSize: 11 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Sealing Plan Description</label>
                <input
                  type="text"
                  required
                  value={newTac.sealingPlan}
                  onChange={(e) => setNewTac({ ...newTac, sealingPlan: e.target.value })}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 4, border: '1px solid #c9d8e2' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setIsNewTacOpen(false)}
                  style={{ padding: '8px 14px', background: '#f5f8fa', border: '1px solid #ccd9e2', borderRadius: 4, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', background: '#073b69', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 700, cursor: 'pointer' }}
                >
                  Save Model Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Recalibrate Standard */}
      {isCalibrateOpen && (
        <div className="grievance-modal-overlay" onClick={() => setIsCalibrateOpen(null)}>
          <div className="grievance-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <h2 style={{ fontSize: 18, color: '#073b69', marginBottom: 6 }}>Log Working Standard Recalibration</h2>
            <p style={{ fontSize: 13, color: '#617a8c', marginBottom: 16 }}>
              Kit: <b>{isCalibrateOpen.kitId}</b> ({isCalibrateOpen.kitName})
            </p>

            <form onSubmit={handleCalibrate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Calibrating Laboratory</label>
                <input
                  type="text"
                  required
                  value={calibForm.calibratingLaboratory}
                  onChange={(e) => setCalibForm({ ...calibForm, calibratingLaboratory: e.target.value })}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 4, border: '1px solid #c9d8e2' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Calibration Certificate Number</label>
                <input
                  type="text"
                  required
                  value={calibForm.certificateNumber}
                  onChange={(e) => setCalibForm({ ...calibForm, certificateNumber: e.target.value })}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 4, border: '1px solid #c9d8e2' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>Measured Deviation (mg)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={calibForm.measuredDeviationMg}
                    onChange={(e) => setCalibForm({ ...calibForm, measuredDeviationMg: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 4, border: '1px solid #c9d8e2' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>Max Permissible Error (mg)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={calibForm.maxPermissibleErrorMg}
                    onChange={(e) => setCalibForm({ ...calibForm, maxPermissibleErrorMg: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 4, border: '1px solid #c9d8e2' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Calibration Remarks</label>
                <input
                  type="text"
                  value={calibForm.remarks}
                  onChange={(e) => setCalibForm({ ...calibForm, remarks: e.target.value })}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 4, border: '1px solid #c9d8e2' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setIsCalibrateOpen(null)}
                  style={{ padding: '8px 14px', background: '#f5f8fa', border: '1px solid #ccd9e2', borderRadius: 4, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', background: '#0d8a43', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 700, cursor: 'pointer' }}
                >
                  Record Calibration Pass
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
