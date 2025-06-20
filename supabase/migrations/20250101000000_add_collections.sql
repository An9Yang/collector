-- 创建收藏夹表
CREATE TABLE IF NOT EXISTS collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6', -- 收藏夹颜色标识
  icon TEXT DEFAULT '📁', -- 收藏夹图标
  is_default BOOLEAN DEFAULT FALSE, -- 是否为默认收藏夹
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建文章-收藏夹关联表
CREATE TABLE IF NOT EXISTS article_collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(article_id, collection_id) -- 防止重复添加
);

-- 创建收藏夹更新时间触发器
CREATE TRIGGER update_collections_updated_at 
  BEFORE UPDATE ON collections 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_collections_created_at ON collections(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_collections_is_default ON collections(is_default);
CREATE INDEX IF NOT EXISTS idx_article_collections_article_id ON article_collections(article_id);
CREATE INDEX IF NOT EXISTS idx_article_collections_collection_id ON article_collections(collection_id);

-- 启用行级安全
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_collections ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "允许所有收藏夹操作" ON collections FOR ALL USING (true);
CREATE POLICY "允许所有关联操作" ON article_collections FOR ALL USING (true);

-- 插入默认收藏夹
INSERT INTO collections (name, description, is_default, icon, color) 
VALUES ('我的收藏', '默认收藏夹，用于保存所有收藏的文章', true, '⭐', '#F59E0B');

-- 将现有文章添加到默认收藏夹
INSERT INTO article_collections (article_id, collection_id)
SELECT a.id, c.id 
FROM articles a, collections c 
WHERE c.is_default = true;

-- 注释
COMMENT ON TABLE collections IS '收藏夹表';
COMMENT ON TABLE article_collections IS '文章-收藏夹关联表';
COMMENT ON COLUMN collections.name IS '收藏夹名称';
COMMENT ON COLUMN collections.description IS '收藏夹描述';
COMMENT ON COLUMN collections.color IS '收藏夹主题颜色';
COMMENT ON COLUMN collections.icon IS '收藏夹图标';
COMMENT ON COLUMN collections.is_default IS '是否为默认收藏夹'; 