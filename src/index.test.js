const request = require('supertest');
const app = require('./index');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'syndtrak-secret-change-in-prod';
const token = jwt.sign({ id: 1, username: 'admin', role: 'admin' }, JWT_SECRET);
const auth = { Authorization: `Bearer ${token}` };

test('GET /health returns ok', async () => {
  const res = await request(app).get('/health');
  expect(res.statusCode).toBe(200);
  expect(res.body.service).toBe('syndtrak-lender-api');
});

test('GET /api/lenders requires auth', async () => {
  const res = await request(app).get('/api/lenders');
  expect(res.statusCode).toBe(401);
});

test('GET /api/lenders returns list', async () => {
  const res = await request(app).get('/api/lenders').set(auth);
  expect(res.statusCode).toBe(200);
  expect(res.body.lenders.length).toBeGreaterThan(0);
});

test('GET /api/lenders/:id returns lender', async () => {
  const res = await request(app).get('/api/lenders/1').set(auth);
  expect(res.statusCode).toBe(200);
  expect(res.body.institution).toBe('JP Morgan Chase');
});

test('GET /api/lenders/:id 404 for unknown', async () => {
  const res = await request(app).get('/api/lenders/999').set(auth);
  expect(res.statusCode).toBe(404);
});
