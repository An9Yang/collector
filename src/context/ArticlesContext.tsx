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
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
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
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication state on load
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUser({ id: data.user.id });
        setIsAuthenticated(true);
        fetchArticles(data.user.id);
      }
    };
    
    getUser();
    
    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser({ id: session.user.id });
          setIsAuthenticated(true);
          fetchArticles(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsAuthenticated(false);
          setArticles([]);
        }
      }
    );
    
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);
  
  const fetchArticles = async (userId: string) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('user_id', userId)
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

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      if (data.user) {
        setUser({ id: data.user.id });
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const signUp = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });
      
      if (error) throw error;
      
      if (data.user) {
        // User is created but might need email confirmation
        // depending on Supabase settings
        return;
      }
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const signOut = async () => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setIsAuthenticated(false);
      setArticles([]);
      setCurrentArticle(null);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addArticle = async (url: string) => {
    if (!user) {
      throw new Error('User must be authenticated to add articles');
    }
    
    setIsLoading(true);
    
    try {
      // For now, we'll generate a mock article based on the URL
      // In a production app, you would fetch metadata from the URL
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
          user_id: user.id
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
    if (!user) {
      throw new Error('User must be authenticated to add content');
    }
    
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
          user_id: user.id
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
    if (!user) return;
    
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
        .eq('id', id)
        .eq('user_id', user.id);
        
      if (error) throw error;
    } catch (error) {
      console.error('Error marking article as read:', error);
      // Revert the local state if the update fails
      fetchArticles(user.id);
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
        signIn,
        signUp,
        signOut,
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