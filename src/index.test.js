jest.mock('./db', () => ({
  query: jest.fn(),
  on: jest.fn(),
}));

const pool = require('./db');
const request = require('supertest');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'syndtrak-secret-change-in-prod';
const token = jwt.sign({ id: 1, username: 'admin', role: 'admin' }, JWT_SECRET);
const auth = { Authorization: `Bearer ${token}` };

const MOCK_LENDERS = [{ id: 1, institution: 'JP Morgan Chase', type: 'Bulge Bracket', total_commitment: 1450, active_deals: 12, status: 'Active', region: 'Americas', rating: 'A+', contact: 'Sarah', email: 's@jpmc.com', phone: '+1', onboarded: '2019-01-15', address: 'NY', aum: 3800000, deals: ['DL-2024-001'], notes: 'Test' }];
const MOCK_DEALS = [{ id: 'DL-2024-001', name: 'Acme Term Loan B', borrower: 'Acme Corp', type: 'Term Loan B', size: 1200, currency: 'USD', status: 'Active', role: 'Bookrunner', closing_date: '2024-03-15', spread: 'SOFR+325', maturity: '2031-03-15', participants: 18, sector: 'Industrials' }];

beforeEach(() => { pool.query.mockReset(); });

test('GET /health returns ok when DB connected', async () => {
  pool.query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });
  const app = require('./index');
  const res = await request(app).get('/health');
  expect(res.statusCode).toBe(200);
  expect(res.body.service).toBe('syndtrak-lender-api');
});

test('GET /api/lenders requires auth', async () => {
  const app = require('./index');
  const res = await request(app).get('/api/lenders');
  expect(res.statusCode).toBe(401);
});

test('GET /api/lenders returns list from DB', async () => {
  pool.query.mockResolvedValueOnce({ rows: MOCK_LENDERS });
  const app = require('./index');
  const res = await request(app).get('/api/lenders').set(auth);
  expect(res.statusCode).toBe(200);
  expect(res.body.lenders[0].institution).toBe('JP Morgan Chase');
});

test('GET /api/deals returns list from DB', async () => {
  pool.query.mockResolvedValueOnce({ rows: MOCK_DEALS });
  const app = require('./index');
  const res = await request(app).get('/api/deals').set(auth);
  expect(res.statusCode).toBe(200);
  expect(res.body.deals[0].id).toBe('DL-2024-001');
});

test('GET /api/lenders/:id 404 for unknown', async () => {
  pool.query.mockResolvedValueOnce({ rows: [] });
  const app = require('./index');
  const res = await request(app).get('/api/lenders/999').set(auth);
  expect(res.statusCode).toBe(404);
});
