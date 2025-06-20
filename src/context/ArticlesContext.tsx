import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Article, ArticleInsert } from '../types';
import { ArticleService } from '../services/articleService';
import { testSupabaseConnection } from '../config/supabase';

interface ArticlesContextType {
  articles: Article[];
  currentArticle: Article | null;
  isLoading: boolean;
  connectionError: string | null;
  addArticle: (url: string, collectionId?: string) => Promise<void>;
  addContent: (content: string, collectionId?: string) => Promise<void>;
  getArticleById: (id: string) => Article | undefined;
  setCurrentArticle: (article: Article | null) => void;
  markAsRead: (id: string) => Promise<void>;
  deleteArticle: (id: string) => Promise<void>;
  loadArticles: () => Promise<void>;
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
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const loadArticles = async () => {
    setIsLoading(true);
    setConnectionError(null);
    
    try {
      // First test the connection
      const connectionOk = await testSupabaseConnection();
      if (!connectionOk) {
        throw new Error('Unable to connect to the database. Please check your internet connection.');
      }

      const data = await ArticleService.getArticles();
      console.log(`📚 从 Supabase 加载了 ${data.length} 篇文章`);
      setArticles(data);
    } catch (error) {
      console.error('Error loading articles from Supabase:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setConnectionError(errorMessage);
      setArticles([]); // 加载失败则设置为空数组
    } finally {
      setIsLoading(false);
    }
  };

  const retryConnection = async () => {
    await loadArticles();
  };

  // 初始化：直接从 Supabase 加载数据
  useEffect(() => {
    loadArticles();
  }, []); // 只在组件挂载时执行一次

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
      // 刷新文章列表以获取最新数据
      await loadArticles();
    } catch (error) {
      console.error('Error adding article to Supabase:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add article';
      setConnectionError(errorMessage);
      throw error; // 重新抛出错误，让调用者处理
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
            .slice(0, 100);
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
        summary = summaryContent.slice(0, 200);
        if (summaryContent.length > 200) summary += '...';
      }

      const articleData: ArticleInsert = {
        url: '',
        title,
        summary,
        source: 'other',
        content,
        is_read: false,
      };

      await ArticleService.createArticle(articleData, collectionId);
      // 刷新文章列表以获取最新数据
      await loadArticles();
    } catch (error) {
      console.error('Error adding content to Supabase:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add content';
      setConnectionError(errorMessage);
      throw error; // 重新抛出错误
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
      console.error('Error marking article as read in Supabase:', error);
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
      setArticles((prev) => prev.filter((article) => article.id !== id));
      if (currentArticle && currentArticle.id === id) {
        setCurrentArticle(null);
      }
    } catch (error) {
      console.error('Error deleting article from Supabase:', error);
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