import type { Article, ArticleInsert, ArticleUpdate, Collection, CollectionInsert, CollectionUpdate } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiRequestOptions extends RequestInit {
  headers?: HeadersInit;
}

interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
  source?: string;
  is_read?: boolean;
  collectionId?: string;
  tag?: string;
}

interface ApiResponse<T> {
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class ApiService {
  async request<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    
    console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: `HTTP error! status: ${response.status}`
        }));
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }

      const data = response.status === 204 ? null : await response.json();
      console.log(`✅ API Response received for ${endpoint}`);
      return data as T;
    } catch (error) {
      console.error(`❌ API Error (${endpoint}):`, error);
      console.error(`API URL was: ${url}`);
      console.error(`API_URL env var: ${API_URL}`);
      throw error;
    }
  }

  // Article methods
  async getArticles(params: PaginationParams = {}): Promise<ApiResponse<Article[]>> {
    const queryString = new URLSearchParams(params as any).toString();
    return this.request<ApiResponse<Article[]>>(`/articles${queryString ? `?${queryString}` : ''}`);
  }

  async getArticle(id: string): Promise<Article> {
    return this.request<Article>(`/articles/${id}`);
  }

  async createArticle(article: ArticleInsert & { collection_ids?: string[] }): Promise<Article> {
    return this.request<Article>('/articles', {
      method: 'POST',
      body: JSON.stringify(article),
    });
  }

  async updateArticle(id: string, updates: ArticleUpdate): Promise<Article> {
    return this.request<Article>(`/articles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteArticle(id: string): Promise<void> {
    return this.request<void>(`/articles/${id}`, {
      method: 'DELETE',
    });
  }

  // Collection methods
  async getCollections(): Promise<Collection[]> {
    return this.request<Collection[]>('/collections');
  }

  async getCollection(id: string, params: PaginationParams = {}): Promise<Collection & { articles?: Article[] }> {
    const queryString = new URLSearchParams(params as any).toString();
    return this.request<Collection & { articles?: Article[] }>(`/collections/${id}${queryString ? `?${queryString}` : ''}`);
  }

  async createCollection(collection: CollectionInsert): Promise<Collection> {
    return this.request<Collection>('/collections', {
      method: 'POST',
      body: JSON.stringify(collection),
    });
  }

  async updateCollection(id: string, updates: CollectionUpdate): Promise<Collection> {
    return this.request<Collection>(`/collections/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteCollection(id: string): Promise<void> {
    return this.request<void>(`/collections/${id}`, {
      method: 'DELETE',
    });
  }

  // Article-Collection relationship methods
  async addArticleToCollection(articleId: string, collectionId: string): Promise<void> {
    return this.request<void>(`/collections/${collectionId}/articles`, {
      method: 'POST',
      body: JSON.stringify({ article_id: articleId }),
    });
  }

  async removeArticleFromCollection(articleId: string, collectionId: string): Promise<void> {
    return this.request<void>(`/collections/${collectionId}/articles/${articleId}`, {
      method: 'DELETE',
    });
  }

  // Tag methods
  async getTags(): Promise<string[]> {
    return this.request<string[]>('/tags');
  }

  async getArticlesByTag(tag: string): Promise<{ articles: Article[] }> {
    return this.request<{ articles: Article[] }>(`/tags/${encodeURIComponent(tag)}/articles`);
  }

  // Web scraping method
  async scrapeUrl(url: string): Promise<{ title: string; summary: string; content: string }> {
    return this.request<{ title: string; summary: string; content: string }>('/scrape', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  }
}

export const api = new ApiService();