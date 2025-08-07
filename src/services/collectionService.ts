import { api } from './api';
import type { Collection, CollectionInsert, CollectionUpdate, Article } from '../types';
import { requestManager } from '../utils/requestManager';

export class CollectionService {
  /**
   * 获取所有收藏夹
   */
  static async getCollections(): Promise<Collection[]> {
    return requestManager.execute('getCollections', async () => {
      try {
        return await api.getCollections();
      } catch (error) {
        console.error('Network error fetching collections:', error);
        if (error instanceof TypeError && error.message.includes('fetch')) {
          throw new Error('Unable to connect to server. Please check your internet connection and try again.');
        }
        throw error;
      }
    });
  }

  /**
   * 根据 ID 获取单个收藏夹
   */
  static async getCollectionById(id: string): Promise<Collection | null> {
    try {
      const collection = await api.getCollection(id);
      return collection;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check your internet connection and try again.');
      }
      throw error;
    }
  }

  /**
   * 创建新收藏夹
   */
  static async createCollection(collectionData: CollectionInsert): Promise<Collection> {
    try {
      return await api.createCollection(collectionData);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check your internet connection and try again.');
      }
      throw error;
    }
  }

  /**
   * 更新收藏夹
   */
  static async updateCollection(id: string, updates: CollectionUpdate): Promise<Collection> {
    try {
      return await api.updateCollection(id, updates);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check your internet connection and try again.');
      }
      throw error;
    }
  }

  /**
   * 删除收藏夹
   */
  static async deleteCollection(id: string): Promise<void> {
    try {
      await api.deleteCollection(id);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check your internet connection and try again.');
      }
      throw error;
    }
  }

  /**
   * 将文章添加到收藏夹
   */
  static async addArticleToCollection(articleId: string, collectionId: string): Promise<void> {
    try {
      await api.addArticleToCollection(collectionId, articleId);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check your internet connection and try again.');
      }
      throw error;
    }
  }

  /**
   * 从收藏夹移除文章
   */
  static async removeArticleFromCollection(articleId: string, collectionId: string): Promise<void> {
    try {
      await api.removeArticleFromCollection(collectionId, articleId);
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check your internet connection and try again.');
      }
      throw error;
    }
  }

  /**
   * 获取收藏夹中的文章
   */
  static async getArticlesByCollection(collectionId: string, params = {}): Promise<Article[]> {
    try {
      // 添加默认排序参数
      const defaultParams = {
        sortBy: 'created_at',
        order: 'desc',
        ...params
      };
      const result = await api.getCollection(collectionId, defaultParams);
      return result.articles || [];
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check your internet connection and try again.');
      }
      throw error;
    }
  }

  /**
   * 获取文章所属的收藏夹
   */
  static async getCollectionsByArticle(articleId: string): Promise<Collection[]> {
    try {
      // Get all collections and filter client-side for now
      // TODO: Add server endpoint for this
      const collections = await api.getCollections();
      const article = await api.getArticle(articleId);
      
      if (!article || !article.collections) return [];
      
      const collectionIds = article.collections.map(c => c.collection_id);
      return collections.filter(c => collectionIds.includes(c.id));
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check your internet connection and try again.');
      }
      throw error;
    }
  }

  /**
   * 获取或创建默认收藏夹
   */
  static async getDefaultCollection(): Promise<Collection | null> {
    try {
      const collections = await this.getCollections();
      let defaultCollection = collections.find(c => c.name === 'Default Collection');
      
      if (!defaultCollection) {
        defaultCollection = await this.createCollection({
          name: 'Default Collection',
          description: 'Default collection for new articles'
        });
      }
      
      return defaultCollection;
    } catch (error) {
      console.error('Error getting default collection:', error);
      return null;
    }
  }

  /**
   * 移动文章到另一个收藏夹
   */
  static async moveArticleToCollection(articleId: string, fromCollectionId: string, toCollectionId: string): Promise<void> {
    // 先删除再添加，确保操作的原子性
    await this.removeArticleFromCollection(articleId, fromCollectionId);
    await this.addArticleToCollection(articleId, toCollectionId);
  }
}