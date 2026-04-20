-- ============================================
-- Blog Engagement Foundation
-- Comments + Likes for blog articles
-- ============================================

-- --------------------------------------------
-- 1) Blog comments
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS blog_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_slug TEXT NOT NULL,
  name TEXT NOT NULL CHECK (LENGTH(name) <= 100),
  email TEXT NOT NULL CHECK (LENGTH(email) <= 255),
  content TEXT NOT NULL CHECK (LENGTH(content) <= 2000),
  is_approved BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_comments_article ON blog_comments(article_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_comments_approved ON blog_comments(article_slug, is_approved, created_at DESC);

-- --------------------------------------------
-- 2) Blog likes (anonymous with visitor_id)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS blog_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_slug TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(article_slug, visitor_id)
);

CREATE INDEX IF NOT EXISTS idx_blog_likes_article ON blog_likes(article_slug);

-- --------------------------------------------
-- 3) RLS Policies (public read, authenticated insert for comments)
-- --------------------------------------------

ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS blog_comments_public_select ON blog_comments;
CREATE POLICY blog_comments_public_select ON blog_comments
  FOR SELECT USING (is_approved = TRUE);

DROP POLICY IF EXISTS blog_comments_public_insert ON blog_comments;
CREATE POLICY blog_comments_public_insert ON blog_comments
  FOR INSERT WITH CHECK (TRUE);

ALTER TABLE blog_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS blog_likes_public_select ON blog_likes;
CREATE POLICY blog_likes_public_select ON blog_likes
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS blog_likes_public_insert ON blog_likes;
CREATE POLICY blog_likes_public_insert ON blog_likes
  FOR INSERT WITH CHECK (TRUE);
