import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';

/**
 * Polls /api/stats every 30s. Shows Rayachoty OCR progress as a slim banner.
 * When 100% done, displays a green "OCR complete" state for a few seconds.
 */
export default function OcrProgressBanner({ onTick }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let active = true;
    const tick = async () => {
      try {
        const s = await api.stats();
        if (active) {
          setStats(s);
          if (onTick) onTick(s);
        }
      } catch (_) {
        /* ignore */
      }
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => { active = false; clearInterval(id); };
  }, [onTick]);

  if (!stats || !stats.rctTotal) return null;
  const pct = Math.min(100, (stats.rctOcrd / stats.rctTotal) * 100);
  const done = stats.rctOcrd >= stats.rctTotal;

  return (
    <div className={`flex flex-wrap items-center gap-3 px-4 py-2.5 rounded-xl border ${
      done ? 'border-emerald-500/30 bg-emerald-500/[0.04]' : 'border-blue-500/20 bg-blue-500/[0.04]'
    }`}>
      {done ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
      ) : (
        <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
      )}
      <span className="text-xs text-slate-300">
        {done ? (
          <>Rayachoty OCR complete — <span className="text-emerald-300 font-semibold">{stats.rctOcrd.toLocaleString('en-IN')}</span> names available.</>
        ) : (
          <>OCR'ing Rayachoty names in background — <span className="text-blue-300 font-semibold">{stats.rctOcrd.toLocaleString('en-IN')}</span> of <span className="text-slate-200">{stats.rctTotal.toLocaleString('en-IN')}</span> done.</>
        )}
      </span>
      <div className="flex-1 min-w-[140px] h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${done ? 'bg-emerald-500' : 'bg-blue-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono text-slate-400 tabular-nums">{pct.toFixed(1)}%</span>
    </div>
  );
}
