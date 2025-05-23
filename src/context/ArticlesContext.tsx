import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Article } from '../types';
import { getMockArticles, generateMockArticle, generateMockArticleFromContent } from '../utils/mockData';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

interface ArticlesContextType {
  articles: Article[];
  currentArticle: Article | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  user: { id: string } | null;
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

// Use a fixed ID for all operations - since we're removing auth
const GUEST_USER_ID = '00000000-0000-0000-0000-000000000000';

export const ArticlesProvider: React.FC<ArticlesProviderProps> = ({ children }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // Always set authenticated to true and use a fixed user ID
  const [user] = useState<{ id: string }>({ id: GUEST_USER_ID });
  const [isAuthenticated] = useState(true);

  // Load articles on initial load
  useEffect(() => {
    fetchArticles();
  }, []);
  
  const fetchArticles = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      if (data) {
        // Transform Supabase data to match our application model
        const transformedArticles: Article[] = data.map(article => ({
          id: article.id,
          url: article.url,
          title: article.title,
          summary: article.summary,
          source: article.source,
          createdAt: article.created_at,
          isRead: article.is_read,
          content: article.content || undefined,
          coverImage: article.cover_image || undefined
        }));
        
        setArticles(transformedArticles);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
      // Fallback to mock data for development purposes
      if (process.env.NODE_ENV === 'development') {
        setArticles(getMockArticles());
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addArticle = async (url: string) => {
    setIsLoading(true);
    
    try {
      // Generate a mock article based on the URL
      const mockArticle = generateMockArticle(url);
      
      // Insert into Supabase
      const { data, error } = await supabase
        .from('articles')
        .insert({
          id: uuidv4(),
          url: mockArticle.url,
          title: mockArticle.title,
          summary: mockArticle.summary,
          source: mockArticle.source,
          created_at: new Date().toISOString(),
          is_read: false,
          content: mockArticle.content || null,
          cover_image: mockArticle.coverImage || null,
          user_id: GUEST_USER_ID
        })
        .select()
        .single();
        
      if (error) throw error;
      
      if (data) {
        // Add the newly created article to the state
        const newArticle: Article = {
          id: data.id,
          url: data.url,
          title: data.title,
          summary: data.summary,
          source: data.source,
          createdAt: data.created_at,
          isRead: data.is_read,
          content: data.content || undefined,
          coverImage: data.cover_image || undefined
        };
        
        setArticles(prev => [newArticle, ...prev]);
      }
    } catch (error) {
      console.error('Error adding article:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const addContent = async (content: string) => {
    setIsLoading(true);
    
    try {
      const mockArticle = generateMockArticleFromContent(content);
      
      // Insert into Supabase
      const { data, error } = await supabase
        .from('articles')
        .insert({
          id: uuidv4(),
          url: mockArticle.url || 'direct-content', // Use a placeholder for direct content
          title: mockArticle.title,
          summary: mockArticle.summary,
          source: 'other', // For pasted content
          created_at: new Date().toISOString(),
          is_read: false,
          content: mockArticle.content || null,
          cover_image: mockArticle.coverImage || null,
          user_id: GUEST_USER_ID
        })
        .select()
        .single();
        
      if (error) throw error;
      
      if (data) {
        // Add the newly created article to the state
        const newArticle: Article = {
          id: data.id,
          url: data.url,
          title: data.title,
          summary: data.summary,
          source: data.source,
          createdAt: data.created_at,
          isRead: data.is_read,
          content: data.content || undefined,
          coverImage: data.cover_image || undefined
        };
        
        setArticles(prev => [newArticle, ...prev]);
      }
    } catch (error) {
      console.error('Error adding content:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getArticleById = (id: string) => {
    return articles.find((article) => article.id === id);
  };

  const markAsRead = async (id: string) => {
    // Update locally first for immediate UI feedback
    setArticles(prev =>
      prev.map(article =>
        article.id === id ? { ...article, isRead: true } : article
      )
    );
    
    // Also update current article if it's the one being marked
    if (currentArticle && currentArticle.id === id) {
      setCurrentArticle({ ...currentArticle, isRead: true });
    }
    
    // Update in Supabase
    try {
      const { error } = await supabase
        .from('articles')
        .update({ is_read: true })
        .eq('id', id);
        
      if (error) throw error;
    } catch (error) {
      console.error('Error marking article as read:', error);
      // Revert the local state if the update fails
      fetchArticles();
    }
  };

  return (
    <ArticlesContext.Provider
      value={{
        articles,
        currentArticle,
        isLoading,
        isAuthenticated,
        user,
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