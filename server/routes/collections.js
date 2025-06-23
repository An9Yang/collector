import express from 'express';
import { supabase } from '../lib/supabase.js';

const router = express.Router();

// Get all collections
router.get('/', async (req, res, next) => {
  try {
    // Get all collections
    const { data: collections, error } = await supabase
      .from('collections')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Get article counts for each collection
    const collectionsWithCounts = await Promise.all(
      collections.map(async (collection) => {
        const { count } = await supabase
          .from('article_collections')
          .select('*', { count: 'exact', head: true })
          .eq('collection_id', collection.id);
        
        return {
          ...collection,
          article_count: count || 0
        };
      })
    );
    
    res.json(collectionsWithCounts);
  } catch (error) {
    next(error);
  }
});

// Get single collection with articles
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    // Get collection details
    const { data: collection, error: collectionError } = await supabase
      .from('collections')
      .select('*')
      .eq('id', id)
      .single();
    
    if (collectionError) throw collectionError;
    
    // Get article IDs in collection
    const { data: collectionArticles, error: caError, count } = await supabase
      .from('article_collections')
      .select('article_id', { count: 'exact' })
      .eq('collection_id', id)
      .order('added_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (caError) throw caError;
    
    // Get the actual articles
    let articles = [];
    if (collectionArticles && collectionArticles.length > 0) {
      const articleIds = collectionArticles.map(ca => ca.article_id);
      const { data: articleData, error: articlesError } = await supabase
        .from('articles')
        .select('*')
        .in('id', articleIds);
      
      if (articlesError) throw articlesError;
      articles = articleData || [];
    }
    
    res.json({
      ...collection,
      articles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create collection
router.post('/', async (req, res, next) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Collection name is required' });
    }
    
    const { data, error } = await supabase
      .from('collections')
      .insert([{ name, description }])
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

// Update collection
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const { data, error } = await supabase
      .from('collections')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Delete collection
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Add article to collection
router.post('/:id/articles', async (req, res, next) => {
  try {
    const { id: collection_id } = req.params;
    const { article_id } = req.body;
    
    if (!article_id) {
      return res.status(400).json({ error: 'Article ID is required' });
    }
    
    const { data, error } = await supabase
      .from('article_collections')
      .insert([{ collection_id, article_id }])
      .select();
    
    if (error) throw error;
    
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

// Remove article from collection
router.delete('/:id/articles/:articleId', async (req, res, next) => {
  try {
    const { id: collection_id, articleId: article_id } = req.params;
    
    const { error } = await supabase
      .from('article_collections')
      .delete()
      .eq('collection_id', collection_id)
      .eq('article_id', article_id);
    
    if (error) throw error;
    
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;