import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Article, ArticleInsert } from '../types';
import { LocalStorageService } from '../services/localStorageService';
import { ArticleService } from '../services/articleService';

interface ArticlesContextType {
  articles: Article[];
  currentArticle: Article | null;
  isLoading: boolean;
  addArticle: (url: string) => Promise<void>;
  addContent: (content: string) => Promise<void>;
  getArticleById: (id: string) => Article | undefined;
  setCurrentArticle: (article: Article | null) => void;
  markAsRead: (id: string) => Promise<void>;
  deleteArticle: (id: string) => Promise<void>;
  loadArticles: () => Promise<void>;
  storageMode: 'supabase' | 'local';
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
  const [storageMode, setStorageMode] = useState<'supabase' | 'local'>('local');

  // 智能检测存储后端并直接加载数据
  const detectStorageBackend = async (): Promise<'supabase' | 'local'> => {
    try {
      console.log('🔍 检测存储后端...');
      
      // 尝试连接 Supabase 并获取数据（忽略返回值，只测试连接）
      await ArticleService.getArticles();
      console.log('✅ Supabase 连接成功，使用云存储');
      return 'supabase';
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log('⚠️ Supabase 不可用，切换到本地存储:', errorMessage);
      return 'local';
    }
  };

  // 获取存储服务
  const getStorageService = (mode: 'supabase' | 'local') => {
    return mode === 'supabase' ? ArticleService : LocalStorageService;
  };

  // Load articles from specific storage backend
  const loadArticlesFromStorage = async (mode: 'supabase' | 'local') => {
    try {
      const service = getStorageService(mode);
      const data = await service.getArticles();
      console.log(`📚 从${mode === 'supabase' ? '云端' : '本地'}加载了 ${data.length} 篇文章`);
      setArticles(data);
      return data;
    } catch (error) {
      console.error(`Error loading articles from ${mode}:`, error);
      throw error;
    }
  };

