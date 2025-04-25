import React, { useState } from 'react';
import Header from './components/core/Header';
import ArticleList from './components/articles/ArticleList';
import ArticleView from './components/articles/ArticleView';
import AddLinkModal from './components/articles/AddLinkModal';
import { ArticlesProvider, useArticles } from './context/ArticlesContext';

function Main() {
  const [isAddLinkModalOpen, setIsAddLinkModalOpen] = useState(false);
  const { articles, isLoading, addArticle, addContent, getArticleById, currentArticle, setCurrentArticle, markAsRead } = useArticles();

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Header onAddLinkClick={() => setIsAddLinkModalOpen(true)} />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        {currentArticle ? (
          <ArticleView 
            article={currentArticle} 
            onBack={handleBackToList} 
            onMarkAsRead={markAsRead}
          />
        ) : (
          <div className="py-6">
            <h2 className="text-2xl font-bold mb-6">My Saved Articles</h2>
            <ArticleList 
              articles={articles} 
              onArticleClick={handleArticleClick} 
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