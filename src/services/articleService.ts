import { supabase } from '../config/supabase';
import type { Article, ArticleInsert, ArticleUpdate } from '../types';

export class ArticleService {
  /**
   * 获取所有文章
   */
  static async getArticles(): Promise<Article[]> {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching articles:', error);
        throw new Error(`Supabase error: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Network error fetching articles:', error);
      // Check if it's a network connectivity issue
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to database. Please check your internet connection and try again.');
      }
      throw error;
    }
  }

  /**
   * 根据 ID 获取单篇文章
   */
  static async getArticleById(id: string): Promise<Article | null> {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching article:', error);
        throw new Error(`Supabase error: ${error.message}`);
      }

      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to database. Please check your internet connection and try again.');
      }
      throw error;
    }
  }

  /**
   * 创建新文章
   */
  static async createArticle(article: ArticleInsert): Promise<Article> {
    try {
      const { data, error } = await supabase
        .from('articles')
        .insert([article])
        .select()
        .single();

      if (error) {
        console.error('Error creating article:', error);
        throw new Error(`Supabase error: ${error.message}`);
      }

      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to database. Please check your internet connection and try again.');
      }
      throw error;
    }
  }

  /**
   * 更新文章
   */
  static async updateArticle(id: string, updates: ArticleUpdate): Promise<Article> {
    try {
      const { data, error } = await supabase
        .from('articles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating article:', error);
        throw new Error(`Supabase error: ${error.message}`);
      }

      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to database. Please check your internet connection and try again.');
      }
      throw error;
    }
  }

  /**
   * 删除文章
   */
  static async deleteArticle(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting article:', error);
        throw new Error(`Supabase error: ${error.message}`);
      }
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to database. Please check your internet connection and try again.');
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
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .overlaps('tags', tags)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error searching articles by tags:', error);
        throw new Error(`Supabase error: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to database. Please check your internet connection and try again.');
      }
      throw error;
    }
  }

  /**
   * 全文搜索文章
   */
  static async searchArticles(query: string): Promise<Article[]> {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .or(`title.ilike.%${query}%,summary.ilike.%${query}%,content.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error searching articles:', error);
        throw new Error(`Supabase error: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to database. Please check your internet connection and try again.');
      }
      throw error;
    }
  }
}