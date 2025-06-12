// 高级网页抓取服务器 - 使用Puppeteer处理反爬虫机制
const http = require('http');
const puppeteer = require('puppeteer');

const PORT = 3001;

// 浏览器实例缓存
let browserInstance = null;

// 获取浏览器实例（单例模式）
async function getBrowser() {
  if (!browserInstance) {
    console.log('🔧 正在启动浏览器实例...');
    browserInstance = await puppeteer.launch({
      headless: true, // 无头模式
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-blink-features=AutomationControlled',
        '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        '--lang=zh-CN,zh',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-images',
        '--no-default-browser-check'
      ]
    });
    console.log('✅ 浏览器实例已启动');
  }
  return browserInstance;
}

// 创建HTTP服务器
const server = http.createServer(async (req, res) => {
  // 设置CORS头
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
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const { url: targetUrl } = JSON.parse(body);
        
        if (!targetUrl) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '缺少URL参数' }));
          return;
        }
        
        console.log(`🔍 抓取URL: ${targetUrl}`);
        
        // 检测是否为微信链接
        const isWechatUrl = targetUrl.includes('mp.weixin.qq.com');
        console.log(`🔎 检测到${isWechatUrl ? '微信' : '普通'}链接，使用${isWechatUrl ? 'Puppeteer' : '传统HTTP'}方式抓取`);
        
        let result;
        if (isWechatUrl) {
          // 微信链接使用Puppeteer
          result = await scrapeWithPuppeteer(targetUrl);
        } else {
          // 普通链接优先使用传统方式（更快）
          try {
            result = await scrapeWithHttp(targetUrl);
          } catch (httpError) {
            console.log('⚠️  传统HTTP抓取失败，尝试Puppeteer方式...');
            result = await scrapeWithPuppeteer(targetUrl);
          }
        }
        
        // 返回结果
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
        
      } catch (error) {
        console.error('❌ 抓取失败:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: error.message || '抓取失败',
          title: '抓取失败',
          content: ''
        }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// 使用Puppeteer抓取（适用于微信等反爬虫网站）
async function scrapeWithPuppeteer(targetUrl) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    // 隐藏webdriver特征
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
    });
    
    // 设置真实的浏览器环境
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1280, height: 720 });
    
    // 设置额外的请求头
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"macOS"'
    });
    
    // 模拟真实用户行为
    await page.setJavaScriptEnabled(true);
    await page.setCacheEnabled(false);
    
    console.log('🌐 正在加载页面...');
    
    // 访问页面，等待网络空闲
    await page.goto(targetUrl, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('📄 页面加载完成，正在提取内容...');
    
    // 等待内容加载
    await page.waitForTimeout(2000);
    
    // 提取页面内容
    const result = await page.evaluate(() => {
      // 获取标题
      const title = document.querySelector('title')?.textContent || 
                   document.querySelector('h1')?.textContent || 
                   document.querySelector('.rich_media_title')?.textContent ||
                   '未知标题';
      
      // 微信特定的内容选择器
      const wechatSelectors = [
        '#js_content',
        '.rich_media_content',
        '[data-role="outer"]',
        '.article-content'
      ];
      
      // 通用文章选择器
      const generalSelectors = [
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
      
      // 首先尝试微信特定选择器
      for (const selector of wechatSelectors) {
        contentElement = document.querySelector(selector);
        if (contentElement && contentElement.textContent && contentElement.textContent.trim().length > 100) {
          break;
        }
      }
      
      // 如果微信选择器没找到，尝试通用选择器
      if (!contentElement || contentElement.textContent.trim().length < 100) {
        for (const selector of generalSelectors) {
          contentElement = document.querySelector(selector);
          if (contentElement && contentElement.textContent && contentElement.textContent.trim().length > 100) {
            break;
          }
        }
      }
      
      // 如果还是没找到，使用body作为后备
      if (!contentElement || contentElement.textContent.trim().length < 100) {
        contentElement = document.body;
      }
      
      // 清理不需要的元素
      const elementsToRemove = contentElement.querySelectorAll(
        'nav, header, footer, aside, .sidebar, .comments, .ad, .advertisement, script, style, .share-btn, .qr-code, .author-info, [class*="share"], [class*="recommend"]'
      );
      
      // 创建内容副本以避免修改原DOM
      const contentClone = contentElement.cloneNode(true);
      const elementsToRemoveInClone = contentClone.querySelectorAll(
        'nav, header, footer, aside, .sidebar, .comments, .ad, .advertisement, script, style, .share-btn, .qr-code, .author-info, [class*="share"], [class*="recommend"]'
      );
      
      elementsToRemoveInClone.forEach(el => el.remove());
      
      // 获取清理后的内容
      const htmlContent = contentClone.innerHTML;
      const textContent = contentClone.textContent?.trim() || '';
      
      return {
        title: title.trim(),
        content: textContent,
        htmlContent: htmlContent
      };
    });
    
    console.log(`✅ Puppeteer抓取成功，标题: ${result.title}`);
    
    return {
      ...result,
      url: targetUrl,
      method: 'puppeteer'
    };
    
  } finally {
    await page.close();
  }
}

