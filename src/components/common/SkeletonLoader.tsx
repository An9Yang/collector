import React from 'react';

interface SkeletonLoaderProps {
  type?: 'card' | 'list' | 'article';
  count?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ type = 'card', count = 1 }) => {
  const renderCardSkeleton = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden animate-pulse">
      <div className="p-3 sm:p-4">
        {/* Time and status skeleton */}
        <div className="flex items-center justify-between mb-2">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-8"></div>
        </div>
        
        {/* Title skeleton */}
        <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
        <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-3"></div>
        
        {/* Summary skeleton */}
        <div className="space-y-2 mb-3">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        </div>
        
        {/* Source tag skeleton */}
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
      </div>
    </div>
  );
  
  const renderArticleSkeleton = () => (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 animate-pulse">
      {/* Title skeleton */}
      <div className="mb-6">
        <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
        <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-4/5"></div>
      </div>
      
      {/* Meta info skeleton */}
      <div className="flex items-center space-x-4 mb-8">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
      </div>
      
      {/* Content skeleton */}
      <div className="space-y-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            {i % 3 === 0 && <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>}
          </div>
        ))}
      </div>
    </div>
  );
  
  const renderListSkeleton = () => (
    <div className="space-y-3 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
          <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
  
  if (type === 'article') {
    return renderArticleSkeleton();
  }
  
  if (type === 'list') {
    return renderListSkeleton();
  }
  
  // Card skeleton (default)
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <div key={i}>
          {renderCardSkeleton()}
        </div>
      ))}
    </>
  );
};

export default SkeletonLoader;