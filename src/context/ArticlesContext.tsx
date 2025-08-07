import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Article, ArticleInsert } from '../types';
import { ArticleService } from '../services/articleService';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ArticlesContextType {
  articles: Article[];
  currentArticle: Article | null;
  isLoading: boolean;
  connectionError: string | null;
  pagination: PaginationInfo;
  addArticle: (url: string, collectionId?: string) => Promise<void>;
  addContent: (content: string, collectionId?: string) => Promise<void>;
  getArticleById: (id: string) => Article | undefined;
  setCurrentArticle: (article: Article | null) => void;
  markAsRead: (id: string) => Promise<void>;
  deleteArticle: (id: string) => Promise<void>;
  loadArticles: (page?: number) => Promise<void>;
  retryConnection: () => Promise<void>;
}

const ArticlesContext = createContext<ArticlesContextType | undefined>(undefined);

export const useArticles = () => {
  const context = useContext(ArticlesContext);
  if (!context) {
    throw new Error('useArticles must be used within an ArticlesProvider');
  }
  return context;
};

interface ArticlesProviderProps {
  children: ReactNode;
}

export const ArticlesProvider: React.FC<ArticlesProviderProps> = ({ children }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  const loadArticles = useCallback(async (page = 1) => {
    setIsLoading(true);
    setConnectionError(null);
    
    try {
      const result = await ArticleService.getArticles({
        page,
        limit: 20,  // 使用固定值避免依赖问题
        sortBy: 'created_at',
        order: 'desc'
      });
      
      console.log(`📚 从服务器加载了 ${result.data.length} 篇文章（第 ${page} 页）`);
      setArticles(result.data);
      setPagination(result.pagination);
      setHasInitialized(true);
    } catch (error) {
      console.error('Error loading articles from server:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setConnectionError(errorMessage);
      setArticles([]);
      // 不自动重试，避免429错误
    } finally {
      setIsLoading(false);
    }
  }, []); // 移除所有依赖，避免循环

  const retryConnection = useCallback(async () => {
    await loadArticles(1); // 重试时总是从第一页开始
  }, [loadArticles]);

  // 初始化：加载第一页数据
  useEffect(() => {
    if (!hasInitialized) {
      console.log('Initializing articles...');
      loadArticles();
    }
  }, []); // 只在组件挂载时执行

  const addArticle = async (url: string, collectionId?: string) => {
    setIsLoading(true);
    setConnectionError(null);
    
    try {
      let title = `Article from ${new URL(url).hostname}`;
      let summary = `Summary for article from ${url}`;
      let source: 'wechat' | 'linkedin' | 'reddit' | 'other' = 'other';
      const hostname = new URL(url).hostname.toLowerCase();
      
      if (hostname.includes('linkedin')) {
        source = 'linkedin';
        title = 'LinkedIn Article';
      } else if (hostname.includes('reddit')) {
        source = 'reddit';
        title = 'Reddit Post';
      } else if (hostname.includes('weixin') || hostname.includes('mp.weixin')) {
        source = 'wechat';
        title = 'WeChat Article';
      }

      const articleData: ArticleInsert = {
        url,
        title,
        summary,
        source,
        content: '',
        is_read: false,
      };

      await ArticleService.createArticle(articleData, collectionId);
      // 刷新当前页
      await loadArticles(pagination.page);
    } catch (error) {
      console.error('Error adding article:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add article';
      setConnectionError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const addContent = async (content: string, collectionId?: string) => {
    setIsLoading(true);
    setConnectionError(null);
    
    try {
      let title = 'Untitled Content';
      const titleMatches = [
        content.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/i),
        content.match(/<title[^>]*>(.*?)<\/title>/i),
        content.match(/^#{1,6}\s+(.+)/m)
      ];
      for (const match of titleMatches) {
        if (match && match[1]) {
          title = match[1].replace(/<[^>]*>/g, '').trim();
          break;
        }
      }
      if (title === 'Untitled Content') {
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length > 0) {
          title = lines[0]
            .replace(/<[^>]*>/g, '')
            .replace(/&[a-z]+;/gi, '')
            .trim()
            .slice(0, 200);
          if (!title) title = 'Untitled Content';
        }
      }

      let summary = 'No summary available';
      const textContent = content
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (textContent.length > title.length + 10) {
        const summaryContent = textContent.substring(title.length).trim();
        summary = summaryContent.slice(0, 500);
        if (summaryContent.length > 500) summary += '...';
      }

      const articleData: ArticleInsert = {
        url: `local://content/${Date.now()}`,
        title,
        summary,
        source: 'other',
        content,
        is_read: false,
      };

      await ArticleService.createArticle(articleData, collectionId);
      // 刷新当前页
      await loadArticles(pagination.page);
    } catch (error) {
      console.error('Error adding content:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add content';
      setConnectionError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getArticleById = (id: string) => {
    return articles.find((article) => article.id === id);
  };

  const markAsRead = async (id: string) => {
    setIsLoading(true);
    setConnectionError(null);
    
    try {
      await ArticleService.markAsRead(id);
      setArticles((prev) =>
        prev.map((article) =>
          article.id === id ? { ...article, is_read: true } : article
        )
      );
      if (currentArticle && currentArticle.id === id) {
        setCurrentArticle({ ...currentArticle, is_read: true });
      }
    } catch (error) {
      console.error('Error marking article as read:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark as read';
      setConnectionError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteArticle = async (id: string) => {
    setIsLoading(true);
    setConnectionError(null);
    
    try {
      await ArticleService.deleteArticle(id);
      
      // 使用函数式更新来检查删除后的状态
      setArticles((prev) => {
        const newArticles = prev.filter((article) => article.id !== id);
        
        // 如果删除后当前页没有数据了，且不是第一页，则加载上一页
        if (newArticles.length === 0 && pagination.page > 1) {
          // 异步加载上一页
          setTimeout(() => {
            loadArticles(pagination.page - 1);
          }, 0);
        }
        
        return newArticles;
      });
      
      if (currentArticle && currentArticle.id === id) {
        setCurrentArticle(null);
      }
    } catch (error) {
      console.error('Error deleting article:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete article';
      setConnectionError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ArticlesContext.Provider
      value={{
        articles,
        currentArticle,
        isLoading,
        connectionError,
        pagination,
        addArticle,
        addContent,
        getArticleById,
        setCurrentArticle,
        markAsRead,
        deleteArticle,
        loadArticles,
        retryConnection,
      }}
    >
      {children}
    </ArticlesContext.Provider>
  );
};