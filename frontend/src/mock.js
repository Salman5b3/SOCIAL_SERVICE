// Mock data for Social Service from MR India - Voter Search Platform

export const ASSEMBLIES = [
  { code: 'ALL', name: 'All of Andhra Pradesh', flag: true },
  { code: '152', name: '152 - Rayachoty' },
  { code: '153', name: '153 - Lakkireddypalli' },
  { code: '154', name: '154 - Kadapa' },
  { code: '155', name: '155 - Pulivendula' },
  { code: '156', name: '156 - Kamalapuram' },
];

export const PARTS_BY_ASSEMBLY = {
  '152': [68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80],
  '153': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  '154': [15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25],
  '155': [30, 31, 32, 33, 34, 35],
  '156': [40, 41, 42, 43, 44, 45, 46, 47],
};

const FIRST_NAMES = [
  'Ramesh', 'Suresh', 'Lakshmi', 'Venkata', 'Krishna', 'Rajesh', 'Sita', 'Anjali',
  'Bharath', 'Chandra', 'Divya', 'Eshwar', 'Gopal', 'Hari', 'Indira', 'Jayanthi',
  'Kavitha', 'Madhavi', 'Naveen', 'Padma', 'Ravi', 'Saraswathi', 'Tilak', 'Uma',
  'Varun', 'Yamuna', 'Subramanyam', 'Bhargavi', 'Chaitanya', 'Deepika'
];

const LAST_NAMES = [
  'Reddy', 'Naidu', 'Rao', 'Sharma', 'Kumar', 'Devi', 'Goud', 'Chowdary',
  'Yadav', 'Prasad', 'Babu', 'Anjaneyulu', 'Pratap', 'Murthy', 'Bhaskar'
];

const RELATIONS = ['Father', 'Husband', 'Mother', 'Wife'];
const GENDERS = ['Male', 'Female'];

function seededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function genVoter(i, assemblyCode, partNo) {
  const r = (n) => seededRandom(i * 7 + n);
  const firstName = FIRST_NAMES[Math.floor(r(1) * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(r(2) * LAST_NAMES.length)];
  const relFirst = FIRST_NAMES[Math.floor(r(3) * FIRST_NAMES.length)];
  const age = 18 + Math.floor(r(4) * 65);
  const gender = GENDERS[Math.floor(r(5) * GENDERS.length)];
  const relation = RELATIONS[Math.floor(r(6) * RELATIONS.length)];
  const door = `${Math.floor(r(7) * 200) + 1}-${Math.floor(r(8) * 99) + 1}`;
  const epic = `APX${String(1000000 + i).slice(-7)}`;
  return {
    id: `${assemblyCode}-${partNo}-${i}`,
    serialNo: i,
    name: `${firstName} ${lastName}`,
    nameTelugu: `${firstName}`,
    relationName: `${relFirst} ${lastName}`,
    relation,
    age,
    gender,
    doorNo: door,
    epicId: epic,
    assemblyCode,
    assemblyName: ASSEMBLIES.find(a => a.code === assemblyCode)?.name || '',
    partNo,
    section: `Section ${Math.floor(r(9) * 5) + 1}`,
  };
}

export function getVotersForPart(assemblyCode, partNo, count = 60) {
  const list = [];
  for (let i = 1; i <= count; i++) {
    list.push(genVoter(i, assemblyCode, partNo));
  }
  return list;
}

// Pre-generated dataset for global search
export const ALL_VOTERS = (() => {
  const all = [];
  let idx = 1;
  Object.entries(PARTS_BY_ASSEMBLY).forEach(([asm, parts]) => {
    parts.slice(0, 3).forEach(p => {
      for (let i = 1; i <= 40; i++) {
        all.push(genVoter(idx++, asm, p));
      }
    });
  });
  return all;
})();

export const FEATURES = [
  {
    icon: 'Zap',
    title: 'Lightning-Fast Search',
    desc: 'Search millions of voter records instantly to speed up fast research.'
  },
  {
    icon: 'Brain',
    title: 'Advanced AI Matching',
    desc: 'Smart AI matching for registered voters in advanced phonetic algorithms.'
  },
  {
    icon: 'ShieldCheck',
    title: 'Accurate Voter Data',
    desc: 'Verified voter data, sourced and accurately matched in real-time updates.'
  },
  {
    icon: 'Home',
    title: 'Door-to-Door Details',
    desc: 'Search your data, door-to-door details for these field needs.'
  },
  {
    icon: 'Filter',
    title: 'Comprehensive Filters',
    desc: 'Search through filters and parts, comprehensive matching filters.'
  },
  {
    icon: 'Shield',
    title: 'Data Security',
    desc: 'Reconnaissance and data security and protection tools.'
  },
];

export const STATS = [
  { label: 'Assemblies', value: '5' },
  { label: 'Parts Indexed', value: '47' },
  { label: 'Voter Records', value: '5010+' },
  { label: 'Nodes', value: '4' },
];

export const BRAND = {
  name: 'MR India',
  tagline: 'Social Service from MR India',
  fullName: 'Social Service from MR India',
  poweredBy: 'Powered by MR India Foundation',
  footerQuote: '"Empowering communities through technology. Serving the people, building the future."',
  externalSite: 'mrindia.org',
};
