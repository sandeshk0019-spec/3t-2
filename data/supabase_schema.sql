-- ====================================================================
-- 3T Dairy Ecosystem - Complete Supabase Schema & Access Migration
-- ====================================================================
-- Paste and execute this entire script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/iyvxwgsrwhosdomxrfko/sql
-- ====================================================================

-- 1. Ensure 'farmers' table exists with all required fields
CREATE TABLE IF NOT EXISTS public.farmers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  village TEXT,
  animals INT DEFAULT 5,
  avg_fat NUMERIC DEFAULT 4.2,
  avg_snf NUMERIC DEFAULT 8.5,
  monthly_earnings NUMERIC DEFAULT 0,
  branch_id TEXT DEFAULT 'B-01',
  aadhaar TEXT,
  bank_account TEXT,
  ifsc TEXT,
  upi_id TEXT,
  qr_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ensure 'collections' table exists with all required fields
CREATE TABLE IF NOT EXISTS public.collections (
  id TEXT PRIMARY KEY,
  farmer_id TEXT NOT NULL,
  farmer_name TEXT,
  village TEXT,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  weight NUMERIC NOT NULL,
  fat NUMERIC NOT NULL,
  snf NUMERIC NOT NULL,
  rate NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  status TEXT DEFAULT 'Success',
  branch_id TEXT DEFAULT 'B-01',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Ensure 'payments' table exists with timeline support
CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY,
  farmer_id TEXT NOT NULL,
  farmer_name TEXT,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'Success',
  timeline JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create missing 'branches' table for branch management & auxiliary cloud sync
CREATE TABLE IF NOT EXISTS public.branches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  manager TEXT,
  capacity NUMERIC DEFAULT 0,
  today_collection NUMERIC DEFAULT 0,
  payments NUMERIC DEFAULT 0,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create 'settings' table for live pricing formula configuration
CREATE TABLE IF NOT EXISTS public.settings (
  id INT PRIMARY KEY,
  base_price NUMERIC DEFAULT 28.0,
  fat_factor NUMERIC DEFAULT 6.5,
  snf_factor NUMERIC DEFAULT 2.0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Disable Row Level Security (RLS) on all tables for unrestricted app read/write
ALTER TABLE public.farmers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;

-- 7. Create open permissive policies in case RLS is ever re-enabled by Supabase
DO $$
BEGIN
  -- farmers
  DROP POLICY IF EXISTS "Allow all for farmers" ON public.farmers;
  CREATE POLICY "Allow all for farmers" ON public.farmers FOR ALL USING (true) WITH CHECK (true);

  -- collections
  DROP POLICY IF EXISTS "Allow all for collections" ON public.collections;
  CREATE POLICY "Allow all for collections" ON public.collections FOR ALL USING (true) WITH CHECK (true);

  -- payments
  DROP POLICY IF EXISTS "Allow all for payments" ON public.payments;
  CREATE POLICY "Allow all for payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);

  -- branches
  DROP POLICY IF EXISTS "Allow all for branches" ON public.branches;
  CREATE POLICY "Allow all for branches" ON public.branches FOR ALL USING (true) WITH CHECK (true);

  -- settings
  DROP POLICY IF EXISTS "Allow all for settings" ON public.settings;
  CREATE POLICY "Allow all for settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);
END $$;

-- 8. Seed default physical branches
INSERT INTO public.branches (id, name, manager, capacity, today_collection, payments, status)
VALUES
  ('B-01', 'Sangamner Main Center', 'Vikram Deshmukh', 5000, 3420, 154200, 'Active'),
  ('B-02', 'Akole Collection Hub', 'Suresh Thorat', 3500, 2180, 98100, 'Active'),
  ('B-03', 'Rahata Dairy Point', 'Pravin Shinde', 4000, 2890, 130050, 'Active')
ON CONFLICT (id) DO NOTHING;

-- 9. Seed default pricing formula
INSERT INTO public.settings (id, base_price, fat_factor, snf_factor)
VALUES (1, 28.0, 6.5, 2.0)
ON CONFLICT (id) DO NOTHING;
