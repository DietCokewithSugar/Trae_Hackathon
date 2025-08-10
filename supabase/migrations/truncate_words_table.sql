-- 清空words表数据，准备重新导入

TRUNCATE TABLE words RESTART IDENTITY;

SELECT 'Words table truncated successfully' as status;