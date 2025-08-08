import { createClient } from '@supabase/supabase-js';
import type { Article, ArticleInsert, ArticleUpdate, Collection, CollectionInsert, CollectionUpdate } from '../types';

// Supabase客户端
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export class SupabaseService {
  // ========== Articles ==========
  
  static async getArticles(params: any = {}) {
    const { page = 1, limit = 20, sortBy = 'created_at', order = 'desc' } = params;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('articles')
      .select('*', { count: 'exact' })
      .order(sortBy, { ascending: order === 'asc' })
      .range(from, to);

    if (params.source) {
      query = query.eq('source', params.source);
    }
    if (params.is_read !== undefined) {
      query = query.eq('is_read', params.is_read);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };
  }

  static async getArticle(id: string): Promise<Article | null> {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async createArticle(articleData: ArticleInsert & { collection_ids?: string[] }): Promise<Article> {
    const { collection_ids, ...articleInsert } = articleData;
    
    // 创建文章
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .insert(articleInsert)
      .select()
      .single();

    if (articleError) throw articleError;

    // 如果有收藏夹ID，添加关联
    if (collection_ids && collection_ids.length > 0) {
      const relations = collection_ids.map(collectionId => ({
        article_id: article.id,
        collection_id: collectionId
      }));

      const { error: relationError } = await supabase
        .from('article_collections')
        .insert(relations);

      if (relationError) throw relationError;
    }

    return article;
  }

  static async updateArticle(id: string, updates: ArticleUpdate): Promise<Article> {
    const { data, error } = await supabase
      .from('articles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteArticle(id: string): Promise<void> {
    // 先删除所有关联关系
    await supabase
      .from('article_collections')
      .delete()
      .eq('article_id', id);

    // 再删除文章
    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // ========== Collections ==========

  static async getCollections(): Promise<Collection[]> {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 计算每个收藏夹的文章数量
    const collectionsWithCount = await Promise.all(
      (data || []).map(async (collection) => {
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

  static async getCollection(id: string): Promise<Collection | null> {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    // 获取文章数量
    const { count } = await supabase
      .from('article_collections')
      .select('*', { count: 'exact', head: true })
      .eq('collection_id', id);

    return {
      ...data,
      article_count: count || 0
    };
  }

  static async createCollection(collectionData: CollectionInsert): Promise<Collection> {
    const { data, error } = await supabase
      .from('collections')
      .insert(collectionData)
      .select()
      .single();

    if (error) throw error;
    return { ...data, article_count: 0 };
  }

  static async updateCollection(id: string, updates: CollectionUpdate): Promise<Collection> {
    const { data, error } = await supabase
      .from('collections')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // 获取更新后的文章数量
    const { count } = await supabase
      .from('article_collections')
      .select('*', { count: 'exact', head: true })
      .eq('collection_id', id);

    return {
      ...data,
      article_count: count || 0
    };
  }

  static async deleteCollection(id: string): Promise<void> {
    // 先删除所有关联关系
    await supabase
      .from('article_collections')
      .delete()
      .eq('collection_id', id);

    // 再删除收藏夹
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async getDefaultCollection(): Promise<Collection | null> {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('is_default', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 means no rows found
    
    if (!data) return null;

    // 获取文章数量
    const { count } = await supabase
      .from('article_collections')
      .select('*', { count: 'exact', head: true })
      .eq('collection_id', data.id);

    return {
      ...data,
      article_count: count || 0
    };
  }

  // ========== Article-Collection Relations ==========

  static async addArticleToCollection(articleId: string, collectionId: string): Promise<void> {
    const { error } = await supabase
      .from('article_collections')
      .insert({ article_id: articleId, collection_id: collectionId });

    if (error && error.code !== '23505') throw error; // 23505 is unique violation (already exists)
  }

  static async removeArticleFromCollection(articleId: string, collectionId: string): Promise<void> {
    const { error } = await supabase
      .from('article_collections')
      .delete()
      .eq('article_id', articleId)
      .eq('collection_id', collectionId);

    if (error) throw error;
  }

  static async getArticlesByCollection(collectionId: string): Promise<Article[]> {
    const { data, error } = await supabase
      .from('article_collections')
      .select(`
        articles (*)
      `)
      .eq('collection_id', collectionId);

    if (error) throw error;

    // 获取文章后，按文章的created_at排序
    const articles = (data || []).map(item => item.articles).filter(Boolean).flat();
    return articles.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA; // 降序排序（最新的在前）
    });
  }

  static async getCollectionsByArticle(articleId: string): Promise<Collection[]> {
    const { data, error } = await supabase
      .from('article_collections')
      .select(`
        collections (*)
      `)
      .eq('article_id', articleId);

    if (error) throw error;

    return (data || []).map(item => item.collections).filter(Boolean).flat();
  }

  static async moveArticleToCollection(
    articleId: string,
    fromCollectionId: string,
    toCollectionId: string
  ): Promise<void> {
    // 删除旧关联
    await this.removeArticleFromCollection(articleId, fromCollectionId);
    // 添加新关联
    await this.addArticleToCollection(articleId, toCollectionId);
  }

  // ========== Tags ==========

  static async getArticlesByTag(tag: string): Promise<{ tag: string; articles: Article[] }> {
    // 使用全文搜索或者JSON包含查询
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .contains('tags', [tag]);

    if (error) throw error;

    return {
      tag,
      articles: data || []
    };
  }

  static async getAllTags(): Promise<{ tag: string; count: number }[]> {
    const { data, error } = await supabase
      .from('articles')
      .select('tags');

    if (error) throw error;

    // 统计所有标签
    const tagCount = new Map<string, number>();
    (data || []).forEach(article => {
      if (article.tags && Array.isArray(article.tags)) {
        article.tags.forEach((tag: string) => {
          tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
        });
      }
    });

    return Array.from(tagCount.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }
}