import React, { useEffect, useState, useRef } from 'react';
import { Article } from '../../types';
import { getSourceColor, getSourceName } from '../../utils/sourceUtils';
import { ArrowLeft, Copy, Share2, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import DOMPurify from 'dompurify';

interface ArticleViewProps {
  article: Article;
  onBack: () => void;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

const ArticleView: React.FC<ArticleViewProps> = ({ article, onBack, onMarkAsRead, onDelete }) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const sourceColor = getSourceColor(article.source);
  const sourceName = getSourceName(article.source);

  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      
      const scrollHeight = contentRef.current.scrollHeight - contentRef.current.clientHeight;
      const currentProgress = contentRef.current.scrollTop / scrollHeight;
      setScrollProgress(Math.min(currentProgress, 1));
      
      // Mark as read when scrolled more than 80%
      if (currentProgress > 0.8 && !article.is_read) {
        onMarkAsRead(article.id);
      }
    };
    
    const contentElement = contentRef.current;
    if (contentElement) {
      contentElement.addEventListener('scroll', handleScroll);
    }
    
    return () => {
      if (contentElement) {
        contentElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, [article.id, article.is_read, onMarkAsRead]);
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(article.url);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    onDelete(article.id);
    onBack(); // 删除后返回列表
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };
  
  const sanitizedContent = article.content ? DOMPurify.sanitize(article.content) : '';

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      {/* Progress bar */}
      <div className="h-1 bg-gray-200 dark:bg-gray-700">
        <div 
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${scrollProgress * 100}%` }}
        ></div>
      </div>
      
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft size={20} />
          </Button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate max-w-md">
            {article.title}
          </h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handleCopyLink}
            disabled={!article.url}
            className={copySuccess ? 'text-green-600' : ''}
          >
            <Copy size={18} />
            {copySuccess ? 'Copied!' : 'Copy Link'}
          </Button>
          
          <Button variant="outline">
            <Share2 size={18} />
            Share
          </Button>

          <Button 
            variant="outline" 
            onClick={handleDeleteClick}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 size={18} />
            删除
          </Button>
        </div>
      </header>

      <div 
        ref={contentRef}
        className="flex-1 overflow-y-auto px-4 pb-12"
      >
        <div className="container mx-auto py-8 max-w-3xl">
          {/* Source badge */}
          <div className="mb-4">
            <span className={`inline-block px-3 py-1 text-sm font-medium text-white rounded-full ${sourceColor}`}>
              {sourceName}
            </span>
          </div>
          
          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            {article.title}
          </h1>
          
          {/* Summary */}
          <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-blue-500">
            <p className="text-gray-700 dark:text-gray-300 italic text-lg">
              {article.summary}
            </p>
          </div>
          
          {/* Cover image */}
          {article.cover_image && (
            <div className="mb-8">
              <img 
                src={article.cover_image} 
                alt={article.title} 
                className="w-full h-auto rounded-lg shadow-md"
              />
            </div>
          )}
          
          {/* Content */}
          <div 
            className="prose prose-lg max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          ></div>
          
          {/* Original source link */}
          <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">
              Originally from: <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">{article.url}</a>
            </p>
          </div>
        </div>
      </div>

      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md mx-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              确认删除文章
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              您确定要删除 "<strong>{article.title}</strong>" 吗？此操作无法撤销。
            </p>
            <div className="flex space-x-4">
              <Button
                variant="outline"
                onClick={handleCancelDelete}
                className="flex-1"
              >
                取消
              </Button>
              <Button
                onClick={handleConfirmDelete}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              >
                确认删除
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleView;