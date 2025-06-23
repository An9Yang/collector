import React, { useState } from 'react';
import { api } from '../services/api';

export const Debug: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    setLoading(true);
    setResult('Testing API connection...');
    
    try {
      const response = await api.getArticles();
      setResult(`Success! Found ${response.data.length} articles`);
    } catch (error) {
      setResult(`Error: ${error.message}`);
      console.error('API Test Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>API Debug Page</h1>
      <p>API URL: {import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}</p>
      <button onClick={testAPI} disabled={loading}>
        Test API Connection
      </button>
      <pre>{result}</pre>
    </div>
  );
};