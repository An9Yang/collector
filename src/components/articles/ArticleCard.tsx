import React, { useState } from 'react';
import { Article } from '../../types';
import { getSourceColor, getSourceName } from '../../utils/sourceUtils';
import { formatDistance } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

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
  
  // Check if device is mobile (simplified check)
  const [isMobile, setIsMobile] = useState(false);
  
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    <motion.div 
      className="mb-4 lg:mb-8 cursor-pointer relative group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ 
        duration: 0.3,
        delay: index * 0.05, // Stagger animation
        ease: "easeOut"
      }}
      whileHover={!isMobile ? { 
        y: -8,
        scale: 1.02,
        rotate: tiltAngle,
        transition: { duration: 0.2 }
      } : {}}
      whileTap={{ scale: 0.98 }}
      style={{ 
        transformOrigin: 'center bottom'
      }}
      onClick={() => onClick(article.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(article.id);
        }
      }}
      tabIndex={0}
      role="article"
      aria-label={`文章: ${article.title}. ${article.is_read ? '已读' : '新文章'}. 来源: ${sourceName}. ${timeAgo}`}
    >
      <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2">
        {/* Gradient accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-80"></div>
        
        {/* Source indicator with glow effect */}
        <div className={`absolute top-3 right-3 w-3 h-3 rounded-full ${sourceColor} shadow-lg animate-pulse`}>
          <div className={`absolute inset-0 rounded-full ${sourceColor} blur-md opacity-50`}></div>
        </div>
        
        {/* Delete button - always visible on mobile */}
        <button
          onClick={handleDeleteClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              handleDeleteClick(e as unknown as React.MouseEvent);
            }
          }}
          className="absolute top-2 left-2 p-2 lg:p-1.5 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-full opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus:opacity-100 transition-opacity duration-200 z-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
          title="删除文章"
          aria-label={`删除文章: ${article.title}`}
          tabIndex={0}
        >
          <Trash2 size={16} className="lg:w-3.5 lg:h-3.5" />
        </button>

        {/* Card content - optimized spacing for mobile */}
        <div className="p-3 sm:p-4">
          {/* Time and read status */}
          <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3">
            <span className="truncate mr-2 flex items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 mr-1.5"></div>
              {timeAgo}
            </span>
            {!article.is_read && (
              <motion.span 
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap shadow-sm"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
              >
                新
              </motion.span>
            )}
          </div>
          
          {/* Title - adjusted for mobile readability */}
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-1.5 sm:mb-2 line-clamp-2" id={`article-title-${article.id}`}>
            {article.title}
          </h3>
          
          {/* Summary - show less on mobile */}
          <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 sm:line-clamp-3 mb-2 sm:mb-3">
            {article.summary}
          </p>
          
          {/* Source tag and actions */}
          <div className="flex items-center justify-between mt-3">
            <motion.span 
              className={`inline-flex items-center px-3 py-1 text-xs font-medium text-white rounded-md ${sourceColor} shadow-sm`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label={`来源: ${sourceName}`}
            >
              <div className="w-1.5 h-1.5 bg-white/50 rounded-full mr-1.5" aria-hidden="true"></div>
              {sourceName}
            </motion.span>
            
            {/* Read indicator */}
            {article.is_read && (
              <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center" role="status" aria-label="已读文章">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                已读
              </span>
            )}
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
    </motion.div>
  );
};

export default ArticleCard;