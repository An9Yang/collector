/*
  # Update RLS policies for guest access

  1. Changes
     - Remove user_id check from all policies to allow guest access to articles
     - Add policies to allow public access to view, create, update and delete articles

  Note: This is for demonstration purposes only. In a production environment,
  you would want proper authentication and user-specific access controls.
*/

-- Update existing policies to allow access without checking user_id
DROP POLICY IF EXISTS "Users can read their own articles" ON articles;
DROP POLICY IF EXISTS "Users can insert their own articles" ON articles;
DROP POLICY IF EXISTS "Users can update their own articles" ON articles;
DROP POLICY IF EXISTS "Users can delete their own articles" ON articles;

-- Create new policies allowing public access
CREATE POLICY "Public can read all articles"
  ON articles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Public can insert articles"
  ON articles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Public can update all articles"
  ON articles
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Public can delete all articles"
  ON articles
  FOR DELETE
  TO authenticated
  USING (true);

-- Create the same policies for anonymous access
CREATE POLICY "Anonymous can read all articles"
  ON articles
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous can insert articles"
  ON articles
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous can update all articles"
  ON articles
  FOR UPDATE
  TO anon
  USING (true);

CREATE POLICY "Anonymous can delete all articles"
  ON articles
  FOR DELETE
  TO anon
  USING (true);