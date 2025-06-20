import React, { useState } from 'react';
import { Collection } from '../../types';
import { useCollections } from '../../context/CollectionsContext';
import { ChevronDown, Plus, Folder, Edit, Trash2 } from 'lucide-react';
import Button from '../ui/Button';

interface CollectionSelectorProps {
  onCreateNew?: () => void;
  showCreateButton?: boolean;
}

const CollectionSelector: React.FC<CollectionSelectorProps> = ({ 
  onCreateNew,
  showCreateButton = true 
}) => {
  const {
    collections,
    currentCollection,
    setCurrentCollection,
    deleteCollection,
    isLoading
  } = useCollections();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const handleCollectionSelect = (collection: Collection) => {
    setCurrentCollection(collection);
    setIsDropdownOpen(false);
  };

  const handleDeleteClick = (e: React.MouseEvent, collectionId: string) => {
    e.stopPropagation();
    setShowDeleteConfirm(collectionId);
  };

  const handleConfirmDelete = async (collectionId: string) => {
    try {
      await deleteCollection(collectionId);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete collection:', error);
      // 这里可以添加错误提示
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  if (isLoading && collections.length === 0) {
    return (
      <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        <span className="text-sm text-gray-600 dark:text-gray-300">加载收藏夹...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* 当前选中的收藏夹 */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center justify-between w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <span className="text-lg">{currentCollection?.icon || '📁'}</span>
          <div className="text-left">
            <p className="font-medium text-gray-900 dark:text-white">
              {currentCollection?.name || '选择收藏夹'}
            </p>
            {currentCollection?.article_count !== undefined && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {currentCollection.article_count} 篇文章
              </p>
            )}
          </div>
        </div>
        <ChevronDown 
          className={`h-4 w-4 text-gray-400 transition-transform ${
            isDropdownOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* 下拉菜单 */}
      {isDropdownOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
          <div className="py-1 max-h-60 overflow-y-auto">
            {collections.map((collection) => (
              <div key={collection.id} className="relative group">
                <div
                  className={`w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                    currentCollection?.id === collection.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  <div 
                    className="flex items-center space-x-3 flex-1"
                    onClick={() => handleCollectionSelect(collection)}
                  >
                    <span className="text-lg">{collection.icon}</span>
                    <div>
                      <p className="font-medium">{collection.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {collection.article_count || 0} 篇文章
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* 默认收藏夹标识 */}
                    {collection.is_default && (
                      <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400 px-2 py-1 rounded">
                        默认
                      </span>
                    )}
                    
                    {/* 删除按钮（非默认收藏夹） */}
                    {!collection.is_default && (
                      <span
                        onClick={(e) => handleDeleteClick(e, collection.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-700 transition-opacity cursor-pointer"
                        title="删除收藏夹"
                      >
                        <Trash2 className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* 创建新收藏夹按钮 */}
            {showCreateButton && onCreateNew && (
              <>
                <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                <button
                  onClick={() => {
                    onCreateNew();
                    setIsDropdownOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400"
                >
                  <Plus className="h-4 w-4" />
                  <span className="font-medium">创建新收藏夹</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              确认删除
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              确定要删除这个收藏夹吗？其中的文章将不会被删除。
            </p>
            <div className="flex space-x-3 justify-end">
              <Button
                variant="outline"
                onClick={handleCancelDelete}
              >
                取消
              </Button>
              <Button
                variant="primary"
                onClick={() => handleConfirmDelete(showDeleteConfirm)}
                className="bg-red-600 hover:bg-red-700"
              >
                删除
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 点击外部关闭下拉菜单 */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
};

export default CollectionSelector; 