-- Existing tables (Do not run if already created, or ignore errors)

-- Game Settings Table
CREATE TABLE game_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

-- Enable RLS
ALTER TABLE game_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public Read Settings" ON game_settings FOR SELECT USING (true);
CREATE POLICY "Admin Update Settings" ON game_settings FOR UPDATE USING (true);
CREATE POLICY "Admin Insert Settings" ON game_settings FOR INSERT WITH CHECK (true);

-- Insert Default Setting (QR Enabled by default, or Disabled?)
-- User said "First half no scan", so maybe default false?
-- Let's default to true for now to not break existing flow, user can toggle it off.
INSERT INTO game_settings (key, value) VALUES ('qr_enabled', 'true'::jsonb) ON CONFLICT DO NOTHING;
