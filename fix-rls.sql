-- 首先删除现有策略（如果存在）
DROP POLICY IF EXISTS "允许所有操作" ON articles;

-- 禁用 RLS（临时用于测试）
ALTER TABLE articles DISABLE ROW LEVEL SECURITY;

-- 或者，如果你想保持 RLS，使用这个更宽松的策略：
-- ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "允许所有操作" ON articles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true); 