import express from 'express';
import { supabase } from '../lib/supabase.js';

const router = express.Router();

// Get all unique tags
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('tags');
    
    if (error) throw error;
    
    // Extract and count unique tags
    const tagCounts = {};
    data.forEach(article => {
      if (article.tags && Array.isArray(article.tags)) {
        article.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });
    
    // Convert to array and sort by count
    const tags = Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    
    res.json(tags);
  } catch (error) {
    next(error);
  }
});

// Get articles by tag
router.get('/:tag/articles', async (req, res, next) => {
  try {
    const { tag } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const { data, error, count } = await supabase
      .from('articles')
      .select('*', { count: 'exact' })
      .contains('tags', [tag])
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    
    res.json({
      tag,
      articles: data,
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

export default router;