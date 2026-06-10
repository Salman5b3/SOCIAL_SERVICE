import React from 'react';
import { BRAND } from '../mock';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#070710] pt-16 pb-10">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h3 className="text-white text-xl font-semibold">{BRAND.poweredBy}</h3>
        <p className="text-slate-400 italic mt-3 text-sm">{BRAND.footerQuote}</p>

        <div className="mt-12 border border-white/5 bg-white/[0.02] rounded-xl p-5 text-left max-w-3xl mx-auto">
          <p className="text-slate-400 text-xs leading-relaxed">
            <span className="text-slate-200 font-semibold">Legal Disclaimer:</span>{' '}
            MR India is an independent analytics and search platform. All voter data indexed on this platform is extracted via Artificial Intelligence (OCR) from publicly available electoral rolls originally published by the government.{' '}
            <span className="text-slate-200 font-semibold">
              MR India is NOT affiliated with, endorsed by, or operated by the Election Commission of India.
            </span>{' '}
            We do not guarantee the 100% accuracy of AI-extracted records. Users must verify all official information directly at{' '}
            <a className="text-blue-400 underline" href="https://voters.eci.gov.in" target="_blank" rel="noreferrer">voters.eci.gov.in</a>.
          </p>
          <div className="flex gap-6 mt-4 justify-center text-xs">
            <a className="text-slate-300 hover:text-white underline underline-offset-2" href="#">Terms of Service</a>
            <a className="text-slate-300 hover:text-white underline underline-offset-2" href="#">Privacy Policy</a>
          </div>
        </div>

        <p className="text-slate-600 text-xs mt-8">© {new Date().getFullYear()} {BRAND.fullName}. All rights reserved.</p>
      </div>
    </footer>
  );
}
