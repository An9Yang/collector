import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import scraperRouter from './routes/scraper.js';
import articlesRouter from './routes/articles.js';
import collectionsRouter from './routes/collections.js';
import tagsRouter from './routes/tags.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests from any localhost port during development
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'http://localhost:3001',
      // Vercel部署的域名
      'https://collector-siik-annan-team.vercel.app',
      'https://collector-siik.vercel.app',
      // 允许所有Vercel预览部署
      /^https:\/\/collector-.*\.vercel\.app$/
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin matches any allowed origin
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return allowed === origin;
    });
    
    if (isAllowed || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      // 生产环境下，为了调试，暂时允许所有源
      // TODO: 部署稳定后，移除这行
      if (process.env.NODE_ENV === 'production') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/scraper', scraperRouter);
app.use('/api/articles', articlesRouter);
app.use('/api/collections', collectionsRouter);
app.use('/api/tags', tagsRouter);

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`API Server running on port ${PORT}`);
});