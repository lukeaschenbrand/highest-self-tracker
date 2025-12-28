-- Migration SQL to add missing columns to existing tasks table
-- Run this in your Supabase SQL Editor if you already have a tasks table

-- Add missing columns to tasks table
ALTER TABLE tasks 
  ADD COLUMN IF NOT EXISTS active_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7],
  ADD COLUMN IF NOT EXISTS weight INTEGER DEFAULT 1;

-- Update existing tasks to have default values if they're NULL
UPDATE tasks 
SET active_days = ARRAY[1,2,3,4,5,6,7] 
WHERE active_days IS NULL;

UPDATE tasks 
SET weight = 1 
WHERE weight IS NULL;

