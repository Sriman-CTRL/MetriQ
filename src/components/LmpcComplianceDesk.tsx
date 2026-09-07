import React, { useState, useEffect } from 'react';
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  Plus,
  ShieldCheck,
  Scale,
  RefreshCw,
  TrendingDown,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { api } from '../api';

export function LmpcComplianceDesk() {
  const [activeTab, setActiveTab] = useState<'SAMPLES' | 'REGISTRATIONS' | 'CALCULATOR'>('SAMPLES');
  const [stats, setStats] = useState<any>(null);
  const [samples, setSamples] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResult, setSelectedResult] = useState('ALL');

  // Interactive Test Calculator state
  const [calcCommodity, setCalcCommodity] = useState('Fortune Sunlite Sunflower Oil');
  const [calcDeclaredQty, setCalcDeclaredQty] = useState(1000);
  const [calcUnit, setCalcUnit] = useState('ml');
  const [calcMrp, setCalcMrp] = useState(148);
  const [calcBatch, setCalcBatch] = useState('BAT-2026-AUG-991');
  const [calcManufacturer, setCalcManufacturer] = useState('Adani Wilmar Limited');
  const [calcLocation, setCalcLocation] = useState('Metro Wholesale Depot, Moosapet');
  const [sampleWeightsText, setSampleWeightsText] = useState(
    '1001, 1002, 998, 1004, 1000, 997, 1005, 999, 1003, 1000, 1001, 998, 1002, 1004, 999, 1001, 1003, 998, 1002, 1000, 1005, 999, 1001, 1002, 998, 1003, 1001, 1000, 1004, 999, 1001, 1002'
  );
  const [calcFeedback, setCalcFeedback] = useState<string | null>(null);

  // New Registration modal state
  const [showRegModal, setShowRegModal] = useState(false);
  const [newReg, setNewReg] = useState({
    companyName: '',
    applicantType: 'MANUFACTURER',
    authorizedPerson: '',
    panNumber: '',
    gstin: '',
    email: '',
    phone: '',
    registeredAddress: '',
    commodities: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sRes, smpRes, regRes] = await Promise.all([
        api.lmpc.getStats(),
        api.lmpc.listSamples({ search: searchTerm, result: selectedResult }),
        api.lmpc.listRegistrations({ search: searchTerm }),
      ]);
      if (sRes.success) setStats(sRes.data);
      if (smpRes.success) setSamples(smpRes.data || []);
      if (regRes.success) setRegistrations(regRes.data || []);
    } catch (err) {
      console.error('Failed to load LMPC data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedResult]);

  const handleRunStatisticalTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setCalcFeedback(null);
    try {
      const weights = sampleWeightsText
        .split(',')
        .map((s) => parseFloat(s.trim()))
        .filter((n) => !isNaN(n));

      if (weights.length === 0) {
        setCalcFeedback('Error: Please provide at least one valid numeric sample weight.');
        return;
      }

      const res = await api.lmpc.createSample({
        brandName: calcCommodity,
        commodityType: 'Packaged Food / Edible Consumables',
        manufacturerOrPacker: calcManufacturer,
        batchNumber: calcBatch,
        declaredQuantity: calcDeclaredQty,
        unit: calcUnit,
        declaredMrp: calcMrp,
        observedWeights: weights,
        inspectionLocation: calcLocation,
        mandatoryLabelsPresent: {
          mrp: true,
          netQty: true,
          mfgDate: true,
          consumerCare: true,
          countryOfOrigin: true,
        },
      });

      if (res.success) {
        setCalcFeedback(`Test Recorded! Result: ${res.data.result}. Mean: ${res.data.meanQuantity}${calcUnit}`);
        fetchData();
      }
    } catch (err: any) {
      setCalcFeedback(`Error: ${err.message}`);
    }
  };

  const handleSimulateBatch = (type: 'PASS' | 'DEFICIENT' | 'CRITICAL') => {
    const declared = calcDeclaredQty;
    const count = 32;
    const weights: number[] = [];

    for (let i = 0; i < count; i++) {
      if (type === 'PASS') {
        const jitter = (Math.random() - 0.4) * 6; // slightly above mean
        weights.push(Number((declared + jitter).toFixed(1)));
      } else if (type === 'DEFICIENT') {
        const jitter = (Math.random() - 0.8) * 15; // consistently below declared
        weights.push(Number((declared - 15 + jitter).toFixed(1)));
      } else {
        // Critical T2
        if (i < 3) {
          weights.push(Number((declared - 35).toFixed(1))); // way below T2
        } else {
          weights.push(Number((declared - 8).toFixed(1)));
        }
      }
    }

    setSampleWeightsText(weights.join(', '));
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.lmpc.createRegistration({
        ...newReg,
        commodities: newReg.commodities.split(',').map((c) => c.trim()),
      });
      if (res.success) {
        setShowRegModal(false);
        setNewReg({
          companyName: '',
          applicantType: 'MANUFACTURER',
          authorizedPerson: '',
          panNumber: '',
          gstin: '',
          email: '',
          phone: '',
          registeredAddress: '',
          commodities: '',
        });
        fetchData();
      }
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  return (
    <div className="space-y-6" id="lmpc-desk-root">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 text-white p-6 rounded-xl shadow-lg border border-teal-700/50">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-teal-500/20 text-teal-300 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-teal-400/30 uppercase tracking-wide">
                Phase 9 Statutory Domain
              </span>
              <span className="text-slate-300 text-xs">Legal Metrology (Packaged Commodities) Rules, 2011</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
              Packaged Commodities & Net Content Verification Desk
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-3xl">
              Statutory Form-I packer & importer licensing registry, Schedule II Maximum Allowable Deficiency (MAD)
              sampling verification lab, and deceptive packaging anti-fraud enforcement under Section 36.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRegModal(true)}
              className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow transition"
              id="btn-new-lmpc-reg"
            >
              <Plus className="w-4 h-4" />
              New LMPC Registration
            </button>
            <button
              onClick={fetchData}
              disabled={loading}
              className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition"
              title="Refresh Registry"
              id="btn-refresh-lmpc"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats Metrics Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-teal-800/60">
            <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-lg border border-white/10">
              <div className="text-xs font-medium text-teal-300">Registered Entities</div>
              <div className="text-2xl font-bold text-white mt-1">{stats.totalRegistrations || 3}</div>
              <div className="text-xs text-slate-400 mt-0.5">
                {stats.approvedRegistrations || 3} Active / Form-I Approved
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-lg border border-white/10">
              <div className="text-xs font-medium text-emerald-300">Schedule II Samples Tested</div>
              <div className="text-2xl font-bold text-white mt-1">{stats.totalSamplesTested || 3}</div>
              <div className="text-xs text-emerald-400 mt-0.5">
                {stats.passRate || 33}% Legal Tolerance Compliance
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-lg border border-white/10">
              <div className="text-xs font-medium text-amber-300">Deficient Lots Detected</div>
              <div className="text-2xl font-bold text-amber-300 mt-1">{stats.deficientSamples || 2}</div>
              <div className="text-xs text-slate-400 mt-0.5">Short Net Quantity Identified</div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-lg border border-white/10">
              <div className="text-xs font-medium text-rose-300">Seizures Recommended</div>
              <div className="text-2xl font-bold text-rose-400 mt-1">{stats.seizuresRecommended || 2}</div>
              <div className="text-xs text-slate-400 mt-0.5">Referred to Flying Squad Raids</div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('SAMPLES')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
            activeTab === 'SAMPLES'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
          id="tab-lmpc-samples"
        >
          <Scale className="w-4 h-4" />
          Field Sampling & Tolerance Tests ({samples.length})
        </button>

        <button
          onClick={() => setActiveTab('CALCULATOR')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
            activeTab === 'CALCULATOR'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
          id="tab-lmpc-calc"
        >
          <Package className="w-4 h-4" />
          Schedule II Statistical Calculator
        </button>

        <button
          onClick={() => setActiveTab('REGISTRATIONS')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
            activeTab === 'REGISTRATIONS'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
          id="tab-lmpc-reg"
        >
          <Building2 className="w-4 h-4" />
          LMPC Registered Packers & Importers ({registrations.length})
        </button>
      </div>

      {/* Tab 1: Field Samples Table */}
      {activeTab === 'SAMPLES' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search brand, batch, or packer..."
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-xs text-slate-500">Filter Result:</span>
              <select
                value={selectedResult}
                onChange={(e) => setSelectedResult(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white"
              >
                <option value="ALL">All Results</option>
                <option value="PASS">Compliant (PASS)</option>
                <option value="DEFICIENT_AVERAGE">Deficient Average (FAIL)</option>
                <option value="CRITICAL_T2">Critical T2 Exceeded (SEIZE)</option>
              </select>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Sample ID / Batch</th>
                    <th className="px-4 py-3">Brand & Commodity</th>
                    <th className="px-4 py-3">Declared vs Mean</th>
                    <th className="px-4 py-3">Schedule II Tolerances</th>
                    <th className="px-4 py-3">Statutory Verdict</th>
                    <th className="px-4 py-3">Location & Inspector</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {samples.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <div>{s.sampleId}</div>
                        <span className="text-xs text-slate-500 font-mono">Batch: {s.batchNumber}</span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{s.brandName}</div>
                        <div className="text-xs text-slate-500">
                          {s.manufacturerOrPacker} • MRP ₹{s.declaredMrp}
                        </div>
                      </td>

                      <td className="px-4 py-3 font-mono text-xs">
                        <div>
                          Declared: <span className="font-semibold">{s.declaredQuantity} {s.unit}</span>
                        </div>
                        <div
                          className={`font-semibold ${
                            s.meanQuantity < s.declaredQuantity ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          Mean: {s.meanQuantity} {s.unit} (σ = {s.standardDeviation})
                        </div>
                      </td>

                      <td className="px-4 py-3 text-xs">
                        <div>MAD Limit: <span className="font-semibold">{s.madLimit} {s.unit}</span></div>
                        <div className="text-slate-500">
                          T1: {s.t1Limit} {s.unit} ({s.t1Violations} err) | T2: {s.t2Limit} {s.unit} ({s.t2Violations} err)
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {s.result === 'PASS' && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Pass (Rule 24)
                          </span>
                        )}
                        {s.result === 'DEFICIENT_AVERAGE' && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            <TrendingDown className="w-3.5 h-3.5" />
                            Deficient Mean
                          </span>
                        )}
                        {s.result === 'CRITICAL_T2' && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Critical T2 Violation
                          </span>
                        )}
                        {s.seizureRecommended && (
                          <div className="text-xs text-rose-600 font-medium mt-1">
                            Seizure Recommended
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-xs text-slate-600">
                        <div>{s.inspectionLocation}</div>
                        <div className="text-slate-400">{s.inspectorName}</div>
                      </td>

                      <td className="px-4 py-3 text-right">
                        {s.panchnamaNumber ? (
                          <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-1 rounded">
                            {s.panchnamaNumber}
                          </span>
                        ) : s.seizureRecommended ? (
                          <span className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 px-2 py-1 rounded">
                            Flagged for Raid
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Certified Clean</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {samples.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                        No sampling tests found matching criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Interactive Schedule II Statistical Calculator */}
      {activeTab === 'CALCULATOR' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Scale className="w-5 h-5 text-teal-600" />
                Schedule II Maximum Allowable Deficiency (MAD) Test Laboratory
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Calculate legal metrology sampling statistics for 32 packaged goods samples. Validates against the
                Average Quantity System (AQS), individual $T_1$ limits ($Q_n - MAD$), and zero-tolerance $T_2$ limits ($Q_n - 2 \times MAD$).
              </p>
            </div>

            {calcFeedback && (
              <div
                className={`p-3 rounded-lg text-sm font-medium ${
                  calcFeedback.includes('Error')
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : 'bg-teal-50 text-teal-800 border border-teal-200'
                }`}
              >
                {calcFeedback}
              </div>
            )}

            <form onSubmit={handleRunStatisticalTest} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Commodity & Brand Name
                  </label>
                  <input
                    type="text"
                    value={calcCommodity}
                    onChange={(e) => setCalcCommodity(e.target.value)}
                    required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Declared Nominal Quantity ($Q_n$)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={calcDeclaredQty}
                      onChange={(e) => setCalcDeclaredQty(Number(e.target.value))}
                      required
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                    <select
                      value={calcUnit}
                      onChange={(e) => setCalcUnit(e.target.value)}
                      className="border border-slate-300 rounded-lg px-2 text-sm bg-white"
                    >
                      <option value="g">grams (g)</option>
                      <option value="kg">kg</option>
                      <option value="ml">ml</option>
                      <option value="L">Litres</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Declared MRP (₹) & Batch
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={calcMrp}
                      onChange={(e) => setCalcMrp(Number(e.target.value))}
                      placeholder="MRP"
                      className="w-24 border border-slate-300 rounded-lg px-2 py-2 text-sm"
                    />
                    <input
                      type="text"
                      value={calcBatch}
                      onChange={(e) => setCalcBatch(e.target.value)}
                      placeholder="Batch #"
                      className="w-full border border-slate-300 rounded-lg px-2 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Manufacturer / Importer Name
                  </label>
                  <input
                    type="text"
                    value={calcManufacturer}
                    onChange={(e) => setCalcManufacturer(e.target.value)}
                    required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Inspection Location / Mandi Yard
                  </label>
                  <input
                    type="text"
                    value={calcLocation}
                    onChange={(e) => setCalcLocation(e.target.value)}
                    required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Observed Weights Sample Array ($n=32$ comma-separated values in {calcUnit})
                  </label>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-500">Simulate:</span>
                    <button
                      type="button"
                      onClick={() => handleSimulateBatch('PASS')}
                      className="text-emerald-700 hover:underline bg-emerald-50 px-2 py-0.5 rounded"
                    >
                      Clean Batch
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSimulateBatch('DEFICIENT')}
                      className="text-amber-700 hover:underline bg-amber-50 px-2 py-0.5 rounded"
                    >
                      Short Mean
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSimulateBatch('CRITICAL')}
                      className="text-rose-700 hover:underline bg-rose-50 px-2 py-0.5 rounded"
                    >
                      Critical T2
                    </button>
                  </div>
                </div>
                <textarea
                  rows={3}
                  value={sampleWeightsText}
                  onChange={(e) => setSampleWeightsText(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="bg-teal-700 hover:bg-teal-600 text-white px-6 py-2 rounded-lg font-medium text-sm flex items-center gap-2 shadow transition"
                >
                  <Scale className="w-4 h-4" />
                  Evaluate & Log Statutory Sampling Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 3: Registrations Table */}
      {activeTab === 'REGISTRATIONS' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Registration Number</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Company Name</th>
                  <th className="px-4 py-3">Authorized Person</th>
                  <th className="px-4 py-3">Authorized Commodities</th>
                  <th className="px-4 py-3">Rule 27 Status</th>
                  <th className="px-4 py-3">Valid Until</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {registrations.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3 font-mono font-medium text-teal-800">
                      {r.registrationNumber}
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-800">
                        {r.applicantType}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {r.companyName}
                      <div className="text-xs text-slate-500 font-normal">{r.district}, {r.state}</div>
                    </td>

                    <td className="px-4 py-3 text-xs">
                      <div>{r.authorizedPerson}</div>
                      <div className="text-slate-400 font-mono">{r.phone}</div>
                    </td>

                    <td className="px-4 py-3 text-xs">
                      <div className="flex flex-wrap gap-1">
                        {r.commodities?.map((c: string, idx: number) => (
                          <span key={idx} className="bg-teal-50 text-teal-800 border border-teal-200 px-1.5 py-0.5 rounded">
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {r.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-xs text-slate-600 font-mono">
                      {new Date(r.validUntil).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Registration Modal */}
      {showRegModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-600" />
              New LMPC Registration (Form-I / Rule 27)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Apply for legal registration under the Legal Metrology (Packaged Commodities) Rules, 2011.
            </p>

            <form onSubmit={handleRegisterSubmit} className="space-y-3 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-700">Company Name</label>
                <input
                  type="text"
                  required
                  value={newReg.companyName}
                  onChange={(e) => setNewReg({ ...newReg, companyName: e.target.value })}
                  className="w-full border border-slate-300 rounded p-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700">Applicant Category</label>
                  <select
                    value={newReg.applicantType}
                    onChange={(e) => setNewReg({ ...newReg, applicantType: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-sm bg-white"
                  >
                    <option value="MANUFACTURER">Manufacturer</option>
                    <option value="PACKER">Packer</option>
                    <option value="IMPORTER">Importer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700">Authorized Person</label>
                  <input
                    type="text"
                    required
                    value={newReg.authorizedPerson}
                    onChange={(e) => setNewReg({ ...newReg, authorizedPerson: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700">PAN Number</label>
                  <input
                    type="text"
                    required
                    value={newReg.panNumber}
                    onChange={(e) => setNewReg({ ...newReg, panNumber: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-sm uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">GSTIN</label>
                  <input
                    type="text"
                    value={newReg.gstin}
                    onChange={(e) => setNewReg({ ...newReg, gstin: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-sm uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700">Email</label>
                  <input
                    type="email"
                    required
                    value={newReg.email}
                    onChange={(e) => setNewReg({ ...newReg, email: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700">Phone</label>
                  <input
                    type="text"
                    required
                    value={newReg.phone}
                    onChange={(e) => setNewReg({ ...newReg, phone: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Registered Office Address</label>
                <input
                  type="text"
                  required
                  value={newReg.registeredAddress}
                  onChange={(e) => setNewReg({ ...newReg, registeredAddress: e.target.value })}
                  className="w-full border border-slate-300 rounded p-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Commodities (comma separated)</label>
                <input
                  type="text"
                  placeholder="Edible Oils, Rice, Spices, Detergents"
                  required
                  value={newReg.commodities}
                  onChange={(e) => setNewReg({ ...newReg, commodities: e.target.value })}
                  className="w-full border border-slate-300 rounded p-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRegModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded text-sm text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded text-sm font-medium"
                >
                  Submit Form-I Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
