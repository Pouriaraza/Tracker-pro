import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mjwaedvaeonvhdiqapmt.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qd2FlZHZhZW9udmhkaXFhcG10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDAxMzkxMiwiZXhwIjoyMDg1NTg5OTEyfQ.hvAuRLQOrE0a2Vr3FFVNP2QjG31iiyPiQ0eAIYJqK1Q'

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function setupDatabase() {
  console.log('Creating tables...')

  const sql = `
    -- Create projects table
    CREATE TABLE IF NOT EXISTS projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT now()
    );

    -- Create tracker_items table
    CREATE TABLE IF NOT EXISTS tracker_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      value INTEGER,
      created_at TIMESTAMP DEFAULT now()
    );

    -- Create permissions table
    CREATE TABLE IF NOT EXISTS permissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      permission TEXT CHECK (permission IN ('view', 'edit')),
      created_at TIMESTAMP DEFAULT now(),
      UNIQUE(project_id, user_id)
    );

    -- Enable RLS
    ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
    ALTER TABLE tracker_items ENABLE ROW LEVEL SECURITY;
    ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

    -- RLS Policies for projects
    CREATE POLICY "Users can see own projects" ON projects
      FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "Users can insert own projects" ON projects
      FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update own projects" ON projects
      FOR UPDATE USING (auth.uid() = user_id);

    -- RLS Policies for tracker_items
    CREATE POLICY "Users can see items in own projects" ON tracker_items
      FOR SELECT USING (
        project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
      );

    CREATE POLICY "Users can manage items in own projects" ON tracker_items
      FOR ALL USING (
        project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
      );

    -- RLS Policies for permissions
    CREATE POLICY "Users can see permissions for own projects" ON permissions
      FOR SELECT USING (
        project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
      );

    CREATE POLICY "Users can manage permissions for own projects" ON permissions
      FOR ALL USING (
        project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
      );
  `

  try {
    const { error } = await supabase.rpc('exec', { sql })
    if (error) {
      console.error('Error creating tables:', error)
    } else {
      console.log('✅ Tables created successfully!')
    }
  } catch (err) {
    console.error('Exception:', err.message)
    console.log('Note: Tables may already exist or RPC might not be available.')
    console.log('You can run the SQL manually in Supabase dashboard.')
  }
}

setupDatabase()
