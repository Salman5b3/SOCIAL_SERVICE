import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Vote, Menu, X } from 'lucide-react';
import { BRAND } from '../mock';

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/search', label: 'Search' },
  { to: '/directory', label: 'Directory' },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a14]/80 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500/20 to-fuchsia-500/20 border border-white/10 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Vote className="w-5 h-5 text-blue-400" />
          </div>
          <span className="text-white font-semibold tracking-tight text-[15px]">{BRAND.fullName}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                pathname === item.to
                  ? 'text-white bg-white/5'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center">
          <Link
            to="/admin"
            className="px-5 py-2 rounded-full text-sm text-white border border-white/15 hover:border-white/40 hover:bg-white/5 transition-colors"
          >
            Admin Login
          </Link>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-white p-2"
          aria-label="toggle menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/5 bg-[#0a0a14] px-6 py-4 space-y-1">
          {NAV.map(item => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={`block px-3 py-2 rounded text-sm ${
                pathname === item.to ? 'text-white bg-white/5' : 'text-slate-300'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link
            to="/admin"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 rounded text-sm text-white border border-white/15 mt-2 text-center"
          >
            Admin Login
          </Link>
        </div>
      )}
    </header>
  );
}
