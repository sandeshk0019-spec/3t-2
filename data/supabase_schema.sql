-- Disable RLS to allow app data read & write access
ALTER TABLE farmers DISABLE ROW LEVEL SECURITY;
ALTER TABLE collections DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE branches DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;

-- Seed Initial Default Formula Settings
INSERT INTO settings (id, base_price, fat_factor, snf_factor)
VALUES (1, 28.0, 6.5, 2.0)
ON CONFLICT (id) DO NOTHING;
