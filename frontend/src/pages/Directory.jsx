import React, { useState, useMemo } from 'react';
import { FolderOpen, FileText, ChevronRight, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ASSEMBLIES, PARTS_BY_ASSEMBLY, getVotersForPart } from '../mock';

export default function DirectoryPage() {
  const [assembly, setAssembly] = useState('');
  const [part, setPart] = useState('');
  const [loaded, setLoaded] = useState(null); // { assembly, part, rows }
  const [loading, setLoading] = useState(false);

  const parts = useMemo(() => PARTS_BY_ASSEMBLY[assembly] || [], [assembly]);

  const load = () => {
    if (!assembly || !part) return;
    setLoading(true);
    setLoaded(null);
    setTimeout(() => {
      const rows = getVotersForPart(assembly, Number(part), 60);
      setLoaded({ assembly, part, rows });
      setLoading(false);
    }, 600);
  };

  const assemblyName = ASSEMBLIES.find(a => a.code === assembly)?.name || '';

  return (
    <div className="min-h-screen bg-[#06060d] text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 text-3xl md:text-4xl font-extrabold tracking-tight">
          <FolderOpen className="w-8 h-8 text-blue-400" />
          <h1>Voter Directory Explorer</h1>
        </div>
        <p className="mt-2 text-slate-400 text-sm">
          Browse raw data exactly as it appears in the PDF, strictly ordered by Door Number and Age.
        </p>

        {/* Selector */}
        <div className="mt-8 p-6 rounded-2xl bg-white/[0.03] border border-white/10">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Assembly Constituency No.</label>
              <select
                value={assembly}
                onChange={(e) => { setAssembly(e.target.value); setPart(''); setLoaded(null); }}
                className="mt-2 w-full appearance-none bg-[#0d0d1a] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50"
              >
                <option value="">Select Assembly...</option>
                {ASSEMBLIES.filter(a => a.code !== 'ALL').map(a => (
                  <option key={a.code} value={a.code}>{a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Part No.</label>
              <select
                value={part}
                onChange={(e) => setPart(e.target.value)}
                disabled={!assembly}
                className="mt-2 w-full appearance-none bg-[#0d0d1a] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 disabled:opacity-50"
              >
                <option value="">Select Part...</option>
                {parts.map(p => <option key={p} value={p}>Part {p}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={load}
                disabled={!assembly || !part || loading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                {loading ? 'Loading...' : 'Load Directory'}
              </button>
            </div>
          </div>
        </div>

        {/* Loaded Directory */}
        {loaded && (
          <div className="mt-10">
            <div className="flex items-center gap-2 text-slate-300 text-sm">
              <span>{assemblyName}</span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
              <span className="text-white font-semibold">Part {loaded.part}</span>
              <span className="ml-auto text-xs text-slate-400">{loaded.rows.length} records</span>
            </div>

            <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-slate-400 border-b border-white/10">
                    <th className="px-4 py-3">S.No</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">{`Relation`}</th>
                    <th className="px-4 py-3">Door No</th>
                    <th className="px-4 py-3">Age</th>
                    <th className="px-4 py-3">Gender</th>
                    <th className="px-4 py-3">EPIC ID</th>
                  </tr>
                </thead>
                <tbody>
                  {loaded.rows.map((v, i) => (
                    <tr key={v.id} className={`border-b border-white/5 hover:bg-white/[0.03] ${i % 2 === 0 ? 'bg-white/[0.01]' : ''}`}>
                      <td className="px-4 py-3 text-slate-400">{v.serialNo}</td>
                      <td className="px-4 py-3 text-white font-medium">{v.name}</td>
                      <td className="px-4 py-3 text-slate-300">{v.relation}: {v.relationName}</td>
                      <td className="px-4 py-3 text-slate-300">{v.doorNo}</td>
                      <td className="px-4 py-3 text-slate-300">{v.age}</td>
                      <td className="px-4 py-3 text-slate-300">{v.gender}</td>
                      <td className="px-4 py-3 font-mono text-xs text-blue-300">{v.epicId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loaded && !loading && (
          <div className="mt-10 text-center py-20 border border-dashed border-white/10 rounded-2xl">
            <FolderOpen className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="mt-4 text-slate-300">Select an assembly and part to load directory.</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
