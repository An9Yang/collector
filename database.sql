-- 创建文章表
CREATE TABLE IF NOT EXISTS articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('wechat', 'linkedin', 'reddit', 'other')),
  content TEXT,
  cover_image TEXT,
  tags TEXT[],
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建更新时间的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_articles_updated_at 
  BEFORE UPDATE ON articles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_source ON articles(source);
CREATE INDEX IF NOT EXISTS idx_articles_is_read ON articles(is_read);
CREATE INDEX IF NOT EXISTS idx_articles_tags ON articles USING GIN(tags);

-- 启用行级安全 (RLS)
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- 创建策略：允许匿名用户读取和插入（因为这是个人项目）
CREATE POLICY "允许所有操作" ON articles
  FOR ALL USING (true);

-- 注释
COMMENT ON TABLE articles IS '文章收集表';
COMMENT ON COLUMN articles.id IS '文章唯一标识符';
COMMENT ON COLUMN articles.url IS '文章原始链接';
COMMENT ON COLUMN articles.title IS '文章标题';
COMMENT ON COLUMN articles.summary IS '文章摘要';
COMMENT ON COLUMN articles.source IS '文章来源平台';
COMMENT ON COLUMN articles.content IS '文章完整内容';
COMMENT ON COLUMN articles.cover_image IS '文章封面图片URL';
COMMENT ON COLUMN articles.tags IS '文章标签数组';
COMMENT ON COLUMN articles.is_read IS '是否已读';
COMMENT ON COLUMN articles.created_at IS '创建时间';
COMMENT ON COLUMN articles.updated_at IS '更新时间'; 