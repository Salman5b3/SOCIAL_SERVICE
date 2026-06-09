import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, MapPin, User, Hash, ChevronDown, X, Filter, Loader2, FileText } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import OcrProgressBanner from '../components/OcrProgressBanner';
import { ALL_AP } from '../mock';
import { api } from '../lib/api';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const PAGE_SIZE = 24;
const AGE_RANGES = {
  ALL: [0, 200],
  '18-30': [18, 30],
  '31-50': [31, 50],
  '51-100': [51, 200],
};

function displayEnglishName(v) {
  // English transliteration — only show if proper OCR happened
  if (v.nameEn && v.nameEn.length > 1) return v.nameEn;
  return null;
}

function displayTeluguName(v) {
  // Prefer OCR'd Telugu (clean). Skip nameRaw because it has CID artifacts (?).
  if (v.nameTe && v.nameTe.length > 1) return v.nameTe;
  return null;
}

function displayRelName(v) {
  if (v.relationNameEn && v.relationNameEn.length > 1) return v.relationNameEn;
  if (v.relationNameTe && v.relationNameTe.length > 1) return v.relationNameTe;
  return null;
}

export default function SearchPage() {
  const navigate = useNavigate();
  const qp = useQuery();
  const [query, setQuery] = useState(qp.get('q') || '');
  const [assembly, setAssembly] = useState(qp.get('assembly') || 'ALL');
  const [partNo, setPartNo] = useState(qp.get('partNo') || '');
  const [gender, setGender] = useState('ALL');
  const [ageRange, setAgeRange] = useState('ALL');
  const [page, setPage] = useState(1);
  const [assemblies, setAssemblies] = useState([]);
  const [parts, setParts] = useState([]);

  const [data, setData] = useState({ total: 0, results: [], pages: 1 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.assemblies().then(setAssemblies).catch(() => setAssemblies([]));
  }, []);

  useEffect(() => {
    if (assembly && assembly !== 'ALL') {
      api.parts(assembly).then(setParts).catch(() => setParts([]));
    } else {
      setParts([]);
      setPartNo('');
    }
  }, [assembly]);

  const fetchPage = useCallback(async () => {
    setLoading(true);
    try {
      const [ageMin, ageMax] = AGE_RANGES[ageRange] || [0, 200];
      const params = { q: query, assembly, gender, ageMin, ageMax, page, pageSize: PAGE_SIZE };
      if (partNo) params.partNo = Number(partNo);
      const res = await api.search(params);
      setData(res);
    } catch (e) {
      setData({ total: 0, results: [], pages: 1 });
    } finally {
      setLoading(false);
    }
  }, [query, assembly, partNo, gender, ageRange, page]);

  useEffect(() => {
    setPage(1);
  }, [query, assembly, partNo, gender, ageRange]);

  useEffect(() => {
    const t = setTimeout(fetchPage, 250);
    return () => clearTimeout(t);
  }, [fetchPage]);

  // Auto-refresh every 30s so newly-OCR'd names appear without manual reload
  useEffect(() => {
    const id = setInterval(fetchPage, 30000);
    return () => clearInterval(id);
  }, [fetchPage]);

  const assemblyName = (code) => assemblies.find((a) => a.code === code)?.name || code;
  const openSourcePdf = (v) => window.open(api.sourcePdfUrl(v.assemblyCode, v.partNo), '_blank');

  return (
    <div className="min-h-screen bg-[#06060d] text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Home</span><span>/</span><span className="text-slate-200">Search</span>
        </div>
        <h1 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight">Voter Search</h1>
        <p className="mt-2 text-slate-400 text-sm">Search by name (English/Telugu), EPIC ID, house number or part. Click any record to view the source PDF.</p>

        <div className="mt-4">
          <OcrProgressBanner />
        </div>

        <div className="mt-6 flex flex-col lg:flex-row gap-3 p-2 rounded-2xl bg-white/[0.03] border border-white/10">
          <select value={assembly} onChange={(e) => setAssembly(e.target.value)} className="lg:w-60 appearance-none bg-[#0d0d1a] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50">
            <option value={ALL_AP.code}>{ALL_AP.name}</option>
            {assemblies.map((a) => <option key={a.code} value={a.code}>{a.name}</option>)}
          </select>
          <select
            value={partNo}
            onChange={(e) => setPartNo(e.target.value)}
            disabled={!assembly || assembly === 'ALL'}
            className="lg:w-40 appearance-none bg-[#0d0d1a] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 disabled:opacity-50"
          >
            <option value="">All Parts</option>
            {parts.map((p) => <option key={p.partNo} value={p.partNo}>Part {p.partNo}</option>)}
          </select>
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name (English/Telugu), EPIC ID, Door No..."
              className="w-full bg-[#0d0d1a] border border-white/10 rounded-xl pl-11 pr-10 py-3 text-sm focus:outline-none focus:border-blue-500/50"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400"><Filter className="w-3.5 h-3.5" /> Filters:</div>
          {[
            { label: 'Gender', val: gender, set: setGender, opts: [['ALL','All'],['Male','Male'],['Female','Female']] },
            { label: 'Age', val: ageRange, set: setAgeRange, opts: [['ALL','All'],['18-30','18-30'],['31-50','31-50'],['51-100','51+']] },
          ].map((f) => (
            <div key={f.label} className="relative">
              <select value={f.val} onChange={(e) => f.set(e.target.value)} className="appearance-none bg-white/[0.04] border border-white/10 rounded-full pl-4 pr-8 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50">
                {f.opts.map(([v, lab]) => <option key={v} value={v}>{f.label}: {lab}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
            </div>
          ))}
          <div className="ml-auto text-xs text-slate-400 flex items-center gap-2">
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />}
            <span className="text-white font-semibold">{data.total.toLocaleString('en-IN')}</span> records found
          </div>
        </div>

        <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.results.map((v) => {
            const en = displayEnglishName(v);
            const te = displayTeluguName(v);
            const relName = displayRelName(v);
            return (
            <button
              key={`${v.assemblyCode}-${v.partNo}-${v.serialNo}`}
              onClick={() => openSourcePdf(v)}
              className="text-left p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:border-blue-500/40 hover:bg-white/[0.05] transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-blue-500/30 to-fuchsia-500/30 border border-white/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-300" />
                  </div>
                  <div className="min-w-0">
                    {en ? (
                      <>
                        <div className="text-white font-semibold leading-tight truncate">{en}</div>
                        {te && (
                          <div className="text-sm text-slate-300 leading-tight truncate font-telugu" lang="te">{te}</div>
                        )}
                      </>
                    ) : te ? (
                      <div className="text-white font-semibold leading-tight truncate font-telugu" lang="te">{te}</div>
                    ) : (
                      <div className="text-slate-300 font-semibold leading-tight">
                        Voter #{v.serialNo}
                        {v.assemblyCode === '152' ? (
                          <span className="block text-[10px] text-amber-400/80 font-normal mt-0.5">Name pending OCR</span>
                        ) : (
                          <span className="block text-[10px] text-slate-500 font-normal mt-0.5">Name in source PDF</span>
                        )}
                      </div>
                    )}
                    <div className="text-xs text-slate-400 mt-1">{v.gender} · Age {v.age || '—'}</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-1 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 shrink-0">#{v.serialNo}</span>
              </div>
              <div className="mt-4 space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-slate-300"><Hash className="w-3 h-3 text-slate-500" /> EPIC: <span className="font-mono text-white">{v.epicId}</span></div>
                <div className="flex items-center gap-2 text-slate-300"><MapPin className="w-3 h-3 text-slate-500" /> Door No: <span className="text-white">{v.doorNo || '—'}</span></div>
                <div className="flex items-center gap-2 text-slate-300 truncate">
                  <User className="w-3 h-3 text-slate-500 shrink-0" /> {v.relation}:
                  <span className="text-slate-200 truncate">{relName || '—'}</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">{assemblyName(v.assemblyCode)}</span>
                <span className="text-emerald-400 inline-flex items-center gap-1"><FileText className="w-3 h-3" /> Part {v.partNo}</span>
              </div>
            </button>
            );
          })}
        </div>

        {!loading && data.results.length === 0 && (
          <div className="mt-12 text-center py-16 border border-dashed border-white/10 rounded-2xl">
            <SearchIcon className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="mt-4 text-slate-300 font-medium">No matching voters found</p>
            <p className="text-slate-500 text-sm mt-1">Try a different EPIC ID, door number or assembly.</p>
          </div>
        )}

        {data.pages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-4 py-2 rounded-lg text-sm border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] disabled:opacity-40 disabled:cursor-not-allowed">Prev</button>
            <span className="px-4 py-2 text-sm text-slate-300">Page {page} of {data.pages.toLocaleString('en-IN')}</span>
            <button onClick={() => setPage(Math.min(data.pages, page + 1))} disabled={page === data.pages} className="px-4 py-2 rounded-lg text-sm border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
