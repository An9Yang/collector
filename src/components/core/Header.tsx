import React, { useState, useEffect } from 'react';
import { Menu, Plus, Moon, Sun, LogOut, LogIn } from 'lucide-react';
import Button from '../ui/Button';

interface HeaderProps {
  onAddLinkClick: () => void;
  isAuthenticated: boolean;
  onSignOutClick: () => void;
  onSignInClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onAddLinkClick, 
  isAuthenticated,
  onSignOutClick,
  onSignInClick
}) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white dark:bg-gray-900 shadow-md py-2' : 'bg-transparent py-4'
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center">
            <span className="mr-2">📋</span>
            ClipNote
          </h1>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <Button 
                onClick={onAddLinkClick} 
                variant="primary"
                className="transition-transform hover:scale-105"
              >
                <Plus size={18} className="mr-2" />
                Add Link
              </Button>
              <Button
                onClick={onSignOutClick}
                variant="outline"
                size="sm"
              >
                <LogOut size={16} className="mr-2" />
                Sign Out
              </Button>
            </>
          ) : (
            <Button 
              onClick={onSignInClick} 
              variant="primary"
              className="transition-transform hover:scale-105"
            >
              <LogIn size={18} className="mr-2" />
              Sign In
            </Button>
          )}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 shadow-lg">
          <div className="container mx-auto px-4 py-3 space-y-3">
            {isAuthenticated ? (
              <>
                <Button 
                  onClick={() => {
                    onAddLinkClick();
                    setIsMobileMenuOpen(false);
                  }} 
                  variant="primary"
                  fullWidth
                >
                  <Plus size={18} className="mr-2" />
                  Add Link
                </Button>
                <Button 
                  onClick={() => {
                    onSignOutClick();
                    setIsMobileMenuOpen(false);
                  }}
                  variant="outline"
                  fullWidth
                >
                  <LogOut size={18} className="mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => {
                  onSignInClick();
                  setIsMobileMenuOpen(false);
                }}
                variant="primary"
                fullWidth
              >
                <LogIn size={18} className="mr-2" />
                Sign In
              </Button>
            )}
            <Button 
              onClick={toggleDarkMode} 
              variant="secondary"
              fullWidth
            >
              {isDarkMode ? (
                <>
                  <Sun size={18} className="mr-2" />
                  Light Mode
                </>
              ) : (
                <>
                  <Moon size={18} className="mr-2" />
                  Dark Mode
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;