// 传统HTTP抓取（速度更快，适用于普通网站）
async function scrapeWithHttp(targetUrl) {
  const https = require('https');
  const http = require('http');
  const url = require('url');
  const { JSDOM } = require('jsdom');
  
  return new Promise((resolve, reject) => {
    const parsedUrl = url.parse(targetUrl);
    const httpModule = parsedUrl.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.path,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
      }
    };
    
    const req = httpModule.request(options, (res) => {
      // 检查重定向
      if (res.statusCode >= 300 && res.statusCode < 400) {
        throw new Error(`HTTP redirect: ${res.statusCode}`);
      }
      
      if (res.statusCode !== 200) {
        throw new Error(`HTTP error! status: ${res.statusCode}`);
      }
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const dom = new JSDOM(data);
          const document = dom.window.document;
          
          const title = document.querySelector('title')?.textContent || '未知标题';
          
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
          for (const selector of articleSelectors) {
            contentElement = document.querySelector(selector);
            if (contentElement && contentElement.textContent && contentElement.textContent.trim().length > 100) {
              break;
            }
          }
          
          if (!contentElement || contentElement.textContent.trim().length < 100) {
            contentElement = document.body;
          }
          
          const elementsToRemove = contentElement.querySelectorAll('nav, header, footer, aside, .sidebar, .comments, .ad, .advertisement, script, style');
          elementsToRemove.forEach(el => el.remove());
          
          const htmlContent = contentElement.innerHTML;
          const content = contentElement.textContent?.trim() || '';
          
          resolve({
            title: title.trim(),
            content,
            htmlContent,
            url: targetUrl,
            method: 'http'
          });
        } catch (parseError) {
          reject(parseError);
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.abort();
      reject(new Error('请求超时'));
    });
    
    req.end();
  });
}

// 启动服务器
server.listen(PORT, () => {
  console.log(`🚀 高级抓取服务器已启动，运行在 http://localhost:${PORT}`);
  console.log(`📡 API端点: http://localhost:${PORT}/api/scrape`);
  console.log(`🤖 支持Puppeteer无头浏览器抓取`);
  console.log(`⚡ 微信链接自动使用Puppeteer，普通链接优先使用HTTP方式`);
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
process.on('SIGINT', async () => {
  console.log('\n📴 正在关闭抓取服务器...');
  
  // 关闭浏览器实例
  if (browserInstance) {
    console.log('🔧 正在关闭浏览器实例...');
    await browserInstance.close();
    browserInstance = null;
    console.log('✅ 浏览器实例已关闭');
  }
  
  // 关闭HTTP服务器
  server.close(() => {
    console.log('✅ 抓取服务器已关闭');
    process.exit(0);
  });
}); 