-- ============================================================
-- Migration v3: Per-household tags (categories)
-- Run in Supabase SQL Editor
-- ============================================================

-- Add household_id to categories (NULL = global/default tag)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS household_id uuid REFERENCES households(id) ON DELETE CASCADE;

-- Drop the unique constraint on name so different households can have same tag names
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_key;

-- Add a unique constraint on (name, household_id) instead
-- Use COALESCE to handle NULL household_id (global tags)
CREATE UNIQUE INDEX IF NOT EXISTS categories_name_household_idx
  ON categories (name, COALESCE(household_id, '00000000-0000-0000-0000-000000000000'));

-- Update RLS: users can view global tags + their household's tags
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;

CREATE POLICY "View global and household categories"
  ON categories FOR SELECT USING (
    household_id IS NULL
    OR household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
  );

-- Users can insert tags for their household
CREATE POLICY "Insert household categories"
  ON categories FOR INSERT WITH CHECK (
    household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
  );

-- Users can delete their household's tags (not global ones)
CREATE POLICY "Delete household categories"
  ON categories FOR DELETE USING (
    household_id IS NOT NULL
    AND household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
  );

-- Confirm
SELECT id, name, household_id,
  CASE WHEN household_id IS NULL THEN 'global' ELSE 'household' END as scope
FROM categories ORDER BY sort_order;
