const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'syndtrak-secret-change-in-prod';
const PORT = process.env.PORT || 3001;

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json());

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

function authenticateToken(req, res, next) {
  const auth = req.headers['authorization'];
  const token = auth && auth.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token required' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

const LENDERS = [
  {
    id: 1,
    institution: 'JP Morgan Chase',
    type: 'Bulge Bracket',
    totalCommitment: 1450,
    activeDeals: 12,
    status: 'Active',
    region: 'Americas',
    rating: 'A+',
    contact: 'Sarah Mitchell',
    email: 's.mitchell@jpmc.com',
    phone: '+1 212 270 6000',
    onboarded: '2019-01-15',
    address: '383 Madison Avenue, New York, NY 10017',
    aum: 3800000,
    deals: ['DL-2024-001', 'DL-2024-002', 'DL-2024-004'],
    notes: 'Preferred bookrunner partner. Strong appetite for LBO financing.',
  },
  {
    id: 2,
    institution: 'Goldman Sachs',
    type: 'Bulge Bracket',
    totalCommitment: 1120,
    activeDeals: 9,
    status: 'Active',
    region: 'Americas',
    rating: 'A+',
    contact: 'David Park',
    email: 'd.park@gs.com',
    phone: '+1 212 902 1000',
    onboarded: '2019-03-22',
    address: '200 West Street, New York, NY 10282',
    aum: 2800000,
    deals: ['DL-2024-001', 'DL-2024-005'],
    notes: 'High-yield specialist. Active in leveraged finance.',
  },
  {
    id: 3,
    institution: 'BlackRock',
    type: 'Asset Manager',
    totalCommitment: 880,
    activeDeals: 15,
    status: 'Active',
    region: 'Americas',
    rating: 'AA-',
    contact: 'Lisa Chen',
    email: 'l.chen@blackrock.com',
    phone: '+1 212 810 5300',
    onboarded: '2020-06-10',
    address: '50 Hudson Yards, New York, NY 10001',
    aum: 10000000,
    deals: ['DL-2024-001', 'DL-2024-002', 'DL-2024-004', 'DL-2024-005'],
    notes: 'Largest asset manager globally. Conservative credit approach.',
  },
  {
    id: 4,
    institution: 'Barclays',
    type: 'European Bank',
    totalCommitment: 760,
    activeDeals: 11,
    status: 'Active',
    region: 'EMEA',
    rating: 'A',
    contact: 'James Whitfield',
    email: 'j.whitfield@barclays.com',
    phone: '+44 20 7116 1000',
    onboarded: '2019-09-05',
    address: '1 Churchill Place, London E14 5HP, UK',
    aum: 1500000,
    deals: ['DL-2024-001', 'DL-2024-003'],
    notes: 'Strong EMEA presence. Cross-border deal expertise.',
  },
  {
    id: 5,
    institution: 'PIMCO',
    type: 'Asset Manager',
    totalCommitment: 640,
    activeDeals: 8,
    status: 'Active',
    region: 'Americas',
    rating: 'AA',
    contact: 'Robert Torres',
    email: 'r.torres@pimco.com',
    phone: '+1 949 720 6000',
    onboarded: '2020-02-18',
    address: '650 Newport Center Drive, Newport Beach, CA 92660',
    aum: 1900000,
    deals: ['DL-2024-002', 'DL-2024-004'],
    notes: 'Fixed income focus. Active in investment-grade syndications.',
  },
  {
    id: 6,
    institution: 'Ares Management',
    type: 'Credit Fund',
    totalCommitment: 590,
    activeDeals: 6,
    status: 'Active',
    region: 'Americas',
    rating: 'BBB+',
    contact: 'Amanda Ross',
    email: 'a.ross@aresmgmt.com',
    phone: '+1 310 201 4100',
    onboarded: '2021-04-11',
    address: '2000 Avenue of the Stars, Los Angeles, CA 90067',
    aum: 450000,
    deals: ['DL-2024-001', 'DL-2024-004'],
    notes: 'Alternative credit specialist. High-yield and distressed focus.',
  },
  {
    id: 7,
    institution: 'Deutsche Bank',
    type: 'European Bank',
    totalCommitment: 520,
    activeDeals: 7,
    status: 'Active',
    region: 'EMEA',
    rating: 'A-',
    contact: 'Klaus Weber',
    email: 'k.weber@db.com',
    phone: '+49 69 910 00',
    onboarded: '2020-08-30',
    address: 'Taunusanlage 12, 60325 Frankfurt, Germany',
    aum: 1400000,
    deals: ['DL-2024-003', 'DL-2024-005'],
    notes: 'Strong in European leveraged finance. Energy sector expertise.',
  },
  {
    id: 8,
    institution: 'Mizuho Financial',
    type: 'Japanese Bank',
    totalCommitment: 430,
    activeDeals: 5,
    status: 'Active',
    region: 'APAC',
    rating: 'A',
    contact: 'Kenji Tanaka',
    email: 'k.tanaka@mizuho.com',
    phone: '+81 3 3596 1111',
    onboarded: '2021-01-20',
    address: '1-5-5 Otemachi, Chiyoda-ku, Tokyo 100-8176',
    aum: 1800000,
    deals: ['DL-2024-002'],
    notes: 'APAC gateway. Cross-currency deal capability.',
  },
  {
    id: 9,
    institution: 'Apollo Global',
    type: 'Credit Fund',
    totalCommitment: 380,
    activeDeals: 4,
    status: 'Active',
    region: 'Americas',
    rating: 'BBB',
    contact: 'Michael Ford',
    email: 'm.ford@apollo.com',
    phone: '+1 212 515 3200',
    onboarded: '2022-03-07',
    address: '9 West 57th Street, New York, NY 10019',
    aum: 600000,
    deals: ['DL-2024-001'],
    notes: 'Private credit leader. Flexible on covenants.',
  },
  {
    id: 10,
    institution: 'UBS Group',
    type: 'European Bank',
    totalCommitment: 310,
    activeDeals: 3,
    status: 'On Hold',
    region: 'EMEA',
    rating: 'A',
    contact: 'Sophie Laurent',
    email: 's.laurent@ubs.com',
    phone: '+41 44 234 1111',
    onboarded: '2021-11-14',
    address: 'Bahnhofstrasse 45, 8001 Zürich, Switzerland',
    aum: 1600000,
    deals: ['DL-2023-089'],
    notes: 'On hold pending internal credit review. Wealth management overlap.',
  },
];

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'syndtrak-lender-api', timestamp: new Date().toISOString() });
});

app.get('/api/lenders', authenticateToken, (req, res) => {
  const { region, type, status, search } = req.query;
  let result = LENDERS;
  if (region) result = result.filter(l => l.region === region);
  if (type) result = result.filter(l => l.type === type);
  if (status) result = result.filter(l => l.status === status);
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(l =>
      l.institution.toLowerCase().includes(q) ||
      l.contact.toLowerCase().includes(q) ||
      l.region.toLowerCase().includes(q)
    );
  }
  res.json({ lenders: result, total: result.length });
});

app.get('/api/lenders/:id', authenticateToken, (req, res) => {
  const lender = LENDERS.find(l => l.id === parseInt(req.params.id));
  if (!lender) return res.status(404).json({ error: 'Lender not found' });
  res.json(lender);
});

app.listen(PORT, () => console.log(`syndtrak-lender-api running on port ${PORT}`));
module.exports = app;
