import React, { useEffect, useState, useRef } from 'react';
import { Article } from '../../types';
import { getSourceColor, getSourceName } from '../../utils/sourceUtils';
import { ArrowLeft, Copy, Share2 } from 'lucide-react';
import Button from '../ui/Button';
import DOMPurify from 'dompurify';

interface ArticleViewProps {
  article: Article;
  onBack: () => void;
  onMarkAsRead: (id: string) => void;
}

const ArticleView: React.FC<ArticleViewProps> = ({ article, onBack, onMarkAsRead }) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);
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
      if (currentProgress > 0.8 && !article.isRead) {
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
  }, [article.id, article.isRead, onMarkAsRead]);
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(article.url);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };
  
  const sanitizedContent = article.content ? DOMPurify.sanitize(article.content) : '';
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCopyLink}
              className="transition-all"
            >
              {copySuccess ? 'Copied!' : (
                <>
                  <Copy size={16} className="mr-1" />
                  Copy Link
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: article.title,
                    text: article.summary,
                    url: article.url,
                  });
                }
              }}
              className={!navigator.share ? 'hidden' : ''}
            >
              <Share2 size={16} className="mr-1" />
              Share
            </Button>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="h-1 bg-gray-200 dark:bg-gray-800">
          <div 
            className={`h-full ${sourceColor} transition-all duration-200`}
            style={{ width: `${scrollProgress * 100}%` }}
          ></div>
        </div>
      </div>
      
      {/* Article content */}
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
          {article.coverImage && (
            <div className="mb-8">
              <img 
                src={article.coverImage} 
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
    </div>
  );
};

export default ArticleView;