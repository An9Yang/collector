import React, { useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { X, Link as LinkIcon, FileText } from 'lucide-react';
import { getSourceFromUrl } from '../../utils/sourceUtils';

interface AddLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLink: (url: string) => void;
  onAddContent?: (content: string) => void;
  isLoading: boolean;
}

const AddLinkModal: React.FC<AddLinkModalProps> = ({
  isOpen,
  onClose,
  onAddLink,
  onAddContent,
  isLoading,
}) => {
  const [url, setUrl] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'url' | 'content'>('url');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'url') {
      // Basic validation
      if (!url.trim()) {
        setError('Please enter a URL');
        return;
      }
      
      // Simple URL validation
      try {
        new URL(url);
        setError('');
        onAddLink(url);
      } catch (err) {
        setError('Please enter a valid URL');
      }
    } else {
      // Content validation
      if (!content.trim()) {
        setError('Please enter some content');
        return;
      }
      
      setError('');
      onAddContent?.(content);
    }
  };

  // Determine badge color based on URL
  const getBadge = () => {
    if (!url || mode !== 'url') return null;
    
    try {
      new URL(url);
      const source = getSourceFromUrl(url);
      const sourceColors = {
        wechat: 'bg-green-500',
        linkedin: 'bg-blue-500',
        reddit: 'bg-orange-500',
        other: 'bg-gray-500',
      };
      
      const sourceNames = {
        wechat: 'WeChat',
        linkedin: 'LinkedIn',
        reddit: 'Reddit',
        other: 'Web Link',
      };
      
      return (
        <span className={`inline-block px-2 py-1 text-xs font-medium text-white rounded ${sourceColors[source]}`}>
          {sourceNames[source]}
        </span>
      );
    } catch (err) {
      return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div 
        className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl transform transition-all"
        style={{ 
          animation: 'modalSlideIn 0.3s ease-out forwards',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X size={24} />
        </button>
        
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Add New Content</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Add content by URL or paste directly
          </p>

          {/* Mode selector */}
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setMode('url')}
              className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                mode === 'url'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              <LinkIcon size={16} className="mr-2" />
              Add by URL
            </button>
            <button
              onClick={() => setMode('content')}
              className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                mode === 'content'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              <FileText size={16} className="mr-2" />
              Paste Content
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            {mode === 'url' ? (
              <Input
                id="url-input"
                placeholder="https://example.com/article"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                error={error}
                label="URL"
                required
              />
            ) : (
              <div className="mb-4">
                <label htmlFor="content-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Content
                </label>
                <textarea
                  id="content-input"
                  placeholder="Paste your article content here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-64 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:border-gray-700"
                  required
                />
                {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
              </div>
            )}
            
            {mode === 'url' && getBadge() && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Detected source:</p>
                {getBadge()}
              </div>
            )}
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Content'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddLinkModal;