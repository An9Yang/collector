import React, { useState } from 'react';
import Header from './components/core/Header';
import ArticleList from './components/articles/ArticleList';
import ArticleView from './components/articles/ArticleView';
import AddLinkModal from './components/articles/AddLinkModal';
import AuthModal from './components/auth/AuthModal';
import { ArticlesProvider, useArticles } from './context/ArticlesContext';

function Main() {
  const [isAddLinkModalOpen, setIsAddLinkModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { 
    articles, 
    isLoading, 
    addArticle, 
    addContent, 
    getArticleById, 
    currentArticle, 
    setCurrentArticle, 
    markAsRead, 
    isAuthenticated,
    signOut
  } = useArticles();

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

  const handleAddButtonClick = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
    } else {
      setIsAddLinkModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Header 
        onAddLinkClick={handleAddButtonClick}
        isAuthenticated={isAuthenticated}
        onSignOutClick={signOut}
        onSignInClick={() => setIsAuthModalOpen(true)}
      />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        {!isAuthenticated ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">Welcome to ClipNote</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
              Sign in to save and organize your articles from WeChat, LinkedIn, Reddit, and more.
            </p>
            <button 
              onClick={() => setIsAuthModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Sign In or Sign Up
            </button>
          </div>
        ) : (
          currentArticle ? (
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
          )
        )}
      </main>

      <AddLinkModal 
        isOpen={isAddLinkModalOpen}
        onClose={() => setIsAddLinkModalOpen(false)}
        onAddLink={handleAddLink}
        onAddContent={handleAddContent}
        isLoading={isLoading}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
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