# Supabase Setup Instructions

## 1. Create a Supabase Project

1. Go to https://app.supabase.com
2. Sign up or log in
3. Click "New Project"
4. Fill in your project details and wait for it to be created

## 2. Get Your API Keys

1. Go to Project Settings (gear icon)
2. Go to "API" section
3. Copy your "Project URL" and "anon/public" key

## 3. Set Up Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## 4. Create Database Tables

Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor):

```sql
-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  category TEXT NOT NULL,
  pillar TEXT NOT NULL,
  frequency TEXT NOT NULL,
  allow_pass BOOLEAN DEFAULT false,
  active_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7],
  weight INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- If you already have a tasks table, run this to add missing columns:
ALTER TABLE tasks 
  ADD COLUMN IF NOT EXISTS active_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7],
  ADD COLUMN IF NOT EXISTS weight INTEGER DEFAULT 1;

-- Log entries table (daily task completions)
CREATE TABLE IF NOT EXISTS log_entries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  date TEXT NOT NULL,
  task_id TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, task_id)
);

-- Metric entries table (weight, sleep, energy, etc.)
CREATE TABLE IF NOT EXISTS metric_entries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  date TEXT NOT NULL UNIQUE,
  weight_lbs NUMERIC,
  sleep_hours NUMERIC,
  energy_1_10 INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project start date (singleton)
CREATE TABLE IF NOT EXISTS project_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) - Allow all operations for now
-- You can restrict this later based on your auth needs
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_settings ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (public read/write)
-- In production, you should restrict this based on your auth system
CREATE POLICY "Allow all operations on tasks" ON tasks
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on log_entries" ON log_entries
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on metric_entries" ON metric_entries
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on project_settings" ON project_settings
  FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_log_entries_date ON log_entries(date);
CREATE INDEX IF NOT EXISTS idx_log_entries_task_id ON log_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_metric_entries_date ON metric_entries(date);
```

## 5. Enable Realtime

1. Go to Database > Replication in your Supabase dashboard
2. Enable replication for:
   - `tasks`
   - `log_entries`
   - `metric_entries`
   - `project_settings`

## 6. Restart Your Dev Server

After setting up environment variables, restart your dev server:
```bash
npm run dev
```

## Notes

- The app will fall back to localStorage if Supabase is not configured
- Real-time updates will only work when Supabase is properly configured
- Make sure to keep your `.env` file secure and never commit it to git

