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
import { Plus, Moon, Sun, MessageCircle, X, Menu } from 'lucide-react';
import { Article } from './types';

function Main() {
  const [isAddLinkModalOpen, setIsAddLinkModalOpen] = useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [isLoadingCollection, setIsLoadingCollection] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false); // 默认关闭，尤其在移动端
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { articles, isLoading, addArticle, addContent, getArticleById, currentArticle, setCurrentArticle, markAsRead, deleteArticle, pagination, loadArticles, connectionError, retryConnection } = useArticles();
  const { 
    currentCollection, 
    getArticlesByCollection
  } = useCollections();

  // 根据当前收藏夹过滤文章
  useEffect(() => {
    let isActive = true;
    
    const loadArticlesForCurrentCollection = async () => {
      if (!isActive) return;
      
      setIsLoadingCollection(true);
      try {
        if (currentCollection) {
          const collectionArticles = await getArticlesByCollection(currentCollection.id);
          if (isActive) {
            setFilteredArticles(collectionArticles);
          }
        } else {
          if (isActive) {
            setFilteredArticles(articles);
          }
        }
      } catch (error) {
        console.error('Error loading articles for collection:', error);
        if (isActive) {
          setFilteredArticles([]);
        }
      } finally {
        if (isActive) {
          setIsLoadingCollection(false);
        }
      }
    };

    loadArticlesForCurrentCollection();
    
    return () => {
      isActive = false;
    };
  }, [currentCollection?.id, getArticlesByCollection, articles]); // 添加所有必要的依赖
  
  // 单独的effect来更新文章列表（当没有选择收藏夹时）
  useEffect(() => {
    if (!currentCollection) {
      setFilteredArticles(articles);
    }
  }, [articles, currentCollection]);

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
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300" role="application" aria-label="ClipNote 文章收藏应用">
      
      {/* Left Content Area - Reading Zone */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Left Header - Responsive */}
        <header className="h-[73px] flex items-center justify-between px-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors mr-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={isMobileMenuOpen ? "关闭菜单" : "打开菜单"}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <Menu size={20} />
            </button>
            
            {/* Logo and Collection Info */}
            <div className="flex items-center space-x-4">
              <h1 className="text-lg font-bold text-blue-600 dark:text-blue-400 flex items-center">
                <span className="mr-2">📋</span>
                <span className="hidden sm:inline">ClipNote</span>
                <span className="sm:hidden">CN</span>
              </h1>
              {currentCollection && !currentArticle && (
                <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="text-gray-400">/</span>
                  <span className="font-medium">{currentCollection.name}</span>
                  <span className="text-xs text-gray-500">({currentCollection.article_count || 0} 篇)</span>
                </div>
              )}
            </div>
            
            {/* Desktop navigation */}
            {!currentArticle && (
              <div className="hidden lg:flex items-center ml-6">
                {/* 收藏夹选择器 */}
                <div className="min-w-[180px]">
                  <CollectionSelector onCreateNew={handleCreateCollection} />
                </div>
              </div>
            )}
          </div>
          
          {/* Right side buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {!currentArticle && (
              <Button 
                onClick={() => setIsAddLinkModalOpen(true)} 
                variant="primary"
                className="transition-transform hover:scale-105 text-sm sm:text-base"
              >
                <Plus size={16} className="sm:mr-2" />
                <span className="hidden sm:inline">Add New</span>
              </Button>
            )}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={isDarkMode ? "切换到浅色模式" : "切换到深色模式"}
              aria-pressed={isDarkMode}
            >
              {isDarkMode ? <Sun size={18} className="sm:w-5 sm:h-5" /> : <Moon size={18} className="sm:w-5 sm:h-5" />}
            </button>
          </div>
        </header>
        
        {/* Mobile menu dropdown */}
        {isMobileMenuOpen && !currentArticle && (
          <div 
            id="mobile-menu"
            className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4"
            role="navigation"
            aria-label="移动端导航菜单"
          >
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">选择收藏夹</label>
                <CollectionSelector onCreateNew={handleCreateCollection} />
              </div>
              {currentCollection && (
                <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                  当前：{currentCollection.name}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Left Main Content */}
        <main className="flex-1 overflow-y-auto" role="main" aria-label="文章列表"> 
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
      <aside 
        className={`
          fixed lg:relative right-0 top-0 h-full z-40
          ${isChatOpen ? 'w-full sm:w-96' : 'w-0'} 
          lg:w-96 flex-shrink-0 
          transition-all duration-300 ease-in-out
          ${isChatOpen ? 'shadow-xl lg:shadow-none' : ''}
        `}
        role="complementary"
        aria-label="AI 聊天助手"
        aria-hidden={!isChatOpen && typeof window !== 'undefined' && window.innerWidth < 1024}
      >
        <div className={`
          h-full bg-white dark:bg-gray-800 
          border-l border-gray-200 dark:border-gray-700
          ${isChatOpen ? 'opacity-100' : 'opacity-0 lg:opacity-100'}
          transition-opacity duration-300
        `}>
          {/* 移动端关闭按钮 */}
          <button
            onClick={() => setIsChatOpen(false)}
            className="lg:hidden absolute top-4 right-4 z-50 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="关闭聊天面板"
          >
            <X size={20} />
          </button>
          <ChatPanel currentArticle={currentArticle} articles={filteredArticles} />
        </div>
      </aside>

      {/* 移动端浮动聊天按钮 */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className={`
          lg:hidden fixed bottom-6 right-6 z-50
          w-14 h-14 rounded-full shadow-lg
          bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600
          text-white flex items-center justify-center
          transition-all duration-300 transform hover:scale-110
          ${isChatOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}
          focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2
        `}
        aria-label="打开AI聊天助手"
        aria-expanded={isChatOpen}
      >
        <MessageCircle size={24} />
      </button>

      {/* 移动端遮罩层 */}
      {isChatOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsChatOpen(false)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
              setIsChatOpen(false);
            }
          }}
          aria-label="点击关闭聊天面板"
        />
      )}

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