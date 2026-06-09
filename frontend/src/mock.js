// Static branding + UI metadata - no longer voter data (now from API)

export const BRAND = {
  name: 'MR India',
  tagline: 'Social Service from MR India',
  fullName: 'Social Service from MR India',
  poweredBy: 'Powered by MR India Foundation',
  footerQuote: '"Empowering communities through technology. Serving the people, building the future."',
  externalSite: 'mrindia.org',
};

export const FEATURES = [
  { icon: 'Zap', title: 'Lightning-Fast Search', desc: 'Search hundreds of thousands of voter records instantly to speed up field research.' },
  { icon: 'Brain', title: 'Advanced AI Matching', desc: 'Smart phonetic-style matching across EPIC IDs, house numbers and relations.' },
  { icon: 'ShieldCheck', title: 'Accurate Voter Data', desc: 'Data extracted directly from official 2002 ECI Andhra Pradesh electoral rolls.' },
  { icon: 'Home', title: 'Door-to-Door Details', desc: 'Look up voters by house/door number for accurate door-to-door planning.' },
  { icon: 'Filter', title: 'Comprehensive Filters', desc: 'Filter by assembly, part, gender, age and EPIC prefix for precise results.' },
  { icon: 'Shield', title: 'Data Security', desc: 'Read-only access with secure, indexed storage and audit-ready architecture.' },
];

// All-of-AP option for selectors that prepend an "All" choice
export const ALL_AP = { code: 'ALL', name: 'All of Andhra Pradesh', flag: true };
