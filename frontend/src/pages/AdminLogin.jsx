import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Database, FileText, LogOut, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import { api } from '../lib/api';

const initial = { voters: 0, assemblies: 0, parts: 0, rayachotyTotal: 0, rayachotyNames: 0, rayachotyRelatives: 0 };

export default function AdminLogin() {
  const [token, setToken] = useState(() => localStorage.getItem('adminToken') || '');
  const [username, setUsername] = useState('admin@mrindia.org');
  const [password, setPassword] = useState('');
  const [overview, setOverview] = useState(initial);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async (value = token) => {
    if (!value) return;
    try { setOverview(await api.adminOverview(value)); }
    catch { setToken(''); localStorage.removeItem('adminToken'); }
  };

  useEffect(() => { load(); }, []);

  const login = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const result = await api.adminLogin({ username, password });
      localStorage.setItem('adminToken', result.token); setToken(result.token); await load(result.token);
    } catch (e) { setError(e.response?.data?.detail || 'Login failed'); }
    finally { setBusy(false); }
  };

  const restart = async () => {
    setBusy(true); setError('');
    try { await api.restartOcr(token); setTimeout(() => load(), 1500); }
    catch (e) { setError(e.response?.data?.detail || 'OCR restart failed'); }
    finally { setBusy(false); }
  };

  const logout = () => { localStorage.removeItem('adminToken'); setToken(''); setPassword(''); };
  const pct = overview.rayachotyTotal ? ((overview.rayachotyNames / overview.rayachotyTotal) * 100).toFixed(2) : '0.00';

  if (!token) return (
    <div className="min-h-screen bg-[#06060d] px-6 py-8 text-white">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-400"><ArrowLeft className="h-4 w-4" /> Home</Link>
      <form onSubmit={login} className="mx-auto mt-24 max-w-md space-y-5 rounded-2xl border border-white/10 bg-white/[0.03] p-8">
        <ShieldCheck className="mx-auto h-12 w-12 text-blue-400" /><h1 className="text-center text-2xl font-bold">Admin Portal</h1>
        <input value={username} onChange={e => setUsername(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0d0d1a] px-4 py-3" placeholder="Admin email" />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0d0d1a] px-4 py-3" placeholder="Password" />
        {error && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
        <button disabled={busy} className="w-full rounded-xl bg-blue-600 py-3 font-semibold disabled:opacity-50">{busy ? 'Signing in...' : 'Sign In'}</button>
      </form>
    </div>
  );

  const cards = [
    ['Total voters', overview.voters, Users], ['Assemblies', overview.assemblies, Database], ['Polling parts', overview.parts, FileText], ['Rayachoty OCR', pct + '%', RefreshCw]
  ];
  return (
    <div className="min-h-screen bg-[#06060d] px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between"><div><p className="text-sm text-blue-400">Administration</p><h1 className="text-3xl font-bold">Control Panel</h1></div><button onClick={logout} className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2"><LogOut className="h-4 w-4" /> Logout</button></div>
        <div className="mt-8 grid gap-4 md:grid-cols-4">{cards.map(([label,value,Icon]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><Icon className="h-5 w-5 text-blue-400"/><p className="mt-4 text-sm text-slate-400">{label}</p><p className="mt-1 text-2xl font-bold">{Number.isInteger(value) ? value.toLocaleString('en-IN') : value}</p></div>)}</div>
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-xl font-semibold">Rayachoty OCR Processing</h2><p className="mt-1 text-sm text-slate-400">Names: {overview.rayachotyNames.toLocaleString('en-IN')} / {overview.rayachotyTotal.toLocaleString('en-IN')} · Relative names: {overview.rayachotyRelatives.toLocaleString('en-IN')}</p></div><div className="flex gap-3"><button onClick={() => load()} className="rounded-xl border border-white/10 px-4 py-2">Refresh</button><button onClick={restart} disabled={busy} className="rounded-xl bg-blue-600 px-4 py-2 font-semibold disabled:opacity-50">Restart OCR</button></div></div>{error && <p className="mt-4 text-sm text-red-300">{error}</p>}</div>
      </div>
    </div>
  );
}
