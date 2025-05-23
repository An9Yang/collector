import React, { useState } from 'react';
import { Article } from '../../types';
import { getSourceColor, getSourceName } from '../../utils/sourceUtils';
import { formatDistance } from 'date-fns';
import { Trash2 } from 'lucide-react';

interface ArticleCardProps {
  article: Article;
  onClick: (id: string) => void;
  onDelete: (id: string) => void;
  index: number;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onClick, onDelete, index }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const sourceColor = getSourceColor(article.source);
  const sourceName = getSourceName(article.source);
  
  // Calculate time ago
  const timeAgo = formatDistance(new Date(article.created_at), new Date(), { addSuffix: true });
  
  // Calculate tilt angle based on index
  const tiltAngle = index % 2 === 0 ? '1deg' : '-1deg';

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 防止触发卡片点击
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(article.id);
    setShowDeleteConfirm(false);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };
  
  return (
    <div 
      className="mb-8 transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl cursor-pointer relative group"
      style={{ 
        transform: `rotate(${tiltAngle})`,
        transformOrigin: 'center bottom'
      }}
      onClick={() => onClick(article.id)}
    >
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        {/* Source indicator */}
        <div className={`absolute top-0 right-0 w-2 h-2 m-2 rounded-full ${sourceColor} ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 ${sourceColor.replace('bg-', 'ring-')}`}></div>
        
        {/* Delete button */}
        <button
          onClick={handleDeleteClick}
          className="absolute top-2 left-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
          title="删除文章"
        >
          <Trash2 size={14} />
        </button>

        {/* Card content */}
        <div className="p-4">
          {/* Time and read status */}
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
            <span>{timeAgo}</span>
            {!article.is_read && (
              <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs">新</span>
            )}
          </div>
          
          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
            {article.title}
          </h3>
          
          {/* Summary */}
          <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3 mb-3">
            {article.summary}
          </p>
          
          {/* Source tag */}
          <div className="flex items-center justify-between">
            <span className={`inline-block px-2 py-1 text-xs font-medium text-white rounded ${sourceColor}`}>
              {sourceName}
            </span>
          </div>
        </div>
      </div>

      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <div 
          className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center z-20"
          onClick={handleCancelDelete}
        >
          <div 
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg max-w-xs mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              确认删除
            </h4>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
              您确定要删除这篇文章吗？此操作无法撤销。
            </p>
            <div className="flex space-x-2">
              <button
                onClick={handleCancelDelete}
                className="flex-1 px-3 py-2 text-sm bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                取消
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-3 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleCard;