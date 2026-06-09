import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, MapPin, User, Hash, ChevronDown, X, Filter } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ASSEMBLIES, ALL_VOTERS } from '../mock';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function SearchPage() {
  const navigate = useNavigate();
  const qp = useQuery();
  const [query, setQuery] = useState(qp.get('q') || '');
  const [assembly, setAssembly] = useState(qp.get('assembly') || 'ALL');
  const [gender, setGender] = useState('ALL');
  const [ageRange, setAgeRange] = useState('ALL');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  useEffect(() => {
    setPage(1);
  }, [query, assembly, gender, ageRange]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_VOTERS.filter(v => {
      if (assembly !== 'ALL' && v.assemblyCode !== assembly) return false;
      if (gender !== 'ALL' && v.gender !== gender) return false;
      if (ageRange !== 'ALL') {
        const [lo, hi] = ageRange.split('-').map(Number);
        if (v.age < lo || v.age > hi) return false;
      }
      if (!q) return true;
      return (
        v.name.toLowerCase().includes(q) ||
        v.epicId.toLowerCase().includes(q) ||
        v.doorNo.toLowerCase().includes(q) ||
        v.relationName.toLowerCase().includes(q)
      );
    });
  }, [query, assembly, gender, ageRange]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-[#06060d] text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Home</span><span>/</span><span className="text-slate-200">Search</span>
        </div>
        <h1 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight">Voter Search</h1>
        <p className="mt-2 text-slate-400 text-sm">AI phonetic matching across name, EPIC ID, address &amp; door number.</p>

        {/* Search Bar */}
        <div className="mt-6 flex flex-col lg:flex-row gap-3 p-2 rounded-2xl bg-white/[0.03] border border-white/10">
          <select value={assembly} onChange={(e) => setAssembly(e.target.value)} className="lg:w-64 appearance-none bg-[#0d0d1a] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50">
            {ASSEMBLIES.map(a => <option key={a.code} value={a.code}>{a.name}</option>)}
          </select>
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search Name, EPIC No., or Address..." className="w-full bg-[#0d0d1a] border border-white/10 rounded-xl pl-11 pr-10 py-3 text-sm focus:outline-none focus:border-blue-500/50" />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400"><Filter className="w-3.5 h-3.5" /> Filters:</div>
          {[
            { label: 'Gender', val: gender, set: setGender, opts: [['ALL','All'],['Male','Male'],['Female','Female']] },
            { label: 'Age', val: ageRange, set: setAgeRange, opts: [['ALL','All'],['18-30','18-30'],['31-50','31-50'],['51-100','51+']] },
          ].map(f => (
            <div key={f.label} className="relative">
              <select value={f.val} onChange={(e) => f.set(e.target.value)} className="appearance-none bg-white/[0.04] border border-white/10 rounded-full pl-4 pr-8 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50">
                {f.opts.map(([v,lab]) => <option key={v} value={v}>{f.label}: {lab}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
            </div>
          ))}
          <div className="ml-auto text-xs text-slate-400">
            <span className="text-white font-semibold">{filtered.length}</span> records found
          </div>
        </div>

        {/* Results */}
        <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pageRows.map(v => (
            <div key={v.id} className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:border-blue-500/30 hover:bg-white/[0.05] transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/30 to-fuchsia-500/30 border border-white/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-300" />
                  </div>
                  <div>
                    <div className="text-white font-semibold leading-tight">{v.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{v.gender} · Age {v.age}</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-1 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">#{v.serialNo}</span>
              </div>
              <div className="mt-4 space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-slate-300"><Hash className="w-3 h-3 text-slate-500" /> EPIC: <span className="font-mono text-white">{v.epicId}</span></div>
                <div className="flex items-center gap-2 text-slate-300"><MapPin className="w-3 h-3 text-slate-500" /> Door No: <span className="text-white">{v.doorNo}</span></div>
                <div className="flex items-center gap-2 text-slate-300"><User className="w-3 h-3 text-slate-500" /> {v.relation}: <span className="text-white">{v.relationName}</span></div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">{v.assemblyName}</span>
                <span className="text-emerald-400">Part {v.partNo}</span>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="mt-12 text-center py-16 border border-dashed border-white/10 rounded-2xl">
            <SearchIcon className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="mt-4 text-slate-300 font-medium">No matching voters found</p>
            <p className="text-slate-500 text-sm mt-1">Try a different name, EPIC ID or assembly.</p>
          </div>
        )}

        {/* Pagination */}
        {filtered.length > PAGE_SIZE && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-4 py-2 rounded-lg text-sm border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] disabled:opacity-40 disabled:cursor-not-allowed">Prev</button>
            <span className="px-4 py-2 text-sm text-slate-300">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-4 py-2 rounded-lg text-sm border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
