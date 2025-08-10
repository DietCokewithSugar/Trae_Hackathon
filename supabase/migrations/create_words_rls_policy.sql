-- 为words表创建RLS策略，允许所有用户查询

-- 启用RLS（如果尚未启用）
ALTER TABLE words ENABLE ROW LEVEL SECURITY;

-- 创建允许所有用户查询的策略
CREATE POLICY "Allow public read access to words" ON words
    FOR SELECT
    TO public
    USING (true);

-- 检查策略是否创建成功
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'words';