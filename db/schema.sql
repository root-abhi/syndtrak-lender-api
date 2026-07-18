CREATE TABLE IF NOT EXISTS lenders (
  id SERIAL PRIMARY KEY,
  institution VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  total_commitment INTEGER DEFAULT 0,
  active_deals INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'Active',
  region VARCHAR(100),
  rating VARCHAR(20),
  contact VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(100),
  onboarded DATE,
  address TEXT,
  aum BIGINT DEFAULT 0,
  deals TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deals (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  borrower VARCHAR(255),
  type VARCHAR(100),
  size INTEGER,
  currency VARCHAR(10) DEFAULT 'USD',
  status VARCHAR(50),
  role VARCHAR(100),
  closing_date DATE,
  spread VARCHAR(100),
  maturity DATE,
  participants INTEGER DEFAULT 0,
  sector VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  deal_id VARCHAR(50) REFERENCES deals(id),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  size VARCHAR(50),
  uploaded DATE,
  uploaded_by VARCHAR(100),
  status VARCHAR(50),
  restricted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS amendments (
  id VARCHAR(50) PRIMARY KEY,
  deal_id VARCHAR(50) REFERENCES deals(id),
  title VARCHAR(255) NOT NULL,
  status VARCHAR(50),
  deadline DATE,
  votes_for INTEGER DEFAULT 0,
  votes_against INTEGER DEFAULT 0,
  votes_abstain INTEGER DEFAULT 0,
  total_lenders INTEGER DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
