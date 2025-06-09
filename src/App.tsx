import { useState, useEffect } from 'react';
import ArticleList from './components/articles/ArticleList';
import ArticleView from './components/articles/ArticleView';
import AddLinkModal from './components/articles/AddLinkModal';
import { ArticlesProvider, useArticles } from './context/ArticlesContext';
import ChatPanel from './components/ChatPanel';
import Button from './components/ui/Button';
import { Plus, Moon, Sun } from 'lucide-react';

function Main() {
  const [isAddLinkModalOpen, setIsAddLinkModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { articles, isLoading, addArticle, addContent, getArticleById, currentArticle, setCurrentArticle, markAsRead, deleteArticle } = useArticles();

  // 主题切换逻辑
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

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
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      
      {/* Left Content Area - Reading Zone */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Left Header */}
        <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center">
              <span className="mr-2">📋</span>
              ClipNote
            </h1>
            {!currentArticle && (
              <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                My Saved Articles
              </h2>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            {!currentArticle && (
              <Button 
                onClick={() => setIsAddLinkModalOpen(true)} 
                variant="primary"
                className="transition-transform hover:scale-105"
              >
                <Plus size={18} className="mr-2" />
                Add New
              </Button>
            )}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>

        {/* Left Main Content */}
        <main className="flex-1 overflow-y-auto"> 
          {currentArticle ? (
            <ArticleView 
              article={currentArticle} 
              onBack={handleBackToList} 
              onMarkAsRead={markAsRead}
              onDelete={handleDeleteArticle}
            />
          ) : (
            <div className="container mx-auto px-4 py-6">
              <ArticleList 
                articles={articles} 
                onArticleClick={handleArticleClick}
                onDeleteArticle={handleDeleteArticle}
              />
            </div>
          )}
        </main>
      </div>

      {/* Right Content Area - Chat Zone */}
      <div className="w-96 flex-shrink-0 border-l border-gray-200 dark:border-gray-700">
        <ChatPanel currentArticle={currentArticle} articles={articles} />
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