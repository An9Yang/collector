import express from 'express';
import { createRequire } from 'module';
import { JSDOM } from 'jsdom';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

// 创建兼容的require函数
const require = createRequire(import.meta.url);
const axios = require('axios');

// 获取__dirname (在ESM中不直接可用)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// 启用CORS
app.use(cors());
app.use(express.json());

// 提供静态文件
app.use(express.static(path.join(__dirname, 'dist')));

// 网页抓取API端点
app.post('/api/scrape', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: '缺少URL参数' });
    }
    
    console.log(`抓取URL: ${url}`);
    
    // 设置请求头，模拟浏览器
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };
    
    // 发送请求获取网页内容
    const response = await axios.get(url, { 
      headers,
      timeout: 10000 // 10秒超时
    });
    
    if (response.status !== 200) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = response.data;
    
    // 使用JSDOM解析HTML
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // 获取页面标题
    const title = document.querySelector('title')?.textContent || '未知标题';
    
    // 尝试获取文章主体内容
    const articleSelectors = [
      'article',
      '[role="main"]',
      '.post-content',
      '.article-content', 
      '.entry-content',
      '.content-area',
      'main',
      '#content'
    ];
    
    let contentElement = null;
    
    // 尝试所有选择器，直到找到内容
    for (const selector of articleSelectors) {
      contentElement = document.querySelector(selector);
      if (contentElement && contentElement.textContent && contentElement.textContent.trim().length > 100) {
        break;
      }
    }
    
    // 如果没有找到明确的内容容器，则使用body作为后备
    if (!contentElement || !contentElement.textContent || contentElement.textContent.trim().length < 100) {
      contentElement = document.body;
    }
    
    // 移除不需要的元素
    const elementsToRemove = contentElement.querySelectorAll('nav, header, footer, aside, .sidebar, .comments, .ad, .advertisement, script, style');
    elementsToRemove.forEach(el => el.remove());
    
    // 获取HTML内容和纯文本内容
    const cleanHtmlContent = contentElement.innerHTML;
    const textContent = contentElement.textContent?.trim() || '';
    
    return res.json({
      title,
      content: textContent,
      htmlContent: cleanHtmlContent,
      url
    });
    
  } catch (error) {
    console.error('抓取失败:', error);
    return res.status(500).json({ 
      error: error.message || '抓取失败',
      title: '抓取失败',
      content: ''
    });
  }
});

// 处理SPA路由
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
