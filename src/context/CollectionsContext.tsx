import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
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
  const [hasInitialized, setHasInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCollections = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await CollectionService.getCollections();
      setCollections(data);
      
      // 设置默认收藏夹，使用函数式更新避免依赖
      setCurrentCollection((prev) => {
        if (!prev) {
          const defaultCollection = data.find(c => c.is_default);
          return defaultCollection || null;
        }
        return prev;
      });
      setHasInitialized(true);
    } catch (error) {
      console.error('Error loading collections:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load collections';
      setError(errorMessage);
      // 不自动重试，避免429错误
    } finally {
      setIsLoading(false);
    }
  }, []); // 移除所有依赖

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
      
      // 使用函数式更新来同时处理 collections 和 currentCollection
      setCollections(prev => {
        const newCollections = prev.filter(collection => collection.id !== id);
        
        // 如果删除的是当前收藏夹，需要更新 currentCollection
        if (currentCollection && currentCollection.id === id) {
          const defaultCollection = newCollections.find(c => c.is_default);
          // 异步更新 currentCollection
          setTimeout(() => {
            setCurrentCollection(defaultCollection || null);
          }, 0);
        }
        
        return newCollections;
      });
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

  const getArticlesByCollection = useCallback(async (collectionId: string) => {
    return await CollectionService.getArticlesByCollection(collectionId);
  }, []);

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
    if (!hasInitialized) {
      console.log('Initializing collections...');
      loadCollections();
    }
  }, []); // 只在组件挂载时执行

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