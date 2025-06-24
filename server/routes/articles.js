import express from 'express';
import { supabase } from '../lib/supabase.js';

const router = express.Router();

// Get articles with pagination
router.get('/', async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      sortBy = 'created_at', 
      order = 'desc',
      collectionId,
      tag
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('articles')
      .select('*', { count: 'exact' });
    
    // Apply filters
    if (collectionId) {
      // First get article IDs from article_collections table
      const { data: collectionArticles } = await supabase
        .from('article_collections')
        .select('article_id')
        .eq('collection_id', collectionId);
      
      if (collectionArticles && collectionArticles.length > 0) {
        const articleIds = collectionArticles.map(ca => ca.article_id);
        query = query.in('id', articleIds);
      }
    }
    
    if (tag) {
      query = query.contains('tags', [tag]);
    }
    
    // Apply sorting and pagination
    query = query
      .order(sortBy, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1);
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    res.json({
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get single article
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Create article
router.post('/', async (req, res, next) => {
  try {
    const { title, content, url, tags, collection_ids, summary } = req.body;
    
    // Validate required fields
    if (!title || !url) {
      return res.status(400).json({ error: 'Title and URL are required' });
    }
    
    // Insert article
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .insert([{ 
        title, 
        content, 
        url, 
        tags,
        summary: summary || title.substring(0, 200),
        source: 'other'
      }])
      .select()
      .single();
    
    if (articleError) throw articleError;
    
    // Add to collections if specified
    if (collection_ids && collection_ids.length > 0) {
      const collectionArticles = collection_ids.map(collection_id => ({
        article_id: article.id,
        collection_id
      }));
      
      const { error: collectionError } = await supabase
        .from('article_collections')
        .insert(collectionArticles);
      
      if (collectionError) throw collectionError;
    }
    
    res.status(201).json(article);
  } catch (error) {
    next(error);
  }
});

// Update article
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const { data, error } = await supabase
      .from('articles')
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

// Delete article
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;