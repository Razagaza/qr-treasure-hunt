-- Groups Table
CREATE TABLE groups (
  id TEXT PRIMARY KEY, -- 'A', 'B', 'C', 'D'
  score INTEGER DEFAULT 0,
  data JSONB DEFAULT '{"foundTreasures": []}'::jsonb
);

-- Treasures Table
CREATE TABLE treasures (
  id INTEGER PRIMARY KEY, -- 0 to 29
  content JSONB NOT NULL -- Stores full treasure object
);

-- QR Codes Table
CREATE TABLE qr_codes (
  code TEXT PRIMARY KEY,
  treasure_id INTEGER REFERENCES treasures(id)
);

-- Enable Row Level Security (RLS) - Optional but good practice
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasures ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

-- Create Policies (Public Read/Write for simplicity in this hackathon context)
-- In production, you'd want tighter controls, but for this app:
CREATE POLICY "Public Read Groups" ON groups FOR SELECT USING (true);
CREATE POLICY "Public Update Groups" ON groups FOR UPDATE USING (true);
CREATE POLICY "Public Insert Groups" ON groups FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Read Treasures" ON treasures FOR SELECT USING (true);
CREATE POLICY "Public Insert Treasures" ON treasures FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Treasures" ON treasures FOR UPDATE USING (true);

CREATE POLICY "Public Read QR" ON qr_codes FOR SELECT USING (true);
CREATE POLICY "Public Insert QR" ON qr_codes FOR INSERT WITH CHECK (true);
