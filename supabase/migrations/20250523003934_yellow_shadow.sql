/*
  # Create articles table

  1. New Tables
    - `articles`
      - `id` (uuid, primary key)
      - `url` (text)
      - `title` (text, not null)
      - `summary` (text)
      - `source` (text, one of 'wechat', 'linkedin', 'reddit', 'other')
      - `created_at` (timestamptz, default now())
      - `is_read` (boolean, default false)
      - `content` (text, nullable)
      - `cover_image` (text, nullable)
      - `user_id` (uuid, not null, references auth.users)

  2. Security
    - Enable RLS on `articles` table
    - Add policies:
      - Users can read their own articles
      - Users can insert their own articles
      - Users can update their own articles
      - Users can delete their own articles
*/

-- Create articles table
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('wechat', 'linkedin', 'reddit', 'other')),
  created_at TIMESTAMPTZ DEFAULT now(),
  is_read BOOLEAN DEFAULT false,
  content TEXT,
  cover_image TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id)
);

-- Add updated_at column with trigger
ALTER TABLE articles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'articles_updated_at'
  ) THEN
    CREATE TRIGGER articles_updated_at
    BEFORE UPDATE ON articles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can read their own articles
CREATE POLICY "Users can read their own articles"
  ON articles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own articles
CREATE POLICY "Users can insert their own articles"
  ON articles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own articles
CREATE POLICY "Users can update their own articles"
  ON articles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own articles
CREATE POLICY "Users can delete their own articles"
  ON articles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS articles_user_id_idx ON articles(user_id);
CREATE INDEX IF NOT EXISTS articles_source_idx ON articles(source);