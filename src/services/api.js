const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    
    console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }

      const data = response.status === 204 ? null : await response.json();
      console.log(`✅ API Response received for ${endpoint}`);
      return data;
    } catch (error) {
      console.error(`❌ API Error (${endpoint}):`, error);
      console.error(`API URL was: ${url}`);
      console.error(`API_URL env var: ${API_URL}`);
      throw error;
    }
  }

  // Article methods
  async getArticles(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/articles${queryString ? `?${queryString}` : ''}`);
  }

  async getArticle(id) {
    return this.request(`/articles/${id}`);
  }

  async createArticle(article) {
    return this.request('/articles', {
      method: 'POST',
      body: JSON.stringify(article),
    });
  }

  async updateArticle(id, updates) {
    return this.request(`/articles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteArticle(id) {
    return this.request(`/articles/${id}`, {
      method: 'DELETE',
    });
  }

  // Collection methods
  async getCollections() {
    return this.request('/collections');
  }

  async getCollection(id, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/collections/${id}${queryString ? `?${queryString}` : ''}`);
  }

  async createCollection(collection) {
    return this.request('/collections', {
      method: 'POST',
      body: JSON.stringify(collection),
    });
  }

  async updateCollection(id, updates) {
    return this.request(`/collections/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteCollection(id) {
    return this.request(`/collections/${id}`, {
      method: 'DELETE',
    });
  }

  async addArticleToCollection(collectionId, articleId) {
    return this.request(`/collections/${collectionId}/articles`, {
      method: 'POST',
      body: JSON.stringify({ article_id: articleId }),
    });
  }

  async removeArticleFromCollection(collectionId, articleId) {
    return this.request(`/collections/${collectionId}/articles/${articleId}`, {
      method: 'DELETE',
    });
  }

  // Tag methods
  async getTags() {
    return this.request('/tags');
  }

  async getArticlesByTag(tag, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/tags/${encodeURIComponent(tag)}/articles${queryString ? `?${queryString}` : ''}`);
  }

  // Scraper methods
  async scrapeUrl(url) {
    return this.request('/scraper/scrape', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  }
}

export const api = new ApiService();