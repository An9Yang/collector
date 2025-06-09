import { useState } from 'react';
import Header from './components/core/Header';
import ArticleList from './components/articles/ArticleList';
import ArticleView from './components/articles/ArticleView';
import AddLinkModal from './components/articles/AddLinkModal';
import { ArticlesProvider, useArticles } from './context/ArticlesContext';
import ChatPanel from './components/ChatPanel'; // Added import for ChatPanel

function Main() {
  const [isAddLinkModalOpen, setIsAddLinkModalOpen] = useState(false);
  const { articles, isLoading, addArticle, addContent, getArticleById, currentArticle, setCurrentArticle, markAsRead, deleteArticle } = useArticles();

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

  return (
    // Changed to flex flex-col and h-screen for full height layout
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Header onAddLinkClick={() => setIsAddLinkModalOpen(true)} />
      
      {/* New container for main content and chat panel */}
      <div className="flex flex-1 overflow-hidden"> {/* Takes remaining space, handles overflow */}
        
        {/* Main content area (left side) - adjusted padding and added overflow-y-auto */}
        <main className="flex-grow container mx-auto px-4 py-6 overflow-y-auto"> 
          {currentArticle ? (
          <ArticleView 
            article={currentArticle} 
            onBack={handleBackToList} 
            onMarkAsRead={markAsRead}
            onDelete={handleDeleteArticle}
          />
        ) : (
          <div> {/* Removed py-6 from here as main now has py-6 */}
            <h2 className="text-2xl font-bold mb-6">My Saved Articles</h2>
            
            <ArticleList 
              articles={articles} 
              onArticleClick={handleArticleClick}
              onDeleteArticle={handleDeleteArticle}
            />
          </div>
        )}
        </main>

        {/* Chat Panel (right side) */}
        <aside className="w-96 flex-shrink-0 border-l border-gray-200 dark:border-gray-700">
          <ChatPanel currentArticle={currentArticle} articles={articles} /> {/* ChatPanel has h-full, so it will fill this aside */}
        </aside>
      </div>

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