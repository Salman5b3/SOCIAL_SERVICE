import React, { useState, useEffect, useMemo } from 'react';
import { FolderOpen, FileText, ChevronRight, Loader2, ExternalLink } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { api } from '../lib/api';

const PAGE_SIZE = 50;

export default function DirectoryPage() {
  const [assemblies, setAssemblies] = useState([]);
  const [parts, setParts] = useState([]);
  const [assembly, setAssembly] = useState('');
  const [part, setPart] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.assemblies().then(setAssemblies).catch(() => setAssemblies([]));
  }, []);

  useEffect(() => {
    if (!assembly) { setParts([]); return; }
    api.parts(assembly).then(setParts).catch(() => setParts([]));
  }, [assembly]);

  const assemblyName = useMemo(
    () => assemblies.find((a) => a.code === assembly)?.name || '',
    [assemblies, assembly]
  );

  const load = async (goToPage = 1) => {
    if (!assembly || !part) return;
    setLoading(true);
    setData(null);
    setPage(goToPage);
    try {
      const res = await api.directory({ assembly, partNo: Number(part), page: goToPage, pageSize: PAGE_SIZE });
      setData(res);
    } catch (e) {
      setData({ total: 0, results: [], pages: 1 });
    } finally {
      setLoading(false);
    }
  };

  const openPdf = () => {
    if (assembly && part) {
      window.open(api.sourcePdfUrl(assembly, Number(part)), '_blank');
    }
  };

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

        <div className="mt-8 p-6 rounded-2xl bg-white/[0.03] border border-white/10">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Assembly Constituency No.</label>
              <select
                value={assembly}
                onChange={(e) => { setAssembly(e.target.value); setPart(''); setData(null); }}
                className="mt-2 w-full appearance-none bg-[#0d0d1a] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50"
              >
                <option value="">Select Assembly...</option>
                {assemblies.map((a) => <option key={a.code} value={a.code}>{a.name}</option>)}
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
                {parts.map((p) => <option key={p.partNo} value={p.partNo}>Part {p.partNo} ({p.voterCount} voters)</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => load(1)}
                disabled={!assembly || !part || loading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                {loading ? 'Loading...' : 'Load Directory'}
              </button>
            </div>
          </div>
        </div>

        {data && (
          <div className="mt-10">
            <div className="flex flex-wrap items-center gap-2 text-slate-300 text-sm">
              <span>{assemblyName}</span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
              <span className="text-white font-semibold">Part {part}</span>
              <span className="ml-auto text-xs text-slate-400">{data.total.toLocaleString('en-IN')} records</span>
              <button onClick={openPdf} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border border-blue-500/30 text-blue-300 hover:bg-blue-500/10 transition-colors">
                <ExternalLink className="w-3 h-3" /> View Source PDF
              </button>
            </div>

            <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-slate-400 border-b border-white/10">
                    <th className="px-4 py-3">S.No</th>
                    <th className="px-4 py-3">Name (English)</th>
                    <th className="px-4 py-3">Name (Telugu)</th>
                    <th className="px-4 py-3">Door No</th>
                    <th className="px-4 py-3">Relation</th>
                    <th className="px-4 py-3">Age</th>
                    <th className="px-4 py-3">Gender</th>
                    <th className="px-4 py-3">EPIC ID</th>
                  </tr>
                </thead>
                <tbody>
                  {data.results.map((v, i) => {
                    const en = v.nameEn || '';
                    const te = v.nameTe || '';
                    const relEn = v.relationNameEn || '';
                    const relTe = v.relationNameTe || '';
                    return (
                    <tr key={`${v.assemblyCode}-${v.partNo}-${v.serialNo}`} className={`border-b border-white/5 hover:bg-white/[0.03] ${i % 2 === 0 ? 'bg-white/[0.01]' : ''}`}>
                      <td className="px-4 py-3 text-slate-400">{v.serialNo}</td>
                      <td className="px-4 py-3 text-white max-w-[220px] truncate" title={en}>
                        {en || <span className="text-amber-400/70 text-xs italic">pending OCR</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-300 max-w-[220px] truncate font-telugu" lang="te" title={te}>
                        {te || <span className="text-slate-600 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{v.doorNo || '—'}</td>
                      <td className="px-4 py-3 text-slate-300 max-w-[200px] truncate" title={`${v.relation}${relEn ? ': ' + relEn : ''}`}>
                        {v.relation}{relEn ? `: ${relEn}` : (relTe ? <span className="font-telugu" lang="te">: {relTe}</span> : '')}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{v.age || '—'}</td>
                      <td className="px-4 py-3 text-slate-300">{v.gender}</td>
                      <td className="px-4 py-3 font-mono text-xs text-blue-300">{v.epicId}</td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {data.pages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button onClick={() => load(Math.max(1, page - 1))} disabled={page === 1 || loading} className="px-4 py-2 rounded-lg text-sm border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] disabled:opacity-40 disabled:cursor-not-allowed">Prev</button>
                <span className="px-4 py-2 text-sm text-slate-300">Page {page} of {data.pages}</span>
                <button onClick={() => load(Math.min(data.pages, page + 1))} disabled={page === data.pages || loading} className="px-4 py-2 rounded-lg text-sm border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
              </div>
            )}
          </div>
        )}

        {!data && !loading && (
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
