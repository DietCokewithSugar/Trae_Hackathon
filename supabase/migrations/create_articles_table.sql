-- 创建文章表
CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX idx_articles_title ON articles USING gin(to_tsvector('english', title));

-- 设置RLS (Row Level Security)
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- 创建策略：允许所有用户读取文章
CREATE POLICY "Allow public read access" ON articles
    FOR SELECT USING (true);

-- 授权
GRANT SELECT ON articles TO anon;
GRANT ALL PRIVILEGES ON articles TO authenticated;

-- 插入示例数据
INSERT INTO articles (title, content) VALUES 
('Welcome to English Learning', 'This is your first English article. Reading is one of the most effective ways to improve your English skills. Through consistent practice and exposure to various texts, you can enhance your vocabulary, grammar understanding, and overall language proficiency. When you read regularly, you encounter new words in context, which helps you understand their meanings naturally. Additionally, reading exposes you to different writing styles and sentence structures, making you a more versatile communicator.'),
('The Benefits of Daily Reading', 'Daily reading habits can significantly improve your English comprehension. When you read regularly, you encounter new words in context, which helps you understand their meanings naturally. Additionally, reading exposes you to different writing styles and sentence structures. Research shows that people who read for just 30 minutes a day can see substantial improvements in their language skills within a few months. Reading also helps improve concentration, critical thinking, and analytical skills that are valuable in many aspects of life.'),
('Building Your Vocabulary', 'A strong vocabulary is essential for effective communication in English. The best way to build vocabulary is through extensive reading. When you encounter unfamiliar words, try to understand them from context before looking them up in a dictionary. This approach helps you develop better reading comprehension skills and makes new words more memorable. Keep a vocabulary journal to record new words along with their meanings and example sentences. Review these words regularly to reinforce your learning.'),
('Improving Reading Speed', 'Reading speed is an important skill that can be developed with practice. Start by reading materials that are slightly below your current level to build confidence and fluency. Gradually increase the difficulty as you become more comfortable. Avoid subvocalization (reading words in your head) as this can slow down your reading speed. Instead, try to read in chunks of words rather than individual words. Practice skimming and scanning techniques to quickly identify main ideas and specific information.'),
('Understanding Context Clues', 'Context clues are hints within a text that help you understand the meaning of unfamiliar words without using a dictionary. There are several types of context clues: definition clues (where the meaning is directly stated), synonym clues (where a similar word is used), antonym clues (where an opposite word provides contrast), and example clues (where examples help clarify meaning). Learning to identify and use these clues will make you a more independent and confident reader.');

-- 创建更新时间的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为articles表创建触发器
CREATE TRIGGER update_articles_updated_at 
    BEFORE UPDATE ON articles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();