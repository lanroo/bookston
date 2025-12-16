-- Migration: Add support for comment replies (threading)
-- Adds parent_comment_id to comments table for nested replies

-- Add parent_comment_id column to comments table
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS comments_parent_comment_id_idx ON comments(parent_comment_id);

-- Update RLS policies to allow viewing replies
-- (No changes needed, existing policies already cover this)

