import React, { useState, useEffect } from 'react';
import {
  Activity,
  Truck,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Unlock,
  RefreshCw,
  Search,
  Radio,
  Sliders,
  FileSpreadsheet,
  Cpu,
  ArrowDownRight,
  TrendingUp,
} from 'lucide-react';
import { api } from '../api';

export function WeighbridgeIoTDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [weighbridges, setWeighbridges] = useState<any[]>([]);
  const [selectedWb, setSelectedWb] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Simulation / Action state
  const [simVehicleNo, setSimVehicleNo] = useState('TS-07-UA-8812');
  const [simCommodity, setSimCommodity] = useState('Raw Paddy / Basmati Grain');
  const [simGross, setSimGross] = useState(38400);
  const [simTare, setSimTare] = useState(12200);
  const [simImbalance, setSimImbalance] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sRes, wbRes] = await Promise.all([
        api.telemetry.getStats(),
        api.telemetry.listWeighbridges({ search: searchTerm, category: selectedCategory }),
      ]);
      if (sRes.success && sRes.data) setStats(sRes.data);
      if (wbRes.success && wbRes.data && wbRes.data.length > 0) {
        const dataList = wbRes.data;
        setWeighbridges(dataList);
        if (!selectedWb) {
          setSelectedWb(dataList[0]);
          loadTransactions(dataList[0].weighbridgeId);
        } else {
          // Keep active selected wb updated
          const updated = dataList.find((w: any) => w.weighbridgeId === selectedWb.weighbridgeId);
          if (updated) setSelectedWb(updated);
        }
      }
    } catch (err) {
      console.error('Failed to load weighbridge telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async (wbId: string) => {
    try {
      const tRes = await api.telemetry.getTransactions(wbId);
      if (tRes.success) {
        setTransactions(tRes.data || []);
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCategory]);

  const handleSelectWeighbridge = (wb: any) => {
    setSelectedWb(wb);
    setActionFeedback(null);
    loadTransactions(wb.weighbridgeId);
  };

  const handleToggleLock = async (lockState: boolean) => {
    if (!selectedWb) return;
    try {
      const res = await api.telemetry.toggleLock(selectedWb.weighbridgeId, {
        lock: lockState,
        reason: lockState ? 'Manual Officer Lockdown for Tamper Inspection' : 'Officer Verified and Restored',
      });
      if (res.success) {
        setActionFeedback(`Weighbridge ${selectedWb.weighbridgeId} lock status updated to: ${lockState ? 'LOCKED' : 'UNLOCKED'}`);
        fetchData();
      }
    } catch (err: any) {
      setActionFeedback(`Error: ${err.message}`);
    }
  };

  const handleAdjustZero = async (offset: number) => {
    if (!selectedWb) return;
    try {
      const res = await api.telemetry.adjustZero(selectedWb.weighbridgeId, { offsetKg: offset });
      if (res.success) {
        setActionFeedback(`Zero offset adjusted to ${offset} kg.`);
        fetchData();
      }
    } catch (err: any) {
      setActionFeedback(`Error: ${err.message}`);
    }
  };

  const handleSimulateWeighment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWb) return;
    setActionFeedback(null);
    try {
      const net = simGross - simTare;
      // Normal voltages around 2.00 mV/V
      let loadCellVoltages = [2.01, 2.00, 2.02, 1.99];
      let tamperFlags: string[] = [];

      if (simImbalance) {
        loadCellVoltages = [2.65, 1.70, 1.62, 2.58]; // huge spread > 0.35 mV/V
        tamperFlags.push('LOADCELL_IMBALANCE_ALERT');
      }

      const res = await api.telemetry.logTransaction(selectedWb.weighbridgeId, {
        vehicleNumber: simVehicleNo,
        commodity: simCommodity,
        ewayBillNumber: `EWAY-TS-2026-${Math.floor(1000000 + Math.random() * 9000000)}`,
        grossWeightKg: simGross,
        tareWeightKg: simTare,
        netWeightKg: net,
        loadCellVoltagesMv: loadCellVoltages,
        weightStabilityAchieved: !simImbalance,
        tamperFlags,
        isAnomaly: simImbalance,
        anomalyReason: simImbalance ? 'Simulated load-cell voltage imbalance (>0.35 mV spread)' : undefined,
        slipNumber: `SLIP-${Math.floor(1000 + Math.random() * 9000)}`,
        operatorName: selectedWb.operatorName,
      });

      if (res.success) {
        setActionFeedback(`Transaction ${res.data.transactionId} logged successfully! Net: ${net} kg`);
        loadTransactions(selectedWb.weighbridgeId);
        fetchData();
      }
    } catch (err: any) {
      setActionFeedback(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6" id="telemetry-dashboard-root">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-cyan-950 to-blue-950 text-white p-6 rounded-xl shadow-lg border border-cyan-800/40">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-cyan-500/20 text-cyan-300 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-cyan-400/30 uppercase tracking-wide flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                Phase 11 IoT Telemetry Grid
              </span>
              <span className="text-slate-300 text-xs">Electronic Data Capture (EDC) & Smart Anti-Tamper Telemetry</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
              Industrial Heavy Weighbridge Telemetry & Real-Time Monitoring
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-3xl">
              Real-time telemetry stream from APMC mandis, highway toll plazas, mining pitheads, and cement plants.
              Continuous load-cell voltage distribution tracking, zero-drift detection, and remote statutory lockdown.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              disabled={loading}
              className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition"
              title="Refresh Telemetry Stream"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Top Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-cyan-900/60">
            <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-lg border border-white/10">
              <div className="text-xs font-medium text-cyan-300">Connected Weighbridges</div>
              <div className="text-2xl font-bold text-white mt-1">{stats.totalWeighbridges || 4}</div>
              <div className="text-xs text-slate-400 mt-0.5">
                {stats.onlineWeighbridges || 3} Active IoT Terminals
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-lg border border-white/10">
              <div className="text-xs font-medium text-amber-300">Tamper Alerts / Drift</div>
              <div className="text-2xl font-bold text-amber-300 mt-1">{stats.tamperAlerts || 1}</div>
              <div className="text-xs text-slate-400 mt-0.5">Voltage Imbalance Detected</div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-lg border border-white/10">
              <div className="text-xs font-medium text-rose-300">Remote Statutory Locks</div>
              <div className="text-2xl font-bold text-rose-400 mt-1">{stats.lockedWeighbridges || 1}</div>
              <div className="text-xs text-slate-400 mt-0.5">Commercial Operation Halted</div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm p-3.5 rounded-lg border border-white/10">
              <div className="text-xs font-medium text-emerald-300">Today's Transactions</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">{stats.totalTransactionsToday || 5}</div>
              <div className="text-xs text-slate-400 mt-0.5">Logged with e-Way Bill linkage</div>
            </div>
          </div>
        )}
      </div>

      {actionFeedback && (
        <div
          className={`p-3 rounded-lg text-sm font-medium ${
            actionFeedback.includes('Error')
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : 'bg-cyan-50 text-cyan-800 border border-cyan-200'
          }`}
        >
          {actionFeedback}
        </div>
      )}

      {/* Main Grid: Left List, Right Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Weighbridges List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Telemetry Terminals ({weighbridges.length})
            </h2>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs border border-slate-300 rounded px-2 py-1 bg-white"
            >
              <option value="ALL">All Categories</option>
              <option value="APMC_MANDI">APMC Mandi</option>
              <option value="HIGHWAY_TOLL">Highway Toll</option>
              <option value="MINING_PITHEAD">Mining Pithead</option>
              <option value="CEMENT_INDUSTRIAL">Industrial Plant</option>
            </select>
          </div>

          <div className="space-y-2.5">
            {weighbridges.map((wb) => {
              const isSelected = selectedWb?.weighbridgeId === wb.weighbridgeId;
              const isTamper = wb.status === 'TAMPER_ALERT' || wb.remoteLockActive;
              return (
                <div
                  key={wb._id}
                  onClick={() => handleSelectWeighbridge(wb)}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    isSelected
                      ? 'border-cyan-600 bg-cyan-50/50 shadow-sm ring-1 ring-cyan-500'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-900">{wb.weighbridgeId}</span>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        wb.remoteLockActive
                          ? 'bg-rose-100 text-rose-800'
                          : isTamper
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {wb.remoteLockActive ? 'LOCKED' : wb.status}
                    </span>
                  </div>

                  <div className="font-semibold text-sm text-slate-800 mt-1">{wb.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{wb.location}</div>

                  <div className="flex items-center justify-between text-xs text-slate-600 mt-3 pt-2 border-t border-slate-100 font-mono">
                    <span>Cap: {(wb.capacityKg / 1000).toFixed(0)}T (e={wb.divisionKg}kg)</span>
                    <span className={wb.currentZeroOffsetKg > 20 ? 'text-rose-600 font-bold' : ''}>
                      Zero: {wb.currentZeroOffsetKg > 0 ? `+${wb.currentZeroOffsetKg}` : wb.currentZeroOffsetKg} kg
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Weighbridge Telemetry Details */}
        {selectedWb && (
          <div className="lg:col-span-2 space-y-6">
            {/* Real-time Indicator Panel */}
            <div className="bg-slate-900 text-white rounded-xl p-6 shadow-md border border-slate-800">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">{selectedWb.name}</h2>
                    <span className="text-xs bg-slate-800 text-cyan-400 font-mono px-2 py-0.5 rounded">
                      {selectedWb.indicatorModel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Terminal IP: {selectedWb.ipAddress} • Firmware: {selectedWb.firmwareVersion} • Operator: {selectedWb.operatorName}
                  </p>
                </div>

                {/* Remote Lock / Unlock Switch */}
                <div className="flex items-center gap-2">
                  {selectedWb.remoteLockActive ? (
                    <button
                      onClick={() => handleToggleLock(false)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow transition"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      Restore / Unlock Weighbridge
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleLock(true)}
                      className="bg-rose-700 hover:bg-rose-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow transition"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Statutory Lock (Emergency)
                    </button>
                  )}
                </div>
              </div>

              {/* Digital LED Display Simulation */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                <div className="md:col-span-2 bg-black/60 rounded-xl p-5 border border-cyan-900/50 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                      OIML R76 Legal Metrology Indicator Stream
                    </span>
                    <span className="font-mono text-cyan-400">MPE: ±{selectedWb.maxPermissibleErrorKg} kg</span>
                  </div>

                  <div className="my-4 text-center">
                    <div className="font-mono text-4xl sm:text-5xl font-extrabold tracking-wider text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.4)]">
                      {selectedWb.remoteLockActive ? '--- LOCKED ---' : `${selectedWb.currentZeroOffsetKg.toFixed(1)} kg`}
                    </div>
                    <div className="text-xs text-slate-400 mt-1 font-mono">
                      Current Deadload Zero Tare | Load Stability: Achieved (STABLE)
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-800">
                    <span className="text-slate-400">Zero Recalibration:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleAdjustZero(0)}
                        className="bg-slate-800 hover:bg-slate-700 text-xs px-2 py-1 rounded text-cyan-300 font-mono"
                      >
                        Tare Zero (0 kg)
                      </button>
                      <button
                        onClick={() => handleAdjustZero(15)}
                        className="bg-slate-800 hover:bg-slate-700 text-xs px-2 py-1 rounded text-amber-300 font-mono"
                      >
                        +15 kg
                      </button>
                      <button
                        onClick={() => handleAdjustZero(35)}
                        className="bg-slate-800 hover:bg-slate-700 text-xs px-2 py-1 rounded text-rose-300 font-mono"
                      >
                        +35 kg (Trigger Alarm)
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4/6 Load Cell Voltage Distribution Array */}
                <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                      Load Cell Wheatstone Bridge (mV/V)
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {selectedWb.loadCellCount} Hermetically Sealed Canister Load Cells
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 my-3">
                    {Array.from({ length: selectedWb.loadCellCount || 4 }).map((_, idx) => {
                      const isImbalanced = selectedWb.status === 'TAMPER_ALERT';
                      const val = isImbalanced
                        ? idx === 0
                          ? '2.65'
                          : idx === 1
                          ? '1.70'
                          : idx === 2
                          ? '1.62'
                          : '2.58'
                        : (2.0 + idx * 0.01).toFixed(2);
                      return (
                        <div
                          key={idx}
                          className={`p-2 rounded text-center font-mono ${
                            isImbalanced
                              ? 'bg-rose-950/40 border border-rose-500/40 text-rose-300'
                              : 'bg-slate-900 border border-slate-700 text-cyan-300'
                          }`}
                        >
                          <div className="text-[10px] text-slate-400">LC #{idx + 1}</div>
                          <div className="text-sm font-bold">{val} mV/V</div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="text-[11px] text-slate-400 text-center font-mono">
                    Max Voltage Imbalance: {selectedWb.status === 'TAMPER_ALERT' ? '0.80 mV/V (ALERT)' : '0.04 mV/V (NORMAL)'}
                  </div>
                </div>
              </div>
            </div>

            {/* Test Vehicle Weighment Simulator */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
                <Truck className="w-4 h-4 text-cyan-700" />
                Live Vehicle Weighment Simulator (Electronic Data Capture)
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Simulate inbound laden or outbound unladen truck passing over the platform with synchronized e-Way Bill check.
              </p>

              <form onSubmit={handleSimulateWeighment} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Plate #</label>
                    <input
                      type="text"
                      required
                      value={simVehicleNo}
                      onChange={(e) => setSimVehicleNo(e.target.value)}
                      className="w-full border border-slate-300 rounded p-1.5 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Gross Laden Mass (kg)</label>
                    <input
                      type="number"
                      required
                      value={simGross}
                      onChange={(e) => setSimGross(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded p-1.5 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tare Unladen Mass (kg)</label>
                    <input
                      type="number"
                      required
                      value={simTare}
                      onChange={(e) => setSimTare(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded p-1.5 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Net Commodity Mass</label>
                    <div className="border border-slate-200 bg-slate-50 rounded p-1.5 text-xs font-mono font-bold text-slate-800">
                      {(simGross - simTare).toLocaleString()} kg
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={simImbalance}
                      onChange={(e) => setSimImbalance(e.target.checked)}
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className="font-semibold text-rose-700">
                      Simulate Tamper Imbalance (Fraudulent corner deflection / cheat device)
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={selectedWb.remoteLockActive}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 shadow transition ${
                      selectedWb.remoteLockActive
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : 'bg-cyan-800 hover:bg-cyan-700 text-white'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    Record Vehicle Weighment Slip
                  </button>
                </div>
              </form>
            </div>

            {/* Recent Weighbridge Transactions Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-700" />
                  Statutory Weighment Ledger ({transactions.length} Records)
                </h4>
                <span className="text-[11px] text-slate-500 font-mono">Synced with Central e-Way Registry</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 font-semibold text-slate-600 uppercase border-b border-slate-200 text-[11px]">
                    <tr>
                      <th className="px-4 py-2.5">Time / Slip #</th>
                      <th className="px-4 py-2.5">Vehicle #</th>
                      <th className="px-4 py-2.5">Commodity & e-Way Bill</th>
                      <th className="px-4 py-2.5">Gross / Tare / Net</th>
                      <th className="px-4 py-2.5">Stability / Tamper Check</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.map((tx) => (
                      <tr key={tx._id} className="hover:bg-slate-50/70 transition">
                        <td className="px-4 py-2.5 font-mono">
                          <div className="font-semibold text-slate-900">{tx.slipNumber}</div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(tx.timestamp).toLocaleTimeString()}
                          </div>
                        </td>

                        <td className="px-4 py-2.5 font-mono font-bold text-slate-800">{tx.vehicleNumber}</td>

                        <td className="px-4 py-2.5">
                          <div className="font-medium text-slate-800">{tx.commodity}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{tx.ewayBillNumber}</div>
                        </td>

                        <td className="px-4 py-2.5 font-mono">
                          <div>Gross: {tx.grossWeightKg} kg</div>
                          <div className="text-slate-500">Tare: {tx.tareWeightKg} kg</div>
                          <div className="font-bold text-cyan-900">Net: {tx.netWeightKg} kg</div>
                        </td>

                        <td className="px-4 py-2.5">
                          {tx.isAnomaly ? (
                            <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-semibold text-[11px] flex items-center gap-1 w-fit">
                              <AlertTriangle className="w-3 h-3" />
                              {tx.tamperFlags?.[0] || 'TAMPER ALERT'}
                            </span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-medium text-[11px] flex items-center gap-1 w-fit">
                              <ShieldCheck className="w-3 h-3" />
                              Verified Clean
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {transactions.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                          No transactions logged for this weighbridge yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
