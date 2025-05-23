export interface Article {
  id: string;
  url: string;
  title: string;
  summary: string;
  source: 'wechat' | 'linkedin' | 'reddit' | 'other';
  created_at: string;
  updated_at: string;
  is_read: boolean;
  content?: string;
  cover_image?: string;
  tags?: string[];
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
  content?: string;
  cover_image?: string;
  tags?: string[];
  is_read?: boolean;
}

export interface ArticleUpdate {
  url?: string;
  title?: string;
  summary?: string;
  source?: 'wechat' | 'linkedin' | 'reddit' | 'other';
  content?: string;
  cover_image?: string;
  tags?: string[];
  is_read?: boolean;
}