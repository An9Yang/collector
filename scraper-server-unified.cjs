// 统一的智能网页抓取服务器
// 支持：基础抓取、高级抓取(Puppeteer)、图片下载
const http = require('http');
const https = require('https');
const url = require('url');
const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');
const { JSDOM } = require('jsdom');

// 检查是否安装了Puppeteer
let puppeteer = null;
try {
  puppeteer = require('puppeteer');
  console.log('🤖 Puppeteer 可用，支持高级抓取模式');
} catch (error) {
  console.log('ℹ️  Puppeteer 未安装，仅支持基础抓取模式');
}

const PORT = 3001;
const IMAGES_DIR = path.join(__dirname, 'public', 'images');

// 确保图片目录存在
fs.ensureDirSync(IMAGES_DIR);

// 支持的图片格式
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

// Puppeteer浏览器实例缓存
let browser = null;

// 获取或创建浏览器实例
async function getBrowser() {
  if (!puppeteer) {
    throw new Error('Puppeteer未安装，无法使用高级抓取模式');
  }
  
  if (!browser) {
    console.log('🚀 启动浏览器实例...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
  }
  
  return browser;
}

// 创建HTTP服务器
const server = http.createServer(async (req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // 处理图片文件请求
  if (req.method === 'GET' && req.url.startsWith('/images/')) {
    return handleImageRequest(req, res);
  }
  
  // 处理抓取API请求
  if (req.method === 'POST' && req.url === '/api/scrape') {
    return handleScrapeRequest(req, res);
  }
  
  // 其他请求返回404
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

// 处理图片请求
async function handleImageRequest(req, res) {
  const imagePath = path.join(__dirname, 'public', req.url);
  try {
    if (await fs.pathExists(imagePath)) {
      const stat = await fs.stat(imagePath);
      const ext = path.extname(imagePath).toLowerCase();
      
      // 设置正确的Content-Type
      let contentType = 'image/jpeg';
      if (ext === '.png') contentType = 'image/png';
      else if (ext === '.gif') contentType = 'image/gif';
      else if (ext === '.webp') contentType = 'image/webp';
      else if (ext === '.svg') contentType = 'image/svg+xml';
      
      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': stat.size,
        'Cache-Control': 'public, max-age=31536000'
      });
      
      const stream = fs.createReadStream(imagePath);
      stream.pipe(res);
      return;
    }
  } catch (error) {
    console.error('图片文件访问错误:', error);
  }
  
  res.writeHead(404);
  res.end('Image not found');
}

// 处理抓取请求
async function handleScrapeRequest(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', async () => {
    try {
      const { 
        url: targetUrl, 
        downloadImages = true, 
        useAdvanced = 'auto' // 'auto', 'force', 'disable'
      } = JSON.parse(body);
      
      if (!targetUrl) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '缺少URL参数' }));
        return;
      }
      
      console.log(`🔍 抓取URL: ${targetUrl}`);
      console.log(`📸 下载图片: ${downloadImages ? '是' : '否'}`);
      console.log(`🤖 高级模式: ${useAdvanced}`);
      
      // 智能选择抓取模式
      const shouldUseAdvanced = await shouldUseAdvancedMode(targetUrl, useAdvanced);
      
      let result;
      if (shouldUseAdvanced && puppeteer) {
        console.log('🤖 使用高级抓取模式 (Puppeteer)');
        result = await scrapeWithPuppeteer(targetUrl, downloadImages);
      } else {
        console.log('🌐 使用基础抓取模式 (HTTP)');
        result = await scrapeWithHttp(targetUrl, downloadImages);
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        ...result,
        url: targetUrl,
        method: shouldUseAdvanced ? 'puppeteer' : 'http'
      }));
      
    } catch (error) {
      console.error('抓取失败:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: error.message || '抓取失败',
        title: '抓取失败',
        content: '',
        images: []
      }));
    }
  });
}

// 智能判断是否使用高级模式
async function shouldUseAdvancedMode(targetUrl, userPreference) {
  if (userPreference === 'force') return true;
  if (userPreference === 'disable') return false;
  if (!puppeteer) return false;
  
  // 自动判断：某些网站需要高级模式
  const urlLower = targetUrl.toLowerCase();
  const advancedSites = [
    'mp.weixin.qq.com',  // 微信公众号
    'weibo.com',         // 微博
    'zhihu.com',         // 知乎
    'juejin.cn',         // 掘金
    'segmentfault.com',  // SegmentFault
    'csdn.net'           // CSDN
  ];
  
  return advancedSites.some(site => urlLower.includes(site));
}

