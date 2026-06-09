import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ShieldCheck, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BRAND } from '../mock';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setError('Authentication backend not configured yet. Please contact the administrator.');
    }, 900);
  };

  return (
    <div className="min-h-screen bg-[#06060d] text-white relative overflow-hidden flex flex-col">
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-fuchsia-600/15 blur-[120px] pointer-events-none" />

      <div className="relative z-10 px-6 py-6">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/30 to-fuchsia-500/30 border border-white/10 items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-blue-300" />
            </div>
            <h1 className="mt-5 text-2xl font-bold tracking-tight">Admin Portal</h1>
            <p className="mt-2 text-sm text-slate-400">Secure access for {BRAND.fullName}</p>
          </div>

          <form onSubmit={submit} className="p-7 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-5">
            <div>
              <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Email / Admin ID</label>
              <div className="mt-2 relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@mrindia.org"
                  className="w-full bg-[#0d0d1a] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 placeholder:text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Password</label>
              <div className="mt-2 relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={show ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0d0d1a] border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:border-blue-500/50 placeholder:text-slate-600"
                />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                <input type="checkbox" className="accent-blue-500" /> Remember me
              </label>
              <a href="#" className="text-blue-400 hover:text-blue-300">Forgot password?</a>
            </div>

            {error && (
              <div className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2.5">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {loading ? 'Authenticating...' : 'Sign In Securely'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-6">
            Authorized personnel only. All login attempts are logged.
          </p>
        </div>
      </div>
    </div>
  );
}
