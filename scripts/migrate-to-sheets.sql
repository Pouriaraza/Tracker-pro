-- Drop old tables
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS tracker_items;
DROP TABLE IF EXISTS projects;

-- Create sheets table
CREATE TABLE sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create sheet_columns table
CREATE TABLE sheet_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id UUID NOT NULL REFERENCES sheets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);

-- Create sheet_rows table
CREATE TABLE sheet_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id UUID NOT NULL REFERENCES sheets(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Enable RLS
ALTER TABLE sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE sheet_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE sheet_rows ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can see own sheets" ON sheets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sheets" ON sheets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sheets" ON sheets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sheets" ON sheets
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can see columns in own sheets" ON sheet_columns
  FOR SELECT USING (
    sheet_id IN (SELECT id FROM sheets WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage columns in own sheets" ON sheet_columns
  FOR ALL USING (
    sheet_id IN (SELECT id FROM sheets WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can see rows in own sheets" ON sheet_rows
  FOR SELECT USING (
    sheet_id IN (SELECT id FROM sheets WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage rows in own sheets" ON sheet_rows
  FOR ALL USING (
    sheet_id IN (SELECT id FROM sheets WHERE user_id = auth.uid())
  );
