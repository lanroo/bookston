-- Migration: Social Features (Posts, Comments, Likes, Points)
-- Creates tables for social network functionality

-- ============================================
-- 1. POSTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id TEXT NOT NULL,
  book_title TEXT NOT NULL,
  book_author TEXT NOT NULL,
  book_cover_url TEXT,
  book_status TEXT NOT NULL CHECK (book_status IN ('want-to-read', 'reading', 'read', 'rereading')),
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 0 AND rating <= 5),
  has_spoiler BOOLEAN DEFAULT false,
  reading_progress INTEGER CHECK (reading_progress >= 0 AND reading_progress <= 100),
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- 2. POST LIKES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(post_id, user_id)
);

-- ============================================
-- 3. COMMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- 4. COMMENT LIKES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(comment_id, user_id)
);

-- ============================================
-- 5. USER POINTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_points (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  points_from_posts INTEGER DEFAULT 0,
  points_from_likes INTEGER DEFAULT 0,
  points_from_comments INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- 6. POINTS TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS points_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('post_created', 'post_liked', 'comment_created', 'comment_liked')),
  related_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================
-- 7. CREATE INDEXES (Performance)
-- ============================================
CREATE INDEX IF NOT EXISTS posts_user_id_idx ON posts(user_id);
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS post_likes_post_id_idx ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS post_likes_user_id_idx ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS comments_post_id_idx ON comments(post_id);
CREATE INDEX IF NOT EXISTS comments_user_id_idx ON comments(user_id);
CREATE INDEX IF NOT EXISTS comment_likes_comment_id_idx ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS comment_likes_user_id_idx ON comment_likes(user_id);
CREATE INDEX IF NOT EXISTS user_points_total_points_idx ON user_points(total_points DESC);
CREATE INDEX IF NOT EXISTS points_transactions_user_id_idx ON points_transactions(user_id);

-- ============================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;

-- Posts: Users can read all posts, but only create/update/delete their own
CREATE POLICY "Users can view all posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Users can create their own posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON posts FOR DELETE USING (auth.uid() = user_id);

-- Post Likes: Users can view all likes, but only create/delete their own
CREATE POLICY "Users can view all post likes" ON post_likes FOR SELECT USING (true);
CREATE POLICY "Users can create their own post likes" ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own post likes" ON post_likes FOR DELETE USING (auth.uid() = user_id);

-- Comments: Users can read all comments, but only create/update/delete their own
CREATE POLICY "Users can view all comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can create their own comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

-- Comment Likes: Users can view all likes, but only create/delete their own
CREATE POLICY "Users can view all comment likes" ON comment_likes FOR SELECT USING (true);
CREATE POLICY "Users can create their own comment likes" ON comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comment likes" ON comment_likes FOR DELETE USING (auth.uid() = user_id);

-- User Points: Users can view all points, but only update their own
CREATE POLICY "Users can view all user points" ON user_points FOR SELECT USING (true);
CREATE POLICY "Users can insert their own user points" ON user_points FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own user points" ON user_points FOR UPDATE USING (auth.uid() = user_id);

-- Points Transactions: Users can view all transactions, but only create their own
CREATE POLICY "Users can view all points transactions" ON points_transactions FOR SELECT USING (true);
CREATE POLICY "Users can create their own points transactions" ON points_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

