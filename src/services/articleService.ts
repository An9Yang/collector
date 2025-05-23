import { supabase } from '../config/supabase';
import type { Article, ArticleInsert, ArticleUpdate } from '../types';

export class ArticleService {
  /**
   * 获取所有文章
   */
  static async getArticles(): Promise<Article[]> {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching articles:', error);
      throw new Error(error.message);
    }

    return data || [];
  }

  /**
   * 根据 ID 获取单篇文章
   */
  static async getArticleById(id: string): Promise<Article | null> {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching article:', error);
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * 创建新文章
   */
  static async createArticle(article: ArticleInsert): Promise<Article> {
    const { data, error } = await supabase
      .from('articles')
      .insert([article])
      .select()
      .single();

    if (error) {
      console.error('Error creating article:', error);
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * 更新文章
   */
  static async updateArticle(id: string, updates: ArticleUpdate): Promise<Article> {
    const { data, error } = await supabase
      .from('articles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating article:', error);
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * 删除文章
   */
  static async deleteArticle(id: string): Promise<void> {
    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting article:', error);
      throw new Error(error.message);
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
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .overlaps('tags', tags)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching articles by tags:', error);
      throw new Error(error.message);
    }

    return data || [];
  }

  /**
   * 全文搜索文章
   */
  static async searchArticles(query: string): Promise<Article[]> {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .or(`title.ilike.%${query}%,summary.ilike.%${query}%,content.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching articles:', error);
      throw new Error(error.message);
    }

    return data || [];
  }
} 