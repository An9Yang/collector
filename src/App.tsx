import { useState, useEffect } from 'react';
import ArticleList from './components/articles/ArticleList';
import ArticleView from './components/articles/ArticleView';
import AddLinkModal from './components/articles/AddLinkModal';
import CollectionSelector from './components/collections/CollectionSelector';
import CollectionModal from './components/collections/CollectionModal';
import { ArticlesProvider, useArticles } from './context/ArticlesContext';
import { CollectionsProvider, useCollections } from './context/CollectionsContext';
import ChatPanel from './components/ChatPanel';
import Button from './components/ui/Button';
import { Plus, Moon, Sun, Settings } from 'lucide-react';
import { Article } from './types';

function Main() {
  const [isAddLinkModalOpen, setIsAddLinkModalOpen] = useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [isLoadingCollection, setIsLoadingCollection] = useState(false);
  const { articles, isLoading, addArticle, addContent, getArticleById, currentArticle, setCurrentArticle, markAsRead, deleteArticle, pagination, loadArticles, connectionError, retryConnection } = useArticles();
  const { 
    currentCollection, 
    getArticlesByCollection,
    addArticleToCollection 
  } = useCollections();

  // 根据当前收藏夹过滤文章
  useEffect(() => {
    const loadArticlesForCurrentCollection = async () => {
      setIsLoadingCollection(true);
      try {
        if (currentCollection) {
          const collectionArticles = await getArticlesByCollection(currentCollection.id);
          setFilteredArticles(collectionArticles);
        } else {
          setFilteredArticles(articles);
        }
      } catch (error) {
        console.error('Error loading articles for collection:', error);
        setFilteredArticles([]);
      } finally {
        setIsLoadingCollection(false);
      }
    };

    loadArticlesForCurrentCollection();
  }, [currentCollection, articles, getArticlesByCollection]);

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
      await addArticle(url, currentCollection?.id);
      setIsAddLinkModalOpen(false);
    } catch (error) {
      console.error('Failed to add link:', error);
    }
  };

  const handleAddContent = async (content: string) => {
    try {
      await addContent(content, currentCollection?.id);
      setIsAddLinkModalOpen(false);
    } catch (error) {
      console.error('Failed to add content:', error);
    }
  };

  const handleArticleClick = (id: string) => {
    // 在过滤后的文章中查找
    const article = filteredArticles.find(a => a.id === id) || getArticleById(id);
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

  const handleCreateCollection = () => {
    setIsCollectionModalOpen(true);
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
              <div className="flex items-center space-x-4">
                {/* 收藏夹选择器 */}
                <div className="min-w-[200px]">
                  <CollectionSelector onCreateNew={handleCreateCollection} />
                </div>
                {currentCollection && (
                  <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                    {currentCollection.name}
                  </h2>
                )}
              </div>
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
              {isLoadingCollection ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">正在加载收藏夹内容...</p>
                </div>
              ) : connectionError ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="text-6xl mb-4">⚠️</div>
                  <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
                    连接服务器失败
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
                    {connectionError}
                  </p>
                  <Button 
                    onClick={retryConnection} 
                    variant="primary"
                    className="transition-transform hover:scale-105"
                  >
                    重试连接
                  </Button>
                </div>
              ) : filteredArticles.length === 0 && currentCollection ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="text-6xl mb-4">{currentCollection.icon}</div>
                  <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
                    {currentCollection.name} 收藏夹为空
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
                    这个收藏夹还没有文章。点击上方的"Add New"按钮来添加第一篇文章。
                  </p>
                </div>
              ) : (
                <ArticleList 
                  articles={filteredArticles} 
                  onArticleClick={handleArticleClick}
                  onDeleteArticle={handleDeleteArticle}
                  pagination={currentCollection ? undefined : pagination}
                  onPageChange={currentCollection ? undefined : loadArticles}
                  isLoading={isLoading}
                />
              )}
            </div>
          )}
        </main>
      </div>

      {/* Right Content Area - Chat Zone */}
      <div className="w-96 flex-shrink-0 border-l border-gray-200 dark:border-gray-700">
        <ChatPanel currentArticle={currentArticle} articles={filteredArticles} />
      </div>

      {/* Modals */}
      <AddLinkModal 
        isOpen={isAddLinkModalOpen}
        onClose={() => setIsAddLinkModalOpen(false)}
        onAddLink={handleAddLink}
        onAddContent={handleAddContent}
        isLoading={isLoading}
      />

      <CollectionModal
        isOpen={isCollectionModalOpen}
        onClose={() => setIsCollectionModalOpen(false)}
        mode="create"
      />
    </div>
  );
}

function App() {
  return (
    <CollectionsProvider>
      <ArticlesProvider>
        <Main />
      </ArticlesProvider>
    </CollectionsProvider>
  );
}

export default App;