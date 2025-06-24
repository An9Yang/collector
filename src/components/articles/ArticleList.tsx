import React from 'react';
import { Article } from '../../types';
import ArticleCard from './ArticleCard';
import { Pagination } from '../common/Pagination';
import SkeletonLoader from '../common/SkeletonLoader';
import { AnimatePresence, motion } from 'framer-motion';

interface ArticleListProps {
  articles: Article[];
  onArticleClick: (id: string) => void;
  onDeleteArticle: (id: string) => void;
  pagination?: {
    page: number;
    totalPages: number;
    total: number;
  };
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
}

const ArticleList: React.FC<ArticleListProps> = ({ 
  articles, 
  onArticleClick, 
  onDeleteArticle,
  pagination,
  onPageChange,
  isLoading = false
}) => {
  // Show skeleton loader when loading
  if (isLoading && articles.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pt-2 sm:pt-4">
        <SkeletonLoader type="card" count={6} />
      </div>
    );
  }
  
  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">No saved articles yet</h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
          Add your first link by clicking the "Add Link" button above.
        </p>
      </div>
    );
  }

  return (
    <>
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pt-2 sm:pt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            // Show skeleton while loading new page
            <SkeletonLoader type="card" count={6} />
          ) : (
            articles.map((article, index) => (
              <ArticleCard 
                key={article.id} 
                article={article} 
                onClick={onArticleClick}
                onDelete={onDeleteArticle}
                index={index}
              />
            ))
          )}
        </AnimatePresence>
      </motion.div>
      {pagination && onPageChange && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={onPageChange}
          isLoading={isLoading}
        />
      )}
    </>
  );
};

export default ArticleList;