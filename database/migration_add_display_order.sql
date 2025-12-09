-- Migration: Add display_order column to books table
-- Run this if you already have a books table without display_order

-- Add display_order column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'books' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE books ADD COLUMN display_order INTEGER DEFAULT 0;
    
    -- Update existing books with sequential order based on updated_at
    UPDATE books 
    SET display_order = subquery.row_number
    FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC) as row_number
      FROM books
    ) AS subquery
    WHERE books.id = subquery.id;
    
    -- Create index for better performance
    CREATE INDEX IF NOT EXISTS books_display_order_idx ON books(user_id, display_order);
  END IF;
END $$;

-- Update status constraint to include 'rereading' if needed
DO $$
BEGIN
  -- Check if constraint exists and needs updating
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'books_status_check'
  ) THEN
    -- Drop old constraint
    ALTER TABLE books DROP CONSTRAINT IF EXISTS books_status_check;
    -- Add new constraint with 'rereading'
    ALTER TABLE books ADD CONSTRAINT books_status_check 
      CHECK (status IN ('want-to-read', 'reading', 'read', 'rereading'));
  END IF;
END $$;

