import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Collection, CollectionInsert, CollectionUpdate } from '../types';
import { CollectionService } from '../services/collectionService';

interface CollectionsContextType {
  collections: Collection[];
  currentCollection: Collection | null;
  isLoading: boolean;
  error: string | null;
  
  // 收藏夹管理
  loadCollections: () => Promise<void>;
  createCollection: (data: CollectionInsert) => Promise<Collection>;
  updateCollection: (id: string, updates: CollectionUpdate) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  setCurrentCollection: (collection: Collection | null) => void;
  
  // 文章-收藏夹关系管理
  addArticleToCollection: (articleId: string, collectionId: string) => Promise<void>;
  removeArticleFromCollection: (articleId: string, collectionId: string) => Promise<void>;
  moveArticleToCollection: (articleId: string, fromCollectionId: string, toCollectionId: string) => Promise<void>;
  
  // 获取特定收藏夹的文章
  getArticlesByCollection: (collectionId: string) => Promise<any[]>;
  getCollectionsByArticle: (articleId: string) => Promise<Collection[]>;
  
  // 工具方法
  getDefaultCollection: () => Collection | null;
  refreshCollections: () => Promise<void>;
}

const CollectionsContext = createContext<CollectionsContextType | undefined>(undefined);

export const useCollections = () => {
  const context = useContext(CollectionsContext);
  if (!context) {
    throw new Error('useCollections must be used within a CollectionsProvider');
  }
  return context;
};

interface CollectionsProviderProps {
  children: ReactNode;
}

export const CollectionsProvider: React.FC<CollectionsProviderProps> = ({ children }) => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [currentCollection, setCurrentCollection] = useState<Collection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCollections = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await CollectionService.getCollections();
      setCollections(data);
      
      // 如果没有当前收藏夹，设置默认收藏夹
      if (!currentCollection) {
        const defaultCollection = data.find(c => c.is_default);
        if (defaultCollection) {
          setCurrentCollection(defaultCollection);
        }
      }
    } catch (error) {
      console.error('Error loading collections:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load collections';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const createCollection = async (data: CollectionInsert): Promise<Collection> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const newCollection = await CollectionService.createCollection(data);
      setCollections(prev => [...prev, newCollection]);
      return newCollection;
    } catch (error) {
      console.error('Error creating collection:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create collection';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateCollection = async (id: string, updates: CollectionUpdate): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedCollection = await CollectionService.updateCollection(id, updates);
      setCollections(prev => 
        prev.map(collection => 
          collection.id === id ? updatedCollection : collection
        )
      );
      
      // 如果更新的是当前收藏夹，也更新当前收藏夹状态
      if (currentCollection && currentCollection.id === id) {
        setCurrentCollection(updatedCollection);
      }
    } catch (error) {
      console.error('Error updating collection:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update collection';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCollection = async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await CollectionService.deleteCollection(id);
      setCollections(prev => prev.filter(collection => collection.id !== id));
      
      // 如果删除的是当前收藏夹，切换到默认收藏夹
      if (currentCollection && currentCollection.id === id) {
        const defaultCollection = collections.find(c => c.is_default && c.id !== id);
        setCurrentCollection(defaultCollection || null);
      }
    } catch (error) {
      console.error('Error deleting collection:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete collection';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const addArticleToCollection = async (articleId: string, collectionId: string): Promise<void> => {
    try {
      await CollectionService.addArticleToCollection(articleId, collectionId);
      // 刷新收藏夹列表以更新文章数量
      await refreshCollections();
    } catch (error) {
      console.error('Error adding article to collection:', error);
      throw error;
    }
  };

  const removeArticleFromCollection = async (articleId: string, collectionId: string): Promise<void> => {
    try {
      await CollectionService.removeArticleFromCollection(articleId, collectionId);
      // 刷新收藏夹列表以更新文章数量
      await refreshCollections();
    } catch (error) {
      console.error('Error removing article from collection:', error);
      throw error;
    }
  };

  const moveArticleToCollection = async (articleId: string, fromCollectionId: string, toCollectionId: string): Promise<void> => {
    try {
      await CollectionService.moveArticleToCollection(articleId, fromCollectionId, toCollectionId);
      // 刷新收藏夹列表以更新文章数量
      await refreshCollections();
    } catch (error) {
      console.error('Error moving article to collection:', error);
      throw error;
    }
  };

  const getArticlesByCollection = async (collectionId: string) => {
    return await CollectionService.getArticlesByCollection(collectionId);
  };

  const getCollectionsByArticle = async (articleId: string): Promise<Collection[]> => {
    return await CollectionService.getCollectionsByArticle(articleId);
  };

  const getDefaultCollection = (): Collection | null => {
    return collections.find(c => c.is_default) || null;
  };

  const refreshCollections = async (): Promise<void> => {
    await loadCollections();
  };

  // 初始化：加载收藏夹
  useEffect(() => {
    loadCollections();
  }, []);

  return (
    <CollectionsContext.Provider
      value={{
        collections,
        currentCollection,
        isLoading,
        error,
        loadCollections,
        createCollection,
        updateCollection,
        deleteCollection,
        setCurrentCollection,
        addArticleToCollection,
        removeArticleFromCollection,
        moveArticleToCollection,
        getArticlesByCollection,
        getCollectionsByArticle,
        getDefaultCollection,
        refreshCollections,
      }}
    >
      {children}
    </CollectionsContext.Provider>
  );
}; 