import express from 'express';
import { scraperRateLimiter } from '../middleware/rateLimiter.js';
import { ScraperService } from '../services/scraperService.js';

const router = express.Router();
const scraperService = new ScraperService();

// Apply rate limiting to scraper endpoints
router.use(scraperRateLimiter);

router.post('/scrape', async (req, res, next) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    const result = await scraperService.scrapeUrl(url);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;