import { useState } from 'react';
import Header from './components/core/Header';
import ArticleList from './components/articles/ArticleList';
import ArticleView from './components/articles/ArticleView';
import AddLinkModal from './components/articles/AddLinkModal';
import { ArticlesProvider, useArticles } from './context/ArticlesContext';

function Main() {
  const [isAddLinkModalOpen, setIsAddLinkModalOpen] = useState(false);
  const { articles, isLoading, addArticle, addContent, getArticleById, currentArticle, setCurrentArticle, markAsRead, deleteArticle, storageMode } = useArticles();

  const handleAddLink = async (url: string) => {
    try {
      await addArticle(url);
      setIsAddLinkModalOpen(false);
    } catch (error) {
      console.error('Failed to add link:', error);
    }
  };

  const handleAddContent = async (content: string) => {
    try {
      await addContent(content);
      setIsAddLinkModalOpen(false);
    } catch (error) {
      console.error('Failed to add content:', error);
    }
  };

  const handleArticleClick = (id: string) => {
    const article = getArticleById(id);
    if (article) {
      setCurrentArticle(article);
    }
  };

  const handleBackToList = () => {
    setCurrentArticle(null);
  };

  const handleDeleteArticle = async (id: string) => {
    try {
      await deleteArticle(id);
    } catch (error) {
      console.error('Failed to delete article:', error);
    }
  };

  const storageInfo = {
    supabase: {
      icon: '☁️',
      title: '云存储模式',
      description: '文章保存在 Supabase 云数据库中，支持跨设备同步',
      bgColor: 'bg-green-50 dark:bg-green-900/30',
      borderColor: 'border-green-200 dark:border-green-700',
      textColor: 'text-green-800 dark:text-green-200'
    },
    local: {
      icon: '💾',
      title: '本地存储模式',
      description: '文章保存在浏览器本地存储中，响应更快',
      bgColor: 'bg-blue-50 dark:bg-blue-900/30',
      borderColor: 'border-blue-200 dark:border-blue-700',
      textColor: 'text-blue-800 dark:text-blue-200'
    }
  };

  const currentStorageInfo = storageInfo[storageMode];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Header onAddLinkClick={() => setIsAddLinkModalOpen(true)} />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        {currentArticle ? (
          <ArticleView 
            article={currentArticle} 
            onBack={handleBackToList} 
            onMarkAsRead={markAsRead}
            onDelete={handleDeleteArticle}
          />
        ) : (
          <div className="py-6">
            <h2 className="text-2xl font-bold mb-6">My Saved Articles</h2>
            
            {/* 显示智能存储状态信息 */}
            <div className={`mb-4 p-3 rounded-lg border ${currentStorageInfo.bgColor} ${currentStorageInfo.borderColor}`}>
              <p className={`text-sm ${currentStorageInfo.textColor}`}>
                {currentStorageInfo.icon} <strong>{currentStorageInfo.title}</strong> - {currentStorageInfo.description}
              </p>
            </div>
            
            <ArticleList 
              articles={articles} 
              onArticleClick={handleArticleClick}
              onDeleteArticle={handleDeleteArticle}
            />
          </div>
        )}
      </main>

      <AddLinkModal 
        isOpen={isAddLinkModalOpen}
        onClose={() => setIsAddLinkModalOpen(false)}
        onAddLink={handleAddLink}
        onAddContent={handleAddContent}
        isLoading={isLoading}
      />
    </div>
  );
}

function App() {
  return (
    <ArticlesProvider>
      <Main />
    </ArticlesProvider>
  );
}

export default App;