// 使用Puppeteer抓取
async function scrapeWithPuppeteer(targetUrl, downloadImages) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    // 设置浏览器环境
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1280, height: 720 });
    
    // 访问页面
    await page.goto(targetUrl, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    await page.waitForTimeout(2000);
    
    // 获取页面HTML
    const html = await page.content();
    
    // 解析HTML并处理图片
    const result = await parseHtmlWithImages(html, targetUrl, downloadImages);
    
    return result;
    
  } finally {
    await page.close();
  }
}

// 使用HTTP抓取
async function scrapeWithHttp(targetUrl, downloadImages) {
  const html = await fetchUrl(targetUrl);
  return await parseHtmlWithImages(html, targetUrl, downloadImages);
}

// HTTP请求函数
function fetchUrl(targetUrl, isImage = false) {
  return new Promise((resolve, reject) => {
    const parsedUrl = url.parse(targetUrl);
    const httpModule = parsedUrl.protocol === 'https:' ? https : http;
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
      'Accept': isImage ? 'image/webp,image/png,image/svg+xml,image/*,*/*;q=0.8' : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
    };
    
    // 只在需要时添加Referer头
    if (isImage) {
      headers['Referer'] = parsedUrl.protocol + '//' + parsedUrl.hostname;
    }
    
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.path,
      method: 'GET',
      headers
    };
    
    const req = httpModule.request(options, (res) => {
      if (isImage) {
        let data = Buffer.alloc(0);
        res.on('data', (chunk) => {
          data = Buffer.concat([data, chunk]);
        });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ 
              data, 
              contentType: res.headers['content-type'] || 'image/jpeg',
              contentLength: res.headers['content-length']
            });
          } else {
            reject(new Error(`HTTP error! status: ${res.statusCode}`));
          }
        });
      } else {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`HTTP error! status: ${res.statusCode}`));
          }
        });
      }
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(isImage ? 15000 : 10000, () => {
      req.abort();
      reject(new Error('请求超时'));
    });
    
    req.end();
  });
}

// 下载图片
async function downloadImage(imageUrl, baseUrl) {
  try {
    // 解析图片URL
    let fullImageUrl;
    if (imageUrl.startsWith('http')) {
      fullImageUrl = imageUrl;
    } else if (imageUrl.startsWith('//')) {
      const baseUrlObj = new URL(baseUrl);
      fullImageUrl = baseUrlObj.protocol + imageUrl;
    } else if (imageUrl.startsWith('/')) {
      const baseUrlObj = new URL(baseUrl);
      fullImageUrl = baseUrlObj.protocol + '//' + baseUrlObj.hostname + imageUrl;
    } else {
      fullImageUrl = new URL(imageUrl, baseUrl).href;
    }
    
    console.log(`📥 下载图片: ${fullImageUrl}`);
    
    const { data, contentType } = await fetchUrl(fullImageUrl, true);
    
    if (!SUPPORTED_IMAGE_TYPES.includes(contentType)) {
      console.log(`❌ 不支持的图片类型: ${contentType}`);
      return null;
    }
    
    if (data.length > 5 * 1024 * 1024) {
      console.log(`❌ 图片文件过大: ${data.length} bytes`);
      return null;
    }
    
    const hash = crypto.createHash('md5').update(fullImageUrl).digest('hex');
    const ext = getImageExtension(contentType);
    const filename = `${hash}${ext}`;
    const filepath = path.join(IMAGES_DIR, filename);
    
    if (await fs.pathExists(filepath)) {
      console.log(`✅ 图片已存在: ${filename}`);
      return {
        originalUrl: fullImageUrl,
        localUrl: `/images/${filename}`,
        filename,
        size: data.length,
        contentType
      };
    }
    
    await fs.writeFile(filepath, data);
    console.log(`✅ 图片保存成功: ${filename}`);
    
    return {
      originalUrl: fullImageUrl,
      localUrl: `/images/${filename}`,
      filename,
      size: data.length,
      contentType
    };
    
  } catch (error) {
    console.error(`❌ 下载图片失败 ${imageUrl}:`, error.message);
    return null;
  }
}

// 获取图片扩展名
function getImageExtension(contentType) {
  const typeMap = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg'
  };
  return typeMap[contentType] || '.jpg';
}

