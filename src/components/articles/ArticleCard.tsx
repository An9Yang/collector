import React from 'react';
import { Article } from '../../types';
import { getSourceColor, getSourceName } from '../../utils/sourceUtils';
import { formatDistance } from 'date-fns';

interface ArticleCardProps {
  article: Article;
  onClick: (id: string) => void;
  index: number;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onClick, index }) => {
  const sourceColor = getSourceColor(article.source);
  const sourceName = getSourceName(article.source);
  
  // Calculate time ago
  const timeAgo = formatDistance(new Date(article.createdAt), new Date(), { addSuffix: true });
  
  // Calculate tilt angle based on index
  const tiltAngle = index % 2 === 0 ? '1deg' : '-1deg';
  
  return (
    <div 
      className="mb-8 transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl cursor-pointer"
      style={{ 
        transform: `rotate(${tiltAngle})`,
        transformOrigin: 'center bottom'
      }}
      onClick={() => onClick(article.id)}
    >
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        {/* Source indicator */}
        <div className={`absolute top-0 right-0 w-2 h-2 m-2 rounded-full ${sourceColor} ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 ${sourceColor.replace('bg-', 'ring-')}`}></div>
        
        {/* Card content */}
        <div className="flex flex-col h-full">
          {/* Cover image */}
          {article.coverImage && (
            <div className="relative h-40 md:h-48 overflow-hidden">
              <img 
                src={article.coverImage} 
                alt={article.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-4">
                <span className={`inline-block px-2 py-1 text-xs font-medium text-white rounded ${sourceColor}`}>
                  {sourceName}
                </span>
              </div>
            </div>
          )}
          
          {/* Content */}
          <div className="p-5">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
              {article.title}
              {article.isRead && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                  Read
                </span>
              )}
            </h3>
            
            <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3 mb-3">
              {article.summary}
            </p>
            
            <div className="mt-auto flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <span>{timeAgo}</span>
              </div>
              
              <span className="text-blue-600 dark:text-blue-400 font-medium">Read article →</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleCard;