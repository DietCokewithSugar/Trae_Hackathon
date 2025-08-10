-- Fix articles table RLS policy to allow inserts
-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read access" ON articles;
DROP POLICY IF EXISTS "Allow public insert access" ON articles;

-- Create policy to allow anyone to read articles
CREATE POLICY "Allow public read access" ON articles
    FOR SELECT USING (true);

-- Create policy to allow anyone to insert articles
CREATE POLICY "Allow public insert access" ON articles
    FOR INSERT WITH CHECK (true);

-- Grant necessary permissions to anon and authenticated roles
GRANT SELECT, INSERT ON articles TO anon;
GRANT SELECT, INSERT ON articles TO authenticated;

-- Also grant usage on the sequence if needed
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;