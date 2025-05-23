-- 检查表的 RLS 状态
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'articles';

-- 检查当前策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'articles';

-- 检查表是否存在
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'articles';

-- 简单的数据查询测试
SELECT count(*) FROM articles; 