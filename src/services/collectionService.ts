import { supabase } from '../config/supabase';
import { Collection, CollectionInsert, CollectionUpdate } from '../types';

export class CollectionService {
  /**
   * 获取所有收藏夹
   */
  static async getCollections(): Promise<Collection[]> {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching collections:', error);
      throw new Error('Failed to fetch collections');
    }

    // 获取每个收藏夹的文章数量
    const collectionsWithCount = await Promise.all(
      data.map(async (collection) => {
        const { count } = await supabase
          .from('article_collections')
          .select('*', { count: 'exact', head: true })
          .eq('collection_id', collection.id);
        
        return {
          ...collection,
          article_count: count || 0
        };
      })
    );

    return collectionsWithCount;
  }

  /**
   * 创建新收藏夹
   */
  static async createCollection(collectionData: CollectionInsert): Promise<Collection> {
    const { data, error } = await supabase
      .from('collections')
      .insert(collectionData)
      .select()
      .single();

    if (error) {
      console.error('Error creating collection:', error);
      throw new Error('Failed to create collection');
    }

    return { ...data, article_count: 0 };
  }

  /**
   * 更新收藏夹
   */
  static async updateCollection(id: string, updates: CollectionUpdate): Promise<Collection> {
    const { data, error } = await supabase
      .from('collections')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating collection:', error);
      throw new Error('Failed to update collection');
    }

    return { ...data, article_count: 0 };
  }

  /**
   * 删除收藏夹
   */
  static async deleteCollection(id: string): Promise<void> {
    // 检查是否为默认收藏夹
    const { data: collection } = await supabase
      .from('collections')
      .select('is_default')
      .eq('id', id)
      .single();

    if (collection?.is_default) {
      throw new Error('Cannot delete default collection');
    }

    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting collection:', error);
      throw new Error('Failed to delete collection');
    }
  }

  /**
   * 将文章添加到收藏夹
   */
  static async addArticleToCollection(articleId: string, collectionId: string): Promise<void> {
    const { error } = await supabase
      .from('article_collections')
      .insert({
        article_id: articleId,
        collection_id: collectionId
      });

    if (error) {
      // 如果是重复添加错误，不抛出异常
      if (error.code === '23505') {
        console.warn('Article already in collection');
        return;
      }
      console.error('Error adding article to collection:', error);
      throw new Error('Failed to add article to collection');
    }
  }

  /**
   * 从收藏夹移除文章
   */
  static async removeArticleFromCollection(articleId: string, collectionId: string): Promise<void> {
    const { error } = await supabase
      .from('article_collections')
      .delete()
      .eq('article_id', articleId)
      .eq('collection_id', collectionId);

    if (error) {
      console.error('Error removing article from collection:', error);
      throw new Error('Failed to remove article from collection');
    }
  }

  /**
   * 获取收藏夹中的文章
   */
  static async getArticlesByCollection(collectionId: string) {
    const { data, error } = await supabase
      .from('article_collections')
      .select(`
        article_id,
        added_at,
        articles(*)
      `)
      .eq('collection_id', collectionId)
      .order('added_at', { ascending: false });

    if (error) {
      console.error('Error fetching articles by collection:', error);
      throw new Error('Failed to fetch articles');
    }

    return data.map(item => ({
      ...item.articles,
      added_to_collection_at: item.added_at
    }));
  }

  /**
   * 获取文章所属的收藏夹
   */
  static async getCollectionsByArticle(articleId: string): Promise<Collection[]> {
    const { data, error } = await supabase
      .from('article_collections')
      .select(`
        collection_id,
        added_at,
        collections(*)
      `)
      .eq('article_id', articleId);

    if (error) {
      console.error('Error fetching collections by article:', error);
      throw new Error('Failed to fetch collections');
    }

    return data.map(item => ({
      ...item.collections,
      article_count: 0
    })) as Collection[];
  }

  /**
   * 移动文章到另一个收藏夹
   */
  static async moveArticleToCollection(articleId: string, fromCollectionId: string, toCollectionId: string): Promise<void> {
    // 先删除再添加，确保操作的原子性
    await this.removeArticleFromCollection(articleId, fromCollectionId);
    await this.addArticleToCollection(articleId, toCollectionId);
  }

  /**
   * 获取默认收藏夹
   */
  static async getDefaultCollection(): Promise<Collection | null> {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('is_default', true)
      .single();

    if (error) {
      console.error('Error fetching default collection:', error);
      return null;
    }

    return { ...data, article_count: 0 };
  }
} 