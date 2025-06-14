// 支持图片抓取的增强版网页抓取服务器
const http = require('http');
const https = require('https');
const url = require('url');
const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');
const { JSDOM } = require('jsdom');

const PORT = 3001;
const IMAGES_DIR = path.join(__dirname, 'public', 'images');

// 确保图片目录存在
fs.ensureDirSync(IMAGES_DIR);

// 支持的图片格式
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

// 创建一个简单的HTTP服务器
const server = http.createServer(async (req, res) => {
  // 设置CORS头，允许任何来源
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
          'Cache-Control': 'public, max-age=31536000' // 缓存一年
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
        const { url: targetUrl, downloadImages = true } = JSON.parse(body);
        
        if (!targetUrl) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '缺少URL参数' }));
          return;
        }
        
        console.log(`抓取URL: ${targetUrl}`);
        console.log(`下载图片: ${downloadImages ? '是' : '否'}`);
        
        // 抓取网页内容
        const html = await fetchUrl(targetUrl);
        
        // 解析HTML并处理图片
        const result = await parseHtmlWithImages(html, targetUrl, downloadImages);
        
        // 返回结果
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          ...result,
          url: targetUrl
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
  } else {
    // 其他请求返回404
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// 启动服务器
server.listen(PORT, () => {
  console.log(`抓取服务器运行在 http://localhost:${PORT}`);
  console.log(`图片存储目录: ${IMAGES_DIR}`);
});

// 抓取URL内容的函数
function fetchUrl(targetUrl, isImage = false) {
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
        'Accept': isImage ? 'image/webp,image/png,image/svg+xml,image/*,*/*;q=0.8' : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Referer': isImage ? parsedUrl.protocol + '//' + parsedUrl.hostname : undefined
      }
    };
    
    // 发送请求
    const req = httpModule.request(options, (res) => {
      if (isImage) {
        // 对于图片，返回Buffer
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
        // 对于HTML，返回字符串
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
    
    // 处理请求错误
    req.on('error', (error) => {
      reject(error);
    });
    
    // 设置超时
    req.setTimeout(isImage ? 15000 : 10000, () => {
      req.abort();
      reject(new Error('请求超时'));
    });
    
    // 发送请求
    req.end();
  });
}

// 下载图片并保存到本地
async function downloadImage(imageUrl, baseUrl) {
  try {
    // 解析图片URL，处理相对路径
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
    
    console.log(`下载图片: ${fullImageUrl}`);
    
    // 下载图片
    const { data, contentType } = await fetchUrl(fullImageUrl, true);
    
    // 检查是否是支持的图片类型
    if (!SUPPORTED_IMAGE_TYPES.includes(contentType)) {
      console.log(`不支持的图片类型: ${contentType}`);
      return null;
    }
    
    // 检查文件大小（限制为5MB）
    if (data.length > 5 * 1024 * 1024) {
      console.log(`图片文件过大: ${data.length} bytes`);
      return null;
    }
    
    // 生成唯一的文件名
    const hash = crypto.createHash('md5').update(fullImageUrl).digest('hex');
    const ext = getImageExtension(contentType);
    const filename = `${hash}${ext}`;
    const filepath = path.join(IMAGES_DIR, filename);
    
    // 如果文件已存在，直接返回
    if (await fs.pathExists(filepath)) {
      console.log(`图片已存在: ${filename}`);
      return {
        originalUrl: fullImageUrl,
        localUrl: `/images/${filename}`,
        filename,
        size: data.length,
        contentType
      };
    }
    
    // 保存图片到本地
    await fs.writeFile(filepath, data);
    
    console.log(`图片保存成功: ${filename}`);
    return {
      originalUrl: fullImageUrl,
      localUrl: `/images/${filename}`,
      filename,
      size: data.length,
      contentType
    };
    
  } catch (error) {
    console.error(`下载图片失败 ${imageUrl}:`, error.message);
    return null;
  }
}

// 根据Content-Type获取文件扩展名
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

// 解析HTML内容并处理图片的函数
async function parseHtmlWithImages(html, baseUrl, downloadImages = true) {
  // 使用JSDOM解析HTML
  const dom = new JSDOM(html, {
    url: baseUrl,
    pretendToBeVisual: true
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
  
  // 收集所有图片信息
  const images = [];
  const imageElements = contentElement.querySelectorAll('img');
  
  console.log(`发现 ${imageElements.length} 张图片`);
  
  // 处理每张图片
  for (let i = 0; i < imageElements.length; i++) {
    const img = imageElements[i];
    const src = img.getAttribute('src');
    const alt = img.getAttribute('alt') || '';
    const title = img.getAttribute('title') || '';
    
    if (!src) continue;
    
    // 跳过Base64编码的图片和SVG数据URL
    if (src.startsWith('data:')) {
      console.log('跳过内联图片');
      continue;
    }
    
    let imageInfo = {
      originalUrl: src,
      alt,
      title,
      localUrl: null,
      downloaded: false
    };
    
    // 如果启用图片下载
    if (downloadImages) {
      const downloadResult = await downloadImage(src, baseUrl);
      if (downloadResult) {
        imageInfo = {
          ...imageInfo,
          ...downloadResult,
          downloaded: true
        };
        
        // 更新img元素的src为本地URL
        img.setAttribute('src', `http://localhost:${PORT}${downloadResult.localUrl}`);
        img.setAttribute('data-original-src', src);
      } else {
        // 下载失败，保留原始URL但添加标记
        img.setAttribute('data-download-failed', 'true');
      }
    }
    
    images.push(imageInfo);
  }
  
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
          el.setAttribute('href', new URL(href, baseUrl).href);
        }
      } catch (e) {
        // 忽略链接处理错误
      }
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
  
  console.log(`处理完成: ${images.length} 张图片, ${images.filter(img => img.downloaded).length} 张下载成功`);
  
  return { 
    title, 
    content: structuredText || plainText, 
    htmlContent: sanitizedHtml,
    plainText, // 添加完全未格式化的纯文本，以备需要
    images, // 添加图片信息数组
    imageCount: images.length,
    downloadedImageCount: images.filter(img => img.downloaded).length
  };
} 