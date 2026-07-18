const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('./db');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'syndtrak-secret-change-in-prod';
const PORT = process.env.PORT || 3001;

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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

function auth(req, res, next) {
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token required' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', service: 'syndtrak-lender-api', db: 'connected', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'degraded', service: 'syndtrak-lender-api', db: 'disconnected' });
  }
});

// ── Lenders ──
app.get('/api/lenders', auth, async (req, res) => {
  try {
    const { region, type, status, search } = req.query;
    let q = 'SELECT * FROM lenders WHERE 1=1';
    const params = [];
    if (region)  { params.push(region);  q += ` AND region = $${params.length}`; }
    if (type)    { params.push(type);    q += ` AND type = $${params.length}`; }
    if (status)  { params.push(status);  q += ` AND status = $${params.length}`; }
    if (search)  { params.push(`%${search}%`); q += ` AND (institution ILIKE $${params.length} OR contact ILIKE $${params.length})`; }
    q += ' ORDER BY total_commitment DESC';
    const { rows } = await pool.query(q, params);
    res.json({ lenders: rows.map(toCamel), total: rows.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/lenders/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM lenders WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Lender not found' });
    res.json(toCamel(rows[0]));
  } catch (e) {
    res.status(500).json({ error: 'Database error' });
  }
});

// ── Deals ──
app.get('/api/deals', auth, async (req, res) => {
  try {
    const { status, search } = req.query;
    let q = 'SELECT * FROM deals WHERE 1=1';
    const params = [];
    if (status) { params.push(status); q += ` AND status = $${params.length}`; }
    if (search) { params.push(`%${search}%`); q += ` AND (name ILIKE $${params.length} OR borrower ILIKE $${params.length})`; }
    q += ' ORDER BY closing_date DESC';
    const { rows } = await pool.query(q, params);
    res.json({ deals: rows.map(toCamel), total: rows.length });
  } catch (e) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/deals/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM deals WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Deal not found' });
    res.json(toCamel(rows[0]));
  } catch (e) {
    res.status(500).json({ error: 'Database error' });
  }
});

// ── Documents ──
app.get('/api/documents', auth, async (req, res) => {
  try {
    const { deal_id, search } = req.query;
    let q = 'SELECT * FROM documents WHERE 1=1';
    const params = [];
    if (deal_id) { params.push(deal_id); q += ` AND deal_id = $${params.length}`; }
    if (search)  { params.push(`%${search}%`); q += ` AND name ILIKE $${params.length}`; }
    q += ' ORDER BY uploaded DESC';
    const { rows } = await pool.query(q, params);
    res.json({ documents: rows.map(toCamel), total: rows.length });
  } catch (e) {
    res.status(500).json({ error: 'Database error' });
  }
});

// ── Amendments ──
app.get('/api/amendments', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM amendments ORDER BY deadline DESC');
    res.json({ amendments: rows.map(toCamel), total: rows.length });
  } catch (e) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/api/amendments/:id/vote', auth, async (req, res) => {
  const { vote } = req.body;
  if (!['for', 'against', 'abstain'].includes(vote)) return res.status(400).json({ error: 'Invalid vote' });
  try {
    const col = vote === 'for' ? 'votes_for' : vote === 'against' ? 'votes_against' : 'votes_abstain';
    const { rows } = await pool.query(
      `UPDATE amendments SET ${col} = ${col} + 1 WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Amendment not found' });
    res.json(toCamel(rows[0]));
  } catch (e) {
    res.status(500).json({ error: 'Database error' });
  }
});

function toCamel(row) {
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    const camel = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out[camel] = v;
  }
  return out;
}

async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lenders (
        id SERIAL PRIMARY KEY, institution VARCHAR(255) NOT NULL, type VARCHAR(100),
        total_commitment INTEGER DEFAULT 0, active_deals INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Active', region VARCHAR(100), rating VARCHAR(20),
        contact VARCHAR(255), email VARCHAR(255), phone VARCHAR(100), onboarded DATE,
        address TEXT, aum BIGINT DEFAULT 0, deals TEXT[], notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS deals (
        id VARCHAR(50) PRIMARY KEY, name VARCHAR(255) NOT NULL, borrower VARCHAR(255),
        type VARCHAR(100), size INTEGER, currency VARCHAR(10) DEFAULT 'USD',
        status VARCHAR(50), role VARCHAR(100), closing_date DATE, spread VARCHAR(100),
        maturity DATE, participants INTEGER DEFAULT 0, sector VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY, deal_id VARCHAR(50) REFERENCES deals(id),
        name VARCHAR(255) NOT NULL, type VARCHAR(100), size VARCHAR(50),
        uploaded DATE, uploaded_by VARCHAR(100), status VARCHAR(50),
        restricted BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS amendments (
        id VARCHAR(50) PRIMARY KEY, deal_id VARCHAR(50) REFERENCES deals(id),
        title VARCHAR(255) NOT NULL, status VARCHAR(50), deadline DATE,
        votes_for INTEGER DEFAULT 0, votes_against INTEGER DEFAULT 0,
        votes_abstain INTEGER DEFAULT 0, total_lenders INTEGER DEFAULT 0,
        description TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Schema ready');

    const { rows } = await pool.query('SELECT COUNT(*) FROM lenders');
    if (parseInt(rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO lenders (institution,type,total_commitment,active_deals,status,region,rating,contact,email,phone,onboarded,address,aum,deals,notes) VALUES
        ('JP Morgan Chase','Bulge Bracket',1450,12,'Active','Americas','A+','Sarah Mitchell','s.mitchell@jpmc.com','+1 212 270 6000','2019-01-15','383 Madison Avenue, New York, NY 10017',3800000,ARRAY['DL-2024-001','DL-2024-002','DL-2024-004'],'Preferred bookrunner partner. Strong appetite for LBO financing.'),
        ('Goldman Sachs','Bulge Bracket',1120,9,'Active','Americas','A+','David Park','d.park@gs.com','+1 212 902 1000','2019-03-22','200 West Street, New York, NY 10282',2800000,ARRAY['DL-2024-001','DL-2024-005'],'High-yield specialist. Active in leveraged finance.'),
        ('BlackRock','Asset Manager',880,15,'Active','Americas','AA-','Lisa Chen','l.chen@blackrock.com','+1 212 810 5300','2020-06-10','50 Hudson Yards, New York, NY 10001',10000000,ARRAY['DL-2024-001','DL-2024-002','DL-2024-004','DL-2024-005'],'Largest asset manager globally. Conservative credit approach.'),
        ('Barclays','European Bank',760,11,'Active','EMEA','A','James Whitfield','j.whitfield@barclays.com','+44 20 7116 1000','2019-09-05','1 Churchill Place, London E14 5HP, UK',1500000,ARRAY['DL-2024-001','DL-2024-003'],'Strong EMEA presence. Cross-border deal expertise.'),
        ('PIMCO','Asset Manager',640,8,'Active','Americas','AA','Robert Torres','r.torres@pimco.com','+1 949 720 6000','2020-02-18','650 Newport Center Drive, Newport Beach, CA 92660',1900000,ARRAY['DL-2024-002','DL-2024-004'],'Fixed income focus. Active in investment-grade syndications.'),
        ('Ares Management','Credit Fund',590,6,'Active','Americas','BBB+','Amanda Ross','a.ross@aresmgmt.com','+1 310 201 4100','2021-04-11','2000 Avenue of the Stars, Los Angeles, CA 90067',450000,ARRAY['DL-2024-001','DL-2024-004'],'Alternative credit specialist. High-yield and distressed focus.'),
        ('Deutsche Bank','European Bank',520,7,'Active','EMEA','A-','Klaus Weber','k.weber@db.com','+49 69 910 00','2020-08-30','Taunusanlage 12, 60325 Frankfurt, Germany',1400000,ARRAY['DL-2024-003','DL-2024-005'],'Strong in European leveraged finance. Energy sector expertise.'),
        ('Mizuho Financial','Japanese Bank',430,5,'Active','APAC','A','Kenji Tanaka','k.tanaka@mizuho.com','+81 3 3596 1111','2021-01-20','1-5-5 Otemachi, Chiyoda-ku, Tokyo 100-8176',1800000,ARRAY['DL-2024-002'],'APAC gateway. Cross-currency deal capability.'),
        ('Apollo Global','Credit Fund',380,4,'Active','Americas','BBB','Michael Ford','m.ford@apollo.com','+1 212 515 3200','2022-03-07','9 West 57th Street, New York, NY 10019',600000,ARRAY['DL-2024-001'],'Private credit leader. Flexible on covenants.'),
        ('UBS Group','European Bank',310,3,'On Hold','EMEA','A','Sophie Laurent','s.laurent@ubs.com','+41 44 234 1111','2021-11-14','Bahnhofstrasse 45, 8001 Zurich, Switzerland',1600000,ARRAY['DL-2023-089'],'On hold pending internal credit review. Wealth management overlap.')
      `);
      await pool.query(`
        INSERT INTO deals (id,name,borrower,type,size,currency,status,role,closing_date,spread,maturity,participants,sector) VALUES
        ('DL-2024-001','Acme Corp Term Loan B','Acme Corporation','Term Loan B',1200,'USD','Active','Bookrunner','2024-03-15','SOFR + 325bps','2031-03-15',18,'Industrials'),
        ('DL-2024-002','TechGiant Inc Revolving Credit','TechGiant Inc.','Revolving Credit Facility',500,'USD','Active','Lead Left','2024-02-28','SOFR + 175bps','2029-02-28',12,'Technology'),
        ('DL-2024-003','GlobalEnergy Bridge Loan','GlobalEnergy Partners','Bridge Loan',750,'USD','Syndication','Arranger','2024-04-10','SOFR + 450bps','2025-10-10',7,'Energy'),
        ('DL-2023-089','MetroBank Sub Debt','MetroBank NA','Subordinated Debt',300,'USD','Closed','Participant','2023-11-20','SOFR + 280bps','2030-11-20',9,'Financial Services'),
        ('DL-2024-004','RetailCo LBO Financing','RetailCo Holdings','LBO Financing',2100,'USD','Active','Bookrunner','2024-01-31','SOFR + 400bps','2031-01-31',24,'Consumer Retail'),
        ('DL-2024-005','MedGroup Acquisition Finance','MedGroup International','Acquisition Finance',850,'USD','Pending','Lead Left','2024-05-01','SOFR + 350bps','2031-05-01',0,'Healthcare')
      `);
      await pool.query(`
        INSERT INTO documents (deal_id,name,type,size,uploaded,uploaded_by,status,restricted) VALUES
        ('DL-2024-001','Credit Agreement - Execution Version','Credit Agreement','2.4 MB','2024-03-14','S. Mitchell','Final',false),
        ('DL-2024-001','Term Sheet v3 - Final','Term Sheet','380 KB','2024-02-20','D. Park','Final',false),
        ('DL-2024-001','Confidential Information Memorandum','CIM','8.1 MB','2024-02-01','S. Mitchell','Final',true),
        ('DL-2024-001','Lender Presentation - February 2024','Presentation','5.6 MB','2024-02-05','Admin','Final',false),
        ('DL-2024-001','Financial Model - Q4 2023 Actuals','Financial Model','1.9 MB','2024-02-10','D. Park','Final',true),
        ('DL-2024-001','Environmental & Social Report','Due Diligence','3.2 MB','2024-02-25','Admin','Final',false),
        ('DL-2024-001','Amendment No. 1 - Draft','Amendment','420 KB','2024-03-20','S. Mitchell','Draft',false)
      `);
      await pool.query(`
        INSERT INTO amendments (id,deal_id,title,status,deadline,votes_for,votes_against,votes_abstain,total_lenders,description) VALUES
        ('AMD-001','DL-2024-001','Amendment No. 1 — EBITDA Definition Update','Voting Open','2024-04-05',14,1,0,18,'Amends the definition of Consolidated EBITDA to include pro forma adjustments for acquisitions completed in the prior 12 months.'),
        ('AMD-002','DL-2024-002','Amendment No. 1 — Extension of Maturity','Approved','2024-01-15',12,0,0,12,'Extends the maturity date of the Revolving Credit Facility by 12 months to February 28, 2030.')
      `);
      console.log('Seed data inserted');
    }
  } catch (e) {
    console.error('DB init error:', e.message);
  }
}

app.listen(PORT, async () => {
  console.log(`syndtrak-lender-api running on port ${PORT}`);
  await initDB();
});
module.exports = app;