// 解析HTML并处理图片
async function parseHtmlWithImages(html, baseUrl, downloadImages = true) {
  const dom = new JSDOM(html, {
    url: baseUrl,
    pretendToBeVisual: true
  });
  const document = dom.window.document;
  
  // 获取页面标题
  const title = document.querySelector('title')?.textContent || '未知标题';
  
  // 获取文章内容
  const articleSelectors = [
    '#js_content', '.rich_media_content', // 微信特有
    'article', '[role="main"]', '.post-content', '.article-content', 
    '.entry-content', '.content-area', 'main', '#content',
    '.article__body', '.post-body', '.story-body__inner', '.story-content'
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
  
  // 清理不需要的元素
  const elementsToRemove = contentElement.querySelectorAll(
    'nav, header:not(h1):not(h2):not(h3):not(h4):not(h5):not(h6), ' +
    'footer, aside, .sidebar, .comments, .ad, .advertisement, script, noscript, ' +
    'style, iframe, .social-share, .sharing, .share-buttons, .related-posts, ' +
    '.nav, .navigation, .menu, .search, .qr-code, [class*="share"], [class*="recommend"]'
  );
  elementsToRemove.forEach(el => el.remove());
  
  // 处理图片
  const images = [];
  const imageElements = contentElement.querySelectorAll('img');
  
  console.log(`🖼️  发现 ${imageElements.length} 张图片`);
  
  for (let i = 0; i < imageElements.length; i++) {
    const img = imageElements[i];
    const src = img.getAttribute('src');
    const alt = img.getAttribute('alt') || '';
    const title = img.getAttribute('title') || '';
    
    if (!src || src.startsWith('data:')) continue;
    
    let imageInfo = {
      originalUrl: src,
      alt,
      title,
      localUrl: null,
      downloaded: false
    };
    
    if (downloadImages) {
      const downloadResult = await downloadImage(src, baseUrl);
      if (downloadResult) {
        imageInfo = { ...imageInfo, ...downloadResult, downloaded: true };
        img.setAttribute('src', `http://localhost:${PORT}${downloadResult.localUrl}`);
        img.setAttribute('data-original-src', src);
      } else {
        img.setAttribute('data-download-failed', 'true');
      }
    }
    
    images.push(imageInfo);
  }
  
  // 清理样式属性
  const allElements = contentElement.querySelectorAll('*');
  allElements.forEach(el => {
    if (el.style) {
      const computedStyle = dom.window.getComputedStyle(el);
      const stylesToKeep = ['font-weight', 'font-style', 'text-align', 'text-decoration'];
      
      el.removeAttribute('style');
      stylesToKeep.forEach(style => {
        const value = computedStyle.getPropertyValue(style);
        if (value && value !== 'normal' && value !== 'none') {
          el.style[style] = value;
        }
      });
    }
    
    el.removeAttribute('srcset');
    el.removeAttribute('data-src');
    el.removeAttribute('data-srcset');
    
    // 修复链接
    if (el.tagName === 'A' && el.hasAttribute('href')) {
      try {
        const href = el.getAttribute('href');
        if (href && !href.startsWith('http') && !href.startsWith('#')) {
          el.setAttribute('href', new URL(href, baseUrl).href);
        }
      } catch (e) {
        // 忽略链接处理错误
      }
    }
  });
  
  // 获取内容
  const sanitizedHtml = contentElement.innerHTML
    .replace(/\s+/g, ' ')
    .replace(/(<br\s*\/?\s*>)+/gi, '<br>')
    .trim();
    
  // 结构化文本
  let structuredText = '';
  const paragraphs = contentElement.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, blockquote');
  paragraphs.forEach(para => {
    let text = para.textContent.trim();
    if (text) {
      if (para.tagName.match(/^H[1-6]$/)) {
        const level = para.tagName[1];
        structuredText += `${'#'.repeat(level)} ${text}\n\n`;
      } else if (para.tagName === 'LI') {
        structuredText += `• ${text}\n`;
      } else if (para.tagName === 'BLOCKQUOTE') {
        structuredText += `> ${text}\n\n`;
      } else {
        structuredText += `${text}\n\n`;
      }
    }
  });
  
  const plainText = contentElement.textContent?.trim() || '';
  
  console.log(`✅ 处理完成: ${images.length} 张图片, ${images.filter(img => img.downloaded).length} 张下载成功`);
  
  return { 
    title, 
    content: structuredText || plainText, 
    htmlContent: sanitizedHtml,
    plainText,
    images,
    imageCount: images.length,
    downloadedImageCount: images.filter(img => img.downloaded).length
  };
}

// 启动服务器
server.listen(PORT, () => {
  console.log(`🚀 统一抓取服务器运行在 http://localhost:${PORT}`);
  console.log(`📁 图片存储目录: ${IMAGES_DIR}`);
  console.log(`🔧 支持功能:`);
  console.log(`   ✅ 基础HTML抓取`);
  console.log(`   ${puppeteer ? '✅' : '❌'} 高级抓取 (Puppeteer)`);
  console.log(`   ✅ 图片下载与缓存`);
  console.log(`   ✅ 智能模式选择`);
});

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n🛑 正在关闭服务器...');
  if (browser) {
    await browser.close();
    console.log('✅ 浏览器实例已关闭');
  }
  process.exit(0);
}); 