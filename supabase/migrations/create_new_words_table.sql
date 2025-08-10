-- 创建新的words表，基于ecdict.csv的结构

CREATE TABLE IF NOT EXISTS words (
    id SERIAL PRIMARY KEY,
    word TEXT NOT NULL UNIQUE,
    phonetic TEXT,
    definition TEXT,
    translation TEXT,
    pos TEXT, -- part of speech
    collins INTEGER,
    oxford INTEGER,
    tag TEXT,
    bnc INTEGER,
    frq INTEGER,
    exchange TEXT,
    detail TEXT,
    audio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_words_word ON words(word);
CREATE INDEX IF NOT EXISTS idx_words_word_lower ON words(LOWER(word));

-- 启用行级安全
ALTER TABLE words ENABLE ROW LEVEL SECURITY;

-- 创建允许所有用户读取的策略
CREATE POLICY "Allow public read access to words" ON words
    FOR SELECT
    USING (true);

-- 授予权限
GRANT SELECT ON words TO anon;
GRANT SELECT ON words TO authenticated;

SELECT 'Words table created successfully' as status;