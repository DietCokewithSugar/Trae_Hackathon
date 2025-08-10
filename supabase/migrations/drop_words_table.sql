-- 删除现有的words表和相关策略

-- 删除RLS策略
DROP POLICY IF EXISTS "Allow public read access to words" ON words;

-- 删除表
DROP TABLE IF EXISTS words;

-- 确认删除
SELECT 'Words table and policies dropped successfully' as status;