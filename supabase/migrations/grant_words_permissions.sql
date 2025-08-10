-- 为words表授予anon和authenticated角色的查询权限

-- 授予anon角色对words表的SELECT权限
GRANT SELECT ON words TO anon;

-- 授予authenticated角色对words表的SELECT权限
GRANT SELECT ON words TO authenticated;

-- 检查当前权限
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'words'
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;