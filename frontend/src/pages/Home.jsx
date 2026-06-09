import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Zap, Brain, ShieldCheck, Home as HomeIcon, Filter, Shield, ArrowRight, Globe2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import IndiaMap from '../components/IndiaMap';
import { ASSEMBLIES, FEATURES, BRAND } from '../mock';

const ICONS = { Zap, Brain, ShieldCheck, Home: HomeIcon, Filter, Shield };

export default function HomePage() {
  const [assembly, setAssembly] = useState('ALL');
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (assembly !== 'ALL') params.set('assembly', assembly);
    if (query) params.set('q', query);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[#06060d] text-white selection:bg-blue-500/30">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* Ambient gradient blobs */}
        <div className="absolute top-10 left-1/4 w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />
        <div className="absolute top-32 right-1/4 w-[400px] h-[400px] rounded-full bg-fuchsia-600/15 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-amber-500/10 blur-[140px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-blue-500/30 bg-blue-500/5 text-blue-300 text-xs font-semibold tracking-[0.2em] uppercase">
            <Globe2 className="w-3.5 h-3.5" />
            {BRAND.poweredBy.toUpperCase()}
          </div>

          <h1 className="mt-8 text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05]">
            FIND ANY VOTER
            <br />
            <span className="text-white">IN SECONDS</span>
          </h1>

          <p className="mt-7 text-slate-300 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            Search through the historic 2002 registered voter lists in India quickly and accurately with our AI-powered platform. Fast, reliable, and user-friendly.
          </p>

          {/* Live coverage pill */}
          <div className="mt-10 inline-flex items-center gap-3 px-5 py-3 rounded-full border border-emerald-500/20 bg-emerald-500/[0.04]">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-emerald-300 text-sm font-semibold">Live Coverage:</span>
            <span className="text-slate-300 text-sm">Rayachoty Assembly (2002 Electoral Roll) — Parts 68, 69, 70, 71, 72, 73...</span>
            <button onClick={() => navigate('/directory')} className="text-blue-400 hover:text-blue-300 text-sm font-medium underline underline-offset-2">
              View Full Directory →
            </button>
          </div>

          {/* Search Bar */}
          <div className="mt-10 max-w-3xl mx-auto">
            <div className="flex flex-col md:flex-row gap-3 p-2 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
              <div className="relative md:w-64">
                <select
                  value={assembly}
                  onChange={(e) => setAssembly(e.target.value)}
                  className="w-full appearance-none bg-[#0d0d1a] border border-white/10 rounded-xl px-4 py-3 pr-9 text-sm text-white focus:outline-none focus:border-blue-500/50"
                >
                  {ASSEMBLIES.map(a => (
                    <option key={a.code} value={a.code}>
                      {a.flag ? '🌎 ' : ''}{a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1 relative">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search Name, EPIC No., or Address..."
                  className="w-full bg-[#0d0d1a] border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {['Fast Partition Searching', 'AI Phonetic Hash Matching', 'Zero Latency'].map(t => (
                <span key={t} className="px-4 py-1.5 rounded-full text-xs text-slate-300 bg-white/[0.04] border border-white/10">
                  {t}
                </span>
              ))}
            </div>

            <button
              onClick={handleSearch}
              className="mt-7 inline-flex items-center gap-2 px-9 py-3.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold tracking-wide transition-colors shadow-[0_0_30px_rgba(59,130,246,0.4)]"
            >
              SEARCH NOW
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="relative max-w-6xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => {
            const Icon = ICONS[f.icon];
            return (
              <div
                key={f.title}
                className="group p-7 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/15 hover:bg-white/[0.04] transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/20 to-fuchsia-500/20 border border-white/10 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <Icon className="w-5 h-5 text-blue-300" />
                </div>
                <h3 className="text-white font-semibold text-lg">{f.title}</h3>
                <p className="mt-2 text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* AI-POWERED SEARCH FOR INDIA */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="rounded-3xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
                AI-POWERED SEARCH
                <br />
                <span className="bg-gradient-to-r from-blue-400 to-fuchsia-400 bg-clip-text text-transparent">FOR INDIA</span>
              </h2>
              <p className="mt-5 text-slate-400 leading-relaxed">
                Search through millions of registered voters in India quickly and accurately with our AI-powered platform. Fast indexing and structured results built for scale.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4 max-w-sm">
                {[
                  { v: '4', l: 'Assemblies' },
                  { v: '4', l: 'States' },
                  { v: '5010+', l: 'Voter Records' },
                  { v: '12', l: 'Active Nodes' },
                ].map(s => (
                  <div key={s.l} className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="text-2xl font-bold text-white">{s.v}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <IndiaMap />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
