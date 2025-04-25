export interface Article {
  id: string;
  url: string;
  title: string;
  summary: string;
  source: 'wechat' | 'linkedin' | 'reddit' | 'other';
  createdAt: string;
  isRead: boolean;
  content?: string;
  coverImage?: string;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
}