// 一个简单的网页抓取服务器
const http = require('http');
const https = require('https');
const url = require('url');
const { JSDOM } = require('jsdom');

const PORT = 3001;

// 创建一个简单的HTTP服务器
const server = http.createServer(async (req, res) => {
  // 设置CORS头，允许任何来源
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // 只处理/api/scrape路径的POST请求
  if (req.method === 'POST' && req.url === '/api/scrape') {
    // 读取POST请求体
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        // 解析POST数据
        const { url: targetUrl } = JSON.parse(body);
        
        if (!targetUrl) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '缺少URL参数' }));
          return;
        }
        
        console.log(`抓取URL: ${targetUrl}`);
        
        // 抓取网页内容
        const html = await fetchUrl(targetUrl);
        
        // 解析HTML
        const { title, content, htmlContent } = parseHtml(html);
        
        // 返回结果
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          title,
          content,
          htmlContent,
          url: targetUrl
        }));
        
      } catch (error) {
        console.error('抓取失败:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: error.message || '抓取失败',
          title: '抓取失败',
          content: ''
        }));
      }
    });
  } else {
    // 其他请求返回404
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// 启动服务器
server.listen(PORT, () => {
  console.log(`抓取服务器运行在 http://localhost:${PORT}`);
});

// 抓取URL内容的函数
function fetchUrl(targetUrl) {
  return new Promise((resolve, reject) => {
    // 解析URL
    const parsedUrl = url.parse(targetUrl);
    // 选择http或https模块
    const httpModule = parsedUrl.protocol === 'https:' ? https : http;
    
    // 设置请求选项，模拟浏览器
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.path,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
      }
    };
    
    // 发送请求
    const req = httpModule.request(options, (res) => {
      let data = '';
      
      // 收集响应数据
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      // 完成接收数据
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP error! status: ${res.statusCode}`));
        }
      });
    });
    
    // 处理请求错误
    req.on('error', (error) => {
      reject(error);
    });
    
    // 设置超时
    req.setTimeout(10000, () => {
      req.abort();
      reject(new Error('请求超时'));
    });
    
    // 发送请求
    req.end();
  });
}

// 解析HTML内容的函数
function parseHtml(html) {
  // 使用JSDOM解析HTML
  const dom = new JSDOM(html, {
    url: 'https://example.org/', // 基础URL，用于解析相对链接
    pretendToBeVisual: true // 模拟浏览器环境，启用计算样式等功能
  });
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
    '#content',
    '.article__body',
    '.post-body',
    '.story-body__inner',
    '.story-content'
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
  
  // 移除不需要的元素，但保留更多的格式信息
  const elementsToRemove = contentElement.querySelectorAll(
    'nav, header:not(h1):not(h2):not(h3):not(h4):not(h5):not(h6), ' +
    'footer, aside, .sidebar, .comments, .ad, .advertisement, script, noscript, ' +
    'style, iframe, .social-share, .sharing, .share-buttons, .related-posts, ' +
    '.nav, .navigation, .menu, .search'
  );
  elementsToRemove.forEach(el => el.remove());
  
  // 保留更多有意义的样式和格式属性
  const allElements = contentElement.querySelectorAll('*');
  allElements.forEach(el => {
    // 只保留必要的样式属性，如字体、颜色、对齐方式等
    if (el.style) {
      const computedStyle = dom.window.getComputedStyle(el);
      // 保留一些基本的样式属性
      const stylesToKeep = [
        'font-weight', 'font-style', 'text-align', 'text-decoration',
        'color', 'background-color', 'margin', 'padding', 'border'
      ];
      
      // 清除所有其他样式
      el.removeAttribute('style');
      
      // 只添加我们想要保留的样式
      stylesToKeep.forEach(style => {
        const value = computedStyle.getPropertyValue(style);
        if (value && value !== 'normal' && value !== 'none' && value !== '0px' && value !== 'auto') {
          el.style[style] = value;
        }
      });
    }
    
    // 移除可能导致外部请求的属性
    el.removeAttribute('srcset');
    el.removeAttribute('data-src');
    el.removeAttribute('data-srcset');
    
    // 修复相对链接为绝对链接
    if (el.tagName === 'A' && el.hasAttribute('href')) {
      try {
        const href = el.getAttribute('href');
        if (href && !href.startsWith('http') && !href.startsWith('#')) {
          // 这是一个相对链接，添加基础URL
          el.setAttribute('href', new URL(href, 'https://example.org/').href);
        }
      } catch (e) {
        // 忽略链接处理错误
      }
    }
    
    // 为图片添加占位符，但保留alt文本和描述
    if (el.tagName === 'IMG') {
      const alt = el.getAttribute('alt') || '';
      el.setAttribute('alt', alt);
      el.removeAttribute('src'); // 移除src避免加载外部图片
      el.setAttribute('data-original-src', 'image-placeholder'); // 设置一个占位符
    }
  });
  
  // 获取净化后的HTML内容
  const sanitizedHtml = contentElement.innerHTML
    .replace(/\s+/g, ' ') // 合并多个空白字符
    .replace(/(<br\s*\/?\s*>)+/gi, '<br>') // 合并多个换行
    .trim();
    
  // 获取结构化的纯文本内容，保留段落和标题结构
  let structuredText = '';
  const paragraphs = contentElement.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, blockquote');
  paragraphs.forEach(para => {
    let text = para.textContent.trim();
    if (text) {
      // 根据元素类型添加适当的格式
      if (para.tagName.match(/^H[1-6]$/)) {
        // 为标题添加标记
        const level = para.tagName[1];
        structuredText += `${'#'.repeat(level)} ${text}\n\n`;
      } else if (para.tagName === 'LI') {
        // 为列表项添加标记
        structuredText += `• ${text}\n`;
      } else if (para.tagName === 'BLOCKQUOTE') {
        // 为引用添加标记
        structuredText += `> ${text}\n\n`;
      } else {
        // 普通段落
        structuredText += `${text}\n\n`;
      }
    }
  });
  
  // 提取纯文本
  const plainText = contentElement.textContent?.trim() || '';
  
  return { 
    title, 
    content: structuredText || plainText, 
    htmlContent: sanitizedHtml,
    plainText // 添加完全未格式化的纯文本，以备需要
  };
}
