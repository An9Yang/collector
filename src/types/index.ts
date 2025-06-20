export interface Article {
  id: string;
  url: string;
  title: string;
  summary: string;
  source: 'wechat' | 'linkedin' | 'reddit' | 'other';
  created_at: string;
  updated_at: string;
  is_read: boolean;
  content?: string | null;
  cover_image?: string | null;
  tags?: string[] | null;
}

// 新增收藏夹类型
export interface Collection {
  id: string;
  name: string;
  description?: string | null;
  color: string;
  icon: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  article_count?: number; // 前端计算的文章数量
}

export interface CollectionInsert {
  name: string;
  description?: string | null;
  color?: string;
  icon?: string;
  is_default?: boolean;
}

export interface CollectionUpdate {
  name?: string;
  description?: string | null;
  color?: string;
  icon?: string;
  is_default?: boolean;
}

// 文章-收藏夹关联类型
export interface ArticleCollection {
  id: string;
  article_id: string;
  collection_id: string;
  added_at: string;
}

// 带有收藏夹信息的文章类型
export interface ArticleWithCollections extends Article {
  collections?: Collection[];
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface ArticleInsert {
  url: string;
  title: string;
  summary: string;
  source: 'wechat' | 'linkedin' | 'reddit' | 'other';
  content?: string | null;
  cover_image?: string | null;
  tags?: string[] | null;
  is_read?: boolean;
}

export interface ArticleUpdate {
  url?: string;
  title?: string;
  summary?: string;
  source?: 'wechat' | 'linkedin' | 'reddit' | 'other';
  content?: string | null;
  cover_image?: string | null;
  tags?: string[] | null;
  is_read?: boolean;
}