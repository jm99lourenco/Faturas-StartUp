-- ========================================================
-- REQIBO SYSTEM DATABASE SCHEMA UPDATE
-- ========================================================

-- 1. Extend the Profiles table with onboarding attributes
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS age INT DEFAULT 30;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS regime VARCHAR(30) DEFAULT 'independente' CHECK (regime IN ('independente', 'unipessoal'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cae VARCHAR(10) DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dependentes INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS estado_civil VARCHAR(20) DEFAULT 'solteiro';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trabalho_dependente BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rendimento_dependente_anual NUMERIC DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS regiao VARCHAR(20) DEFAULT 'continente';

-- 2. Create Clients Table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create Entities Table
CREATE TABLE IF NOT EXISTS entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  notes TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS) on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;

-- 5. Define Secure RLS Policies for multi-tenant isolation
-- CLIENTS POLICIES
CREATE POLICY "Users can view their own clients"
  ON clients FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert their own clients"
  ON clients FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update their own clients"
  ON clients FOR UPDATE
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own clients"
  ON clients FOR DELETE
  USING (auth.uid() = profile_id);

-- ENTITIES POLICIES
CREATE POLICY "Users can view their own entities"
  ON entities FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert their own entities"
  ON entities FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update their own entities"
  ON entities FOR UPDATE
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own entities"
  ON entities FOR DELETE
  USING (auth.uid() = profile_id);

-- ========================================================
-- SEED DATA & UTILITIES
-- ========================================================

-- Indexing for high-performance KPI aggregation queries
CREATE INDEX IF NOT EXISTS idx_clients_profile ON clients(profile_id);
CREATE INDEX IF NOT EXISTS idx_entities_profile ON entities(profile_id);
CREATE INDEX IF NOT EXISTS idx_invoices_profile ON invoices(profile_id);
