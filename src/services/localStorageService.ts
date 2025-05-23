import type { Article, ArticleInsert, ArticleUpdate } from '../types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'collector_articles';

export class LocalStorageService {
  /**
   * 获取所有文章
   */
  static async getArticles(): Promise<Article[]> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      
      const articles = JSON.parse(stored);
      // 按创建时间排序
      return articles.sort((a: Article, b: Article) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } catch (error) {
      console.error('Error loading articles from localStorage:', error);
      return [];
    }
  }

  /**
   * 根据 ID 获取单篇文章
   */
  static async getArticleById(id: string): Promise<Article | null> {
    try {
      const articles = await this.getArticles();
      return articles.find(article => article.id === id) || null;
    } catch (error) {
      console.error('Error getting article by id:', error);
      return null;
    }
  }

  /**
   * 创建新文章
   */
  static async createArticle(article: ArticleInsert): Promise<Article> {
    try {
      const articles = await this.getArticles();
      const now = new Date().toISOString();
      
      const newArticle: Article = {
        id: uuidv4(),
        ...article,
        created_at: now,
        updated_at: now,
        is_read: article.is_read || false,
      };

      articles.unshift(newArticle); // 添加到开头
      localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
      
      return newArticle;
    } catch (error) {
      console.error('Error creating article:', error);
      throw new Error('Failed to create article');
    }
  }

  /**
   * 更新文章
   */
  static async updateArticle(id: string, updates: ArticleUpdate): Promise<Article> {
    try {
      const articles = await this.getArticles();
      const index = articles.findIndex(article => article.id === id);
      
      if (index === -1) {
        throw new Error('Article not found');
      }

      const updatedArticle: Article = {
        ...articles[index],
        ...updates,
        updated_at: new Date().toISOString(),
      };

      articles[index] = updatedArticle;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
      
      return updatedArticle;
    } catch (error) {
      console.error('Error updating article:', error);
      throw new Error('Failed to update article');
    }
  }

  /**
   * 删除文章
   */
  static async deleteArticle(id: string): Promise<void> {
    try {
      const articles = await this.getArticles();
      const filteredArticles = articles.filter(article => article.id !== id);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredArticles));
    } catch (error) {
      console.error('Error deleting article:', error);
      throw new Error('Failed to delete article');
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
      const articles = await this.getArticles();
      return articles.filter(article => 
        article.tags && article.tags.some(tag => tags.includes(tag))
      );
    } catch (error) {
      console.error('Error searching articles by tags:', error);
      return [];
    }
  }

  /**
   * 全文搜索文章
   */
  static async searchArticles(query: string): Promise<Article[]> {
    try {
      const articles = await this.getArticles();
      const lowerQuery = query.toLowerCase();
      
      return articles.filter(article => 
        article.title.toLowerCase().includes(lowerQuery) ||
        article.summary.toLowerCase().includes(lowerQuery) ||
        (article.content && article.content.toLowerCase().includes(lowerQuery))
      );
    } catch (error) {
      console.error('Error searching articles:', error);
      return [];
    }
  }

  /**
   * 清空所有数据（用于测试）
   */
  static async clearAll(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * 导出数据（备份功能）
   */
  static async exportData(): Promise<string> {
    const articles = await this.getArticles();
    return JSON.stringify(articles, null, 2);
  }

  /**
   * 导入数据（恢复功能）
   */
  static async importData(jsonData: string): Promise<void> {
    try {
      const articles = JSON.parse(jsonData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
    } catch (error) {
      console.error('Error importing data:', error);
      throw new Error('Invalid data format');
    }
  }
} 