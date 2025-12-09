
ALTER TABLE books 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Step 2: Update existing books with sequential order
UPDATE books 
SET display_order = subquery.row_number - 1
FROM (
  SELECT 
    id, 
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC) as row_number
  FROM books
) AS subquery
WHERE books.id = subquery.id;

-- Step 3: Create index for better performance
CREATE INDEX IF NOT EXISTS books_display_order_idx 
ON books(user_id, display_order);

-- Step 4: Update status constraint to include 'rereading'
-- First, drop the old constraint if it exists
ALTER TABLE books 
DROP CONSTRAINT IF EXISTS books_status_check;

-- Then add the new constraint with 'rereading'
ALTER TABLE books 
ADD CONSTRAINT books_status_check 
CHECK (status IN ('want-to-read', 'reading', 'read', 'rereading'));

-- Verify the migration
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns
WHERE table_name = 'books' 
  AND column_name = 'display_order';

