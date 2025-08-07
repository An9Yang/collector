import { api } from './api';
import type { Article, ArticleInsert, ArticleUpdate } from '../types';
import { CollectionService } from './collectionService';
import { requestManager } from '../utils/requestManager';

export class ArticleService {
  /**
   * 获取所有文章
   */
  static async getArticles(params = {}): Promise<{ data: Article[]; pagination: any }> {
    const key = `getArticles-${JSON.stringify(params)}`;
    return requestManager.execute(key, async () => {
      try {
        return await api.getArticles(params);
      } catch (error) {
        console.error('Network error fetching articles:', error);
        if (error instanceof TypeError && error.message.includes('fetch')) {
          throw new Error('Unable to connect to server. Please check your internet connection and try again.');
        }
        throw error;
      }
    });
  }

  /**
   * 根据 ID 获取单篇文章
   */
  static async getArticleById(id: string): Promise<Article | null> {
    try {
      return await api.getArticle(id);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check your internet connection and try again.');
      }
      throw error;
    }
  }

  /**
   * 创建新文章
   */
  static async createArticle(articleData: ArticleInsert, collectionId?: string): Promise<Article> {
    try {
      const collectionIds = collectionId ? [collectionId] : [];
      
      // 如果没有指定收藏夹，使用默认收藏夹
      if (!collectionId) {
        const defaultCollection = await CollectionService.getDefaultCollection();
        if (defaultCollection) {
          collectionIds.push(defaultCollection.id);
        }
      }

      const article = await api.createArticle({
        ...articleData,
        collection_ids: collectionIds
      });

      return article;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check your internet connection and try again.');
      }
      throw error;
    }
  }

  /**
   * 更新文章
   */
  static async updateArticle(id: string, updates: ArticleUpdate): Promise<Article> {
    try {
      return await api.updateArticle(id, updates);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check your internet connection and try again.');
      }
      throw error;
    }
  }

  /**
   * 删除文章
   */
  static async deleteArticle(id: string): Promise<void> {
    try {
      await api.deleteArticle(id);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check your internet connection and try again.');
      }
      throw error;
    }
  }

  /**
   * 标记文章为已读
   */
  static async markAsRead(id: string): Promise<Article> {
    return this.updateArticle(id, { is_read: true });
  }

  /**
   * 标记文章为未读
   */
  static async markAsUnread(id: string): Promise<Article> {
    return this.updateArticle(id, { is_read: false });
  }

  /**
   * 根据标签搜索文章
   */
  static async searchByTags(tags: string[]): Promise<Article[]> {
    try {
      // Server-side filtering by tags
      const results = await Promise.all(
        tags.map(tag => api.getArticlesByTag(tag))
      );
      
      // Merge and deduplicate results
      const articlesMap = new Map();
      results.forEach(result => {
        result.articles.forEach(article => {
          articlesMap.set(article.id, article);
        });
      });
      
      return Array.from(articlesMap.values());
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check your internet connection and try again.');
      }
      throw error;
    }
  }

  /**
   * 全文搜索文章
   */
  static async searchArticles(query: string): Promise<Article[]> {
    try {
      // For now, do client-side search
      // TODO: Add server-side full-text search endpoint
      const { data } = await api.getArticles();
      const lowercaseQuery = query.toLowerCase();
      
      return data.filter(article => 
        article.title?.toLowerCase().includes(lowercaseQuery) ||
        article.summary?.toLowerCase().includes(lowercaseQuery) ||
        article.content?.toLowerCase().includes(lowercaseQuery)
      );
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check your internet connection and try again.');
      }
      throw error;
    }
  }

  /**
   * 获取文章及其收藏夹信息
   */
  static async getArticleWithCollections(id: string) {
    const article = await this.getArticleById(id);
    if (!article) return null;

    const collections = await CollectionService.getCollectionsByArticle(id);
    return {
      ...article,
      collections
    };
  }

  /**
   * 按收藏夹获取文章（通过CollectionService代理）
   */
  static async getArticlesByCollection(collectionId: string) {
    return CollectionService.getArticlesByCollection(collectionId);
  }

  /**
   * 按来源筛选文章
   */
  static async getArticlesBySource(source: 'wechat' | 'linkedin' | 'reddit' | 'other'): Promise<Article[]> {
    const { data } = await api.getArticles({ source });
    return data;
  }

  /**
   * 获取未读文章
   */
  static async getUnreadArticles(): Promise<Article[]> {
    const { data } = await api.getArticles({ is_read: false });
    return data;
  }
}