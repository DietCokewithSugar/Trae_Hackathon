-- 修复words表的RLS策略，允许插入操作

-- 删除现有策略
DROP POLICY IF EXISTS "Allow public read access to words" ON words;

-- 创建允许所有操作的策略
CREATE POLICY "Allow all operations on words" ON words
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 授予所有必要权限
GRANT ALL ON words TO anon;
GRANT ALL ON words TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE words_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE words_id_seq TO authenticated;

SELECT 'Words RLS policy fixed successfully' as status;