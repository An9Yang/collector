import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Article } from '../types';
import { getMockArticles, generateMockArticle, generateMockArticleFromContent } from '../utils/mockData';

interface ArticlesContextType {
  articles: Article[];
  currentArticle: Article | null;
  isLoading: boolean;
  addArticle: (url: string) => Promise<void>;
  addContent: (content: string) => Promise<void>;
  getArticleById: (id: string) => Article | undefined;
  setCurrentArticle: (article: Article | null) => void;
  markAsRead: (id: string) => void;
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

  // Load initial data
  useEffect(() => {
    setArticles(getMockArticles());
  }, []);

  const addArticle = async (url: string) => {
    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Generate a mock article
      const newArticle = generateMockArticle(url);
      
      // Add to the beginning of the array
      setArticles((prev) => [newArticle, ...prev]);
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error adding article:', error);
      return Promise.reject(error);
    } finally {
      setIsLoading(false);
    }
  };

  const addContent = async (content: string) => {
    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Generate a mock article from content
      const newArticle = generateMockArticleFromContent(content);
      
      // Add to the beginning of the array
      setArticles((prev) => [newArticle, ...prev]);
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error adding content:', error);
      return Promise.reject(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getArticleById = (id: string) => {
    return articles.find((article) => article.id === id);
  };

  const markAsRead = (id: string) => {
    setArticles((prev) =>
      prev.map((article) =>
        article.id === id ? { ...article, isRead: true } : article
      )
    );
    
    // Also update current article if it's the one being marked
    if (currentArticle && currentArticle.id === id) {
      setCurrentArticle({ ...currentArticle, isRead: true });
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
      }}
    >
      {children}
    </ArticlesContext.Provider>
  );
};