  // 公共的 loadArticles 函数
  const loadArticles = async () => {
    setIsLoading(true);
    try {
      await loadArticlesFromStorage(storageMode);
    } catch (error) {
      console.error('Error loading articles:', error);
      
      // 如果 Supabase 失败，尝试切换到本地存储
      if (storageMode === 'supabase') {
        console.log('🔄 切换到本地存储...');
        setStorageMode('local');
        await loadArticlesFromStorage('local');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 初始化：检测存储后端并加载数据
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        // 检测存储模式
        const detectedMode = await detectStorageBackend();
        setStorageMode(detectedMode);
        
        // 直接加载对应存储的数据
        await loadArticlesFromStorage(detectedMode);
      } catch (error) {
        console.error('Initialization error:', error);
        // 如果都失败了，至少确保状态是本地模式
        setStorageMode('local');
        try {
          await loadArticlesFromStorage('local');
        } catch (localError) {
          console.error('Even local storage failed:', localError);
          setArticles([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []); // 只在组件挂载时执行一次

  const addArticle = async (url: string) => {
    setIsLoading(true);
    try {
      // 从 URL 中提取基本信息
      let title = `Article from ${new URL(url).hostname}`;
      let summary = `Summary for article from ${url}`;
      
      // 尝试检测来源
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

      const service = getStorageService(storageMode);
      const newArticle = await service.createArticle(articleData);
      
      // Add to the beginning of the array
      setArticles((prev) => [newArticle, ...prev]);
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error adding article:', error);
      
      // 如果 Supabase 失败，尝试本地存储
      if (storageMode === 'supabase') {
        console.log('🔄 添加失败，尝试本地存储...');
        setStorageMode('local');
        // 递归调用，使用本地存储重试
        return addArticle(url);
      }
      
      return Promise.reject(error);
    } finally {
      setIsLoading(false);
    }
  };

  const addContent = async (content: string) => {
    setIsLoading(true);
    try {
      // 智能提取标题，清理 HTML 标签
      let title = 'Untitled Content';
      
      // 首先尝试从 HTML 标签中提取标题
      const titleMatches = [
        content.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/i),
        content.match(/<title[^>]*>(.*?)<\/title>/i),
        content.match(/^#{1,6}\s+(.+)/m) // Markdown 标题
      ];
      
      for (const match of titleMatches) {
        if (match && match[1]) {
          title = match[1].replace(/<[^>]*>/g, '').trim();
          break;
        }
      }
      
      // 如果没有找到明确的标题标签，使用第一行并清理 HTML
      if (title === 'Untitled Content') {
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length > 0) {
          title = lines[0]
            .replace(/<[^>]*>/g, '') // 移除所有 HTML 标签
            .replace(/&[a-z]+;/gi, '') // 移除 HTML 实体
            .trim()
            .slice(0, 100); // 限制长度
          
          if (!title) {
            title = 'Untitled Content';
          }
        }
      }

      // 智能提取摘要
      let summary = 'No summary available';
      const textContent = content
        .replace(/<[^>]*>/g, ' ') // 移除 HTML 标签
        .replace(/\s+/g, ' ') // 合并空白字符
        .trim();
      
      if (textContent.length > title.length + 10) {
        // 跳过标题部分，提取后续内容作为摘要
        const summaryContent = textContent.substring(title.length).trim();
        summary = summaryContent.slice(0, 200);
        if (summaryContent.length > 200) {
          summary += '...';
        }
      }

      const articleData: ArticleInsert = {
        url: '',
        title,
        summary,
        source: 'other',
        content,
        is_read: false,
      };

      const service = getStorageService(storageMode);
      const newArticle = await service.createArticle(articleData);
      
      // Add to the beginning of the array
      setArticles((prev) => [newArticle, ...prev]);
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error adding content:', error);
      
      // 如果 Supabase 失败，尝试本地存储
      if (storageMode === 'supabase') {
        console.log('🔄 添加失败，尝试本地存储...');
        setStorageMode('local');
        // 递归调用，使用本地存储重试
        return addContent(content);
      }
      
      return Promise.reject(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getArticleById = (id: string) => {
    return articles.find((article) => article.id === id);
  };

  const markAsRead = async (id: string) => {
    try {
      // Update in storage
      const service = getStorageService(storageMode);
      await service.markAsRead(id);
      
      // Update local state
      setArticles((prev) =>
        prev.map((article) =>
          article.id === id ? { ...article, is_read: true } : article
        )
      );
      
      // Also update current article if it's the one being marked
      if (currentArticle && currentArticle.id === id) {
        setCurrentArticle({ ...currentArticle, is_read: true });
      }
    } catch (error) {
      console.error('Error marking article as read:', error);
      
      // 如果 Supabase 失败，尝试本地存储
      if (storageMode === 'supabase') {
        console.log('🔄 操作失败，切换到本地存储...');
        setStorageMode('local');
        return markAsRead(id);
      }
    }
  };

  const deleteArticle = async (id: string) => {
    setIsLoading(true);
    try {
      // Update in storage
      const service = getStorageService(storageMode);
      await service.deleteArticle(id);
      
      // Update local state
      setArticles((prev) =>
        prev.filter((article) => article.id !== id)
      );
      
      // Also update current article if it's the one being deleted
      if (currentArticle && currentArticle.id === id) {
        setCurrentArticle(null);
      }
    } catch (error) {
      console.error('Error deleting article:', error);
      
      // 如果 Supabase 失败，尝试本地存储
      if (storageMode === 'supabase') {
        console.log('🔄 操作失败，切换到本地存储...');
        setStorageMode('local');
        return deleteArticle(id);
      }
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
        addArticle,
        addContent,
        getArticleById,
        setCurrentArticle,
        markAsRead,
        deleteArticle,
        loadArticles,
        storageMode,
      }}
    >
      {children}
    </ArticlesContext.Provider>
  );
};