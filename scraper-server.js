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
  console.log(`🚀 抓取服务器已启动，运行在 http://localhost:${PORT}`);
  console.log(`📡 API端点: http://localhost:${PORT}/api/scrape`);
});

// 处理服务器错误
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ 端口 ${PORT} 已被占用，请尝试其他端口或停止占用该端口的进程`);
    process.exit(1);
  } else {
    console.error('❌ 服务器启动失败:', error.message);
  }
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n📴 正在关闭抓取服务器...');
  server.close(() => {
    console.log('✅ 抓取服务器已关闭');
    process.exit(0);
  });
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
  const htmlContent = contentElement.innerHTML;
  const content = contentElement.textContent?.trim() || '';
  
  return { title, content, htmlContent };
}
