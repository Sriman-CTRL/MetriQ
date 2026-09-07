import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  MapPin,
  FileCheck,
  AlertOctagon,
  Users,
  Search,
  Plus,
  Scale,
  RefreshCw,
  Landmark,
  Gavel,
  CheckCircle2,
  Lock,
  Boxes,
  FileText,
} from 'lucide-react';
import { api } from '../api';

export function FlyingSquadEnforcement() {
  const [activeTab, setActiveTab] = useState<'RAIDS' | 'PANCHNAMAS' | 'NEW_PANCHNAMA'>('PANCHNAMAS');
  const [stats, setStats] = useState<any>(null);
  const [raids, setRaids] = useState<any[]>([]);
  const [panchnamas, setPanchnamas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompounding, setSelectedCompounding] = useState('ALL');

  // New Panchnama Form State
  const [establishmentName, setEstablishmentName] = useState('Sri Lakshmi Wholesale Spices & Agro Traders');
  const [address, setAddress] = useState('Shop 42-45, Begum Bazar Main Road, Hyderabad');
  const [accusedPerson, setAccusedPerson] = useState('K. Laxminarayana');
  const [accusedRole, setAccusedRole] = useState('Proprietor / Licensee');
  const [investigatingOfficer, setInvestigatingOfficer] = useState('Assistant Controller D. Sharma (Flying Squad)');
  const [pancha1Name, setPancha1Name] = useState('K. Venkateshwar Rao');
  const [pancha1Phone, setPancha1Phone] = useState('+91 98490 12345');
  const [pancha2Name, setPancha2Name] = useState('Mohd. Abdul Qadeer');
  const [pancha2Phone, setPancha2Phone] = useState('+91 94401 67890');
  const [seizedDescription, setSeizedDescription] = useState('500g Cast Iron Hexagonal Weights with drilled lead bottom cavity');
  const [seizedQuantity, setSeizedQuantity] = useState(4);
  const [seizedMarks, setSeizedMarks] = useState('TS-LM-FAKE-998');
  const [seizedReason, setSeizedReason] = useState('Drilled lead plug cavity reducing statutory mass by 18g under Section 27');
  const [malkhanaBox, setMalkhanaBox] = useState('BOX-MALKHANA-014');
  const [panchnamaFeedback, setPanchnamaFeedback] = useState<string | null>(null);

  // Compounding Action Modal
  const [selectedPanchnamaForAction, setSelectedPanchnamaForAction] = useState<any>(null);
  const [compoundFee, setCompoundFee] = useState(25000);
  const [compoundAction, setCompoundAction] = useState<'COMPOUND' | 'PROSECUTE_IN_COURT'>('COMPOUND');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sRes, rRes, pRes] = await Promise.all([
        api.raids.getStats(),
        api.raids.listRaids({ search: searchTerm }),
        api.raids.listPanchnamas({ search: searchTerm, compoundingStatus: selectedCompounding }),
      ]);
      if (sRes.success) setStats(sRes.data);
      if (rRes.success) setRaids(rRes.data || []);
      if (pRes.success) setPanchnamas(pRes.data || []);
    } catch (err) {
      console.error('Failed to load raid data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCompounding]);

  const handleCreatePanchnama = async (e: React.FormEvent) => {
    e.preventDefault();
    setPanchnamaFeedback(null);
    try {
      const res = await api.raids.createPanchnama({
        establishmentName,
        address,
        accusedPersonName: accusedPerson,
        accusedRole,
        investigatingOfficerName: investigatingOfficer,
        panchas: [
          {
            name: pancha1Name,
            age: 44,
            occupation: 'Independent Witness / Merchant',
            address: 'Begum Bazar Commercial Area, Hyderabad',
            phone: pancha1Phone,
          },
          {
            name: pancha2Name,
            age: 39,
            occupation: 'Independent Witness / Merchant',
            address: 'Secunderabad Market Yard',
            phone: pancha2Phone,
          },
        ],
        seizedItems: [
          {
            serialNumber: 1,
            description: seizedDescription,
            quantity: seizedQuantity,
            identificationMarks: seizedMarks,
            reasonForSeizure: seizedReason,
            custodyMalkhanaBoxNumber: malkhanaBox,
          },
        ],
        statutorySections: [
          'Section 27 (Manufacture, sale or use of non-standard weight)',
          'Section 30 (Penalty for short measurement)',
          'Section 38 (Penalty for tampering with seal)',
        ],
      });

      if (res.success) {
        setPanchnamaFeedback(`Statutory Seizure Memo ${res.data.panchnamaNumber} successfully generated & digitally signed!`);
        fetchData();
        setActiveTab('PANCHNAMAS');
      }
    } catch (err: any) {
      setPanchnamaFeedback(`Error: ${err.message}`);
    }
  };

  const handleSettleAction = async () => {
    if (!selectedPanchnamaForAction) return;
    try {
      const res = await api.raids.compoundPanchnama(selectedPanchnamaForAction.panchnamaNumber, {
        action: compoundAction,
        compoundingFeeAmount: compoundFee,
      });
      if (res.success) {
        setSelectedPanchnamaForAction(null);
        fetchData();
      }
    } catch (err) {
      console.error('Compounding action failed:', err);
    }
  };

  return (
    <div className="space-y-6" id="flying-squad-root">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-amber-950 text-white p-6 rounded-xl shadow-lg border border-red-800/40">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-red-500/20 text-red-300 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-red-400/30 uppercase tracking-wide">
                Phase 10 Enforcement
              </span>
              <span className="text-slate-300 text-xs">Sections 15, 27, 30 & 48, Legal Metrology Act, 2009</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
              Flying Squad Surprise Raids & Digital Panchnama Desk
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-3xl">
              Vigilance raid taskforce dispatch, Form 1 digital Seizure Memo generation with independent Pancha witnesses,
              Malkhana evidence vault tracking, Section 48 statutory compounding, and JMFC court prosecution.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('NEW_PANCHNAMA')}
              className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow transition"
              id="btn-create-panchnama"
            >
              <Plus className="w-4 h-4" />
              Generate Seizure Memo (Panchnama)
            </button>
            <button
              onClick={fetchData}
              disabled={loading}
              className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-red-900/60">
            <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-lg border border-white/10">
              <div className="text-xs font-medium text-red-300">Surprise Raids Conducted</div>
              <div className="text-2xl font-bold text-white mt-1">{stats.totalRaids || 3}</div>
              <div className="text-xs text-slate-400 mt-0.5">{stats.violationsFound || 2} Violations Uncovered</div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-lg border border-white/10">
              <div className="text-xs font-medium text-amber-300">Active Seizure Memos</div>
              <div className="text-2xl font-bold text-amber-300 mt-1">{stats.activePanchnamas || 2}</div>
              <div className="text-xs text-slate-400 mt-0.5">Form 1 Panchnamas Executed</div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-lg border border-white/10">
              <div className="text-xs font-medium text-emerald-300">Compounding Revenue</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">
                ₹{(stats.totalCompoundingFeesCollected || 25000).toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {stats.compoundedCases || 1} Cases Settled (Sec 48)
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-lg border border-white/10">
              <div className="text-xs font-medium text-purple-300">Court Prosecutions</div>
              <div className="text-2xl font-bold text-purple-300 mt-1">{stats.courtCases || 1}</div>
              <div className="text-xs text-slate-400 mt-0.5">Charge Sheets Framed in JMFC</div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('PANCHNAMAS')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
            activeTab === 'PANCHNAMAS'
              ? 'border-red-700 text-red-800 bg-red-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
          id="tab-panchnamas"
        >
          <FileCheck className="w-4 h-4" />
          Seizure Memos (Form 1 Panchnamas) ({panchnamas.length})
        </button>

        <button
          onClick={() => setActiveTab('RAIDS')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
            activeTab === 'RAIDS'
              ? 'border-red-700 text-red-800 bg-red-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
          id="tab-raids"
        >
          <ShieldAlert className="w-4 h-4" />
          Vigilance Squad Raid Operations ({raids.length})
        </button>

        <button
          onClick={() => setActiveTab('NEW_PANCHNAMA')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
            activeTab === 'NEW_PANCHNAMA'
              ? 'border-red-700 text-red-800 bg-red-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
          id="tab-new-panchnama"
        >
          <FileText className="w-4 h-4" />
          Execute Digital Panchnama
        </button>
      </div>

      {/* Tab 1: Panchnamas Table */}
      {activeTab === 'PANCHNAMAS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Panchnama #, accused, or shop..."
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-xs text-slate-500">Compounding Status:</span>
              <select
                value={selectedCompounding}
                onChange={(e) => setSelectedCompounding(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="ELIGIBLE_FOR_COMPOUNDING">Eligible for Compounding</option>
                <option value="COMPOUNDED">Compounded (Sec 48)</option>
                <option value="PROSECUTION_FILED_IN_COURT">Prosecution in JMFC Court</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {panchnamas.map((p) => (
              <div
                key={p._id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-slate-300 transition"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-red-900">{p.panchnamaNumber}</span>
                      {p.compoundingStatus === 'COMPOUNDED' && (
                        <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Compounded (₹{p.compoundingFeeAmount.toLocaleString('en-IN')})
                        </span>
                      )}
                      {p.compoundingStatus === 'PROSECUTION_FILED_IN_COURT' && (
                        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <Gavel className="w-3 h-3" />
                          Court Case: {p.courtCaseDetails?.ccOrFirNumber}
                        </span>
                      )}
                      {p.compoundingStatus === 'ELIGIBLE_FOR_COMPOUNDING' && (
                        <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <AlertOctagon className="w-3 h-3" />
                          Compounding Eligible
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-800 text-base mt-0.5">{p.establishmentName}</h3>
                    <p className="text-xs text-slate-500">{p.address} • Accused: {p.accusedPersonName} ({p.accusedRole})</p>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-slate-500">Date of Seizure</div>
                    <div className="text-sm font-semibold text-slate-800">
                      {new Date(p.inspectionDate).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-slate-400">{p.investigatingOfficerName}</div>
                  </div>
                </div>

                {/* Seized Articles Inventory & Panchas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-1">
                  <div>
                    <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-2">
                      <Boxes className="w-3.5 h-3.5 text-red-600" />
                      Seized Articles in District Malkhana Vault:
                    </div>
                    <div className="space-y-1.5">
                      {p.seizedItems?.map((item: any, idx: number) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 rounded p-2 text-xs">
                          <div className="font-semibold text-slate-800">
                            {item.quantity}x {item.description}
                          </div>
                          <div className="text-slate-600 mt-0.5">{item.reasonForSeizure}</div>
                          <div className="text-slate-400 font-mono mt-0.5 text-[11px]">
                            Marks: {item.identificationMarks} • Vault: {item.custodyMalkhanaBoxNumber}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-2">
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      Independent Witnesses (Panchas):
                    </div>
                    <div className="space-y-1.5">
                      {p.panchas?.map((pancha: any, idx: number) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 rounded p-2 text-xs">
                          <div className="font-medium text-slate-800">
                            {pancha.name} ({pancha.age} yrs, {pancha.occupation})
                          </div>
                          <div className="text-slate-500 text-[11px]">{pancha.address} • {pancha.phone}</div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                      <span className="font-mono text-[11px] text-slate-400 truncate max-w-[200px]" title={p.officerDigitalSignatureHash}>
                        SHA-256: {p.officerDigitalSignatureHash?.slice(0, 16)}...
                      </span>

                      {p.compoundingStatus === 'ELIGIBLE_FOR_COMPOUNDING' && (
                        <button
                          onClick={() => {
                            setSelectedPanchnamaForAction(p);
                            setCompoundFee(p.compoundingFeeAmount || 25000);
                          }}
                          className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1 rounded text-xs font-medium transition"
                        >
                          Take Statutory Action
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Raids List */}
      {activeTab === 'RAIDS' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Raid Code</th>
                  <th className="px-4 py-3">Vigilance Squad</th>
                  <th className="px-4 py-3">Target Establishment</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {raids.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3 font-mono font-bold text-red-900">{r.raidCode}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{r.squadName}</div>
                      <div className="text-xs text-slate-500">Lead: {r.squadLeader}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{r.targetBusinessName}</div>
                      <div className="text-xs text-slate-500">{r.location}</div>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium">
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                        {r.premiseType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                          r.status === 'VIOLATIONS_FOUND_SEIZED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {r.panchnamaNumber ? (
                        <span className="font-mono bg-red-50 text-red-800 px-2 py-0.5 rounded border border-red-200">
                          {r.panchnamaNumber}
                        </span>
                      ) : (
                        <span>Verified Clean</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: New Panchnama Form */}
      {activeTab === 'NEW_PANCHNAMA' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm max-w-4xl mx-auto">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-red-700" />
              Statutory Seizure Memo (Form 1 Panchnama) Generator
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Executed under Sections 15 & 16 of the Legal Metrology Act, 2009 for seizure of unauthorized weights,
              counterfeit stamping dies, or tampered electronic scale components.
            </p>
          </div>

          {panchnamaFeedback && (
            <div
              className={`p-3 rounded-lg text-sm font-medium my-4 ${
                panchnamaFeedback.includes('Error')
                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              {panchnamaFeedback}
            </div>
          )}

          <form onSubmit={handleCreatePanchnama} className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Commercial Establishment
                </label>
                <input
                  type="text"
                  required
                  value={establishmentName}
                  onChange={(e) => setEstablishmentName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Premises Full Address
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Accused Person Name
                </label>
                <input
                  type="text"
                  required
                  value={accusedPerson}
                  onChange={(e) => setAccusedPerson(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Role / Designation</label>
                <input
                  type="text"
                  required
                  value={accusedRole}
                  onChange={(e) => setAccusedRole(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Investigating Officer
                </label>
                <input
                  type="text"
                  required
                  value={investigatingOfficer}
                  onChange={(e) => setInvestigatingOfficer(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                />
              </div>
            </div>

            {/* Independent Witnesses (Panchas) */}
            <div className="border-t border-slate-200 pt-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                Statutory Independent Witnesses (Panchas)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-xs font-semibold text-slate-700 mb-1">Pancha Witness #1</div>
                  <input
                    type="text"
                    required
                    placeholder="Witness Name"
                    value={pancha1Name}
                    onChange={(e) => setPancha1Name(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 text-xs mb-2"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Phone Number"
                    value={pancha1Phone}
                    onChange={(e) => setPancha1Phone(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 text-xs"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-xs font-semibold text-slate-700 mb-1">Pancha Witness #2</div>
                  <input
                    type="text"
                    required
                    placeholder="Witness Name"
                    value={pancha2Name}
                    onChange={(e) => setPancha2Name(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 text-xs mb-2"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Phone Number"
                    value={pancha2Phone}
                    onChange={(e) => setPancha2Phone(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Seized Articles Inventory */}
            <div className="border-t border-slate-200 pt-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5 text-red-600" />
                Seized Article Details & Malkhana Vault Allotment
              </h4>
              <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-medium text-slate-600">Item Description</label>
                    <input
                      type="text"
                      required
                      value={seizedDescription}
                      onChange={(e) => setSeizedDescription(e.target.value)}
                      className="w-full border border-slate-300 rounded p-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600">Quantity</label>
                    <input
                      type="number"
                      required
                      value={seizedQuantity}
                      onChange={(e) => setSeizedQuantity(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded p-1.5 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600">Identification Marks</label>
                    <input
                      type="text"
                      value={seizedMarks}
                      onChange={(e) => setSeizedMarks(e.target.value)}
                      className="w-full border border-slate-300 rounded p-1.5 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600">Reason for Seizure</label>
                    <input
                      type="text"
                      value={seizedReason}
                      onChange={(e) => setSeizedReason(e.target.value)}
                      className="w-full border border-slate-300 rounded p-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600">Malkhana Box Number</label>
                    <input
                      type="text"
                      value={malkhanaBox}
                      onChange={(e) => setMalkhanaBox(e.target.value)}
                      className="w-full border border-slate-300 rounded p-1.5 text-xs font-mono font-semibold"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="bg-red-800 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 shadow transition"
              >
                <FileCheck className="w-4 h-4" />
                Digitally Sign & Register Panchnama
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Compounding & Prosecution Action Modal */}
      {selectedPanchnamaForAction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Gavel className="w-5 h-5 text-red-700" />
              Statutory Disposal: {selectedPanchnamaForAction.panchnamaNumber}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Establishment: <span className="font-semibold text-slate-700">{selectedPanchnamaForAction.establishmentName}</span>
            </p>

            <div className="space-y-3 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-700">Enforcement Disposal Path</label>
                <select
                  value={compoundAction}
                  onChange={(e: any) => setCompoundAction(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 text-sm bg-white mt-1"
                >
                  <option value="COMPOUND">Section 48 Compounding (Civil Penalty Remittance)</option>
                  <option value="PROSECUTE_IN_COURT">Judicial Prosecution (JMFC Court Charge Sheet)</option>
                </select>
              </div>

              {compoundAction === 'COMPOUND' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700">
                    Compounding Penalty Fee Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={compoundFee}
                    onChange={(e) => setCompoundFee(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded p-2 text-sm font-semibold text-emerald-800 mt-1"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Will be remitted into Telangana Cyber Treasury Head 0435-101.
                  </p>
                </div>
              )}

              {compoundAction === 'PROSECUTE_IN_COURT' && (
                <div className="bg-purple-50 border border-purple-200 p-3 rounded text-xs text-purple-900">
                  A formal criminal charge sheet will be framed before the Special Metropolitan Magistrate (Legal Metrology),
                  Nampally, under Sections 27/30/38.
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedPanchnamaForAction(null)}
                  className="px-4 py-2 border border-slate-300 rounded text-sm text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSettleAction}
                  className="px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded text-sm font-medium"
                >
                  Confirm Statutory Disposal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
