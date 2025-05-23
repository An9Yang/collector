import React, { useState } from 'react';
import { X } from 'lucide-react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useArticles } from '../../context/ArticlesContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signIn, signUp, isLoading } = useArticles();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    try {
      if (mode === 'signin') {
        await signIn(email, password);
        onClose();
      } else {
        await signUp(email, password);
        setMode('signin');
        setError('');
        alert('Account created! You can now sign in');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div 
        className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md transform transition-all"
        style={{ animation: 'modalSlideIn 0.3s ease-out forwards' }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X size={24} />
        </button>
        
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {mode === 'signin' ? 'Sign in to ClipNote' : 'Create an account'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {mode === 'signin' 
              ? 'Sign in to access your saved articles' 
              : 'Create an account to start saving articles'}
          </p>

          <form onSubmit={handleSubmit}>
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            
            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-md">
                {error}
              </div>
            )}
            
            <Button 
              type="submit" 
              isLoading={isLoading}
              disabled={isLoading}
              fullWidth
              className="mb-4"
            >
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </Button>
            
            <div className="text-center">
              <button 
                type="button" 
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {mode === 'signin' 
                  ? 'Don\'t have an account? Sign up' 
                  : 'Already have an account? Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;