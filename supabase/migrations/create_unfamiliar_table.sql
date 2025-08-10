-- 创建unfamiliar表用于存储不熟悉的单词

CREATE TABLE IF NOT EXISTS unfamiliar (
    id SERIAL PRIMARY KEY,
    word TEXT NOT NULL,
    phonetic TEXT,
    definition TEXT,
    translation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(word) -- 防止重复添加相同单词
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_unfamiliar_word ON unfamiliar(word);
CREATE INDEX IF NOT EXISTS idx_unfamiliar_created_at ON unfamiliar(created_at DESC);

-- 启用行级安全
ALTER TABLE unfamiliar ENABLE ROW LEVEL SECURITY;

-- 创建允许所有操作的策略
CREATE POLICY "Allow all operations on unfamiliar" ON unfamiliar
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 授予权限
GRANT ALL ON unfamiliar TO anon;
GRANT ALL ON unfamiliar TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE unfamiliar_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE unfamiliar_id_seq TO authenticated;

SELECT 'Unfamiliar table created successfully' as status;