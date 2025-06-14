import DOMPurify from 'dompurify';

interface ImageInfo {
  originalUrl: string;
  localUrl?: string;
  alt: string;
  title: string;
  downloaded: boolean;
  filename?: string;
  size?: number;
  contentType?: string;
}

interface ScrapedContent {
  title: string;
  content: string;
  htmlContent?: string;
  structuredContent?: string; // 结构化内容（保留格式）
  plainText?: string;        // 纯文本内容
  error?: string;
  url?: string;
  sourceType?: 'article' | 'news' | 'blog' | 'other';
  images?: ImageInfo[];      // 图片信息数组
  imageCount?: number;       // 图片总数
  downloadedImageCount?: number; // 成功下载的图片数
  method?: 'http' | 'puppeteer'; // 使用的抓取方法
}

// 可用的代理服务器列表
const PROXY_SERVERS = [
  import.meta.env.VITE_PROXY_URL || 'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
  'https://api.codetabs.com/v1/proxy?quest=',
  // 添加更多备用代理服务器
];

/**
 * 检测内容类型，分类来源
 * 
 * @param url 原始URL
 * @param title 标题
 * @returns 内容类型（文章、新闻、博客等）
 */
const detectSourceType = (url: string, title: string): ScrapedContent['sourceType'] => {
  const urlLower = url.toLowerCase();
  
  // 基于URL的检测
  if (urlLower.includes('news') || urlLower.includes('/article/') || urlLower.includes('/articles/')) {
    return 'news';
  }
  
  if (urlLower.includes('blog') || urlLower.includes('/post/') || urlLower.includes('/posts/')) {
    return 'blog';
  }
  
  // 基于常见新闻网站域名
  const newsPatterns = [
    'news', 'cnn', 'bbc', 'reuters', 'bloomberg', 'nytimes', 'wsj', 'washingtonpost',
    'theguardian', 'ft.com', 'forbes', 'cnbc', 'sina', 'sohu', '163.com', 'qq.com',
    'people.com.cn', 'xinhuanet', 'chinadaily', 'zaobao', 'ifeng'
  ];
  
  if (newsPatterns.some(pattern => urlLower.includes(pattern))) {
    return 'news';
  }
  
  // 基于常见博客平台
  const blogPatterns = [
    'medium.com', 'wordpress', 'blogger', 'substack', 'ghost.io', 'hashnode',
    'dev.to', 'zhihu', 'jianshu', 'csdn', 'segmentfault', 'juejin', 'weibo',
    'wechat', 'mp.weixin', 'toutiao'
  ];
  
  if (blogPatterns.some(pattern => urlLower.includes(pattern))) {
    return 'blog';
  }
  
  // 基于标题的检测
  // 新闻标题通常包含日期、时间或特定关键词
  const newsKeywords = ['新闻', '报道', '通讯', '公告', '发布', '宣布', '时报', '最新'];
  
  if (newsKeywords.some(keyword => title.includes(keyword))) {
    return 'news';
  }
  
  // 默认当作文章
  return 'article';
};

/**
 * 从URL获取网页内容
 * 
 * @param url 要抓取的网页URL
 * @param downloadImages 是否下载图片到本地（默认为true）
 * @param useAdvanced 高级模式设置：'auto'(自动), 'force'(强制), 'disable'(禁用)
 * @returns 包含网页标题和内容的对象
 */
export const scrapeWebContent = async (
  url: string, 
  downloadImages: boolean = true, 
  useAdvanced: 'auto' | 'force' | 'disable' = 'auto'
): Promise<ScrapedContent> => {
  // 先尝试使用后端API
  try {
    console.log('🔄 尝试使用统一抓取服务器...');
    // 使用本地运行的统一抓取服务器
    const backendUrl = 'http://localhost:3001/api/scrape';
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        url, 
        downloadImages,
        useAdvanced 
      })
    });
    
    if (!response.ok) {
      throw new Error(`后端API错误: ${response.status}`);
    }
    
    const data = await response.json();
    
    // 检查从后端获取的数据格式是否完整
    if (data.title && (data.htmlContent || data.content)) {
      console.log(`✅ 抓取成功 (${data.method || '未知'})`);
      if (data.images && data.images.length > 0) {
        console.log(`📸 获取到 ${data.images.length} 张图片，其中 ${data.downloadedImageCount || 0} 张已下载`);
      }
      
      // 识别内容类型
      const sourceType = detectSourceType(url, data.title);
      
      // 返回增强的内容结构
      return {
        ...data,
        sourceType,
        url // 确保原始URL也被保存
      };
    }
    
    return data;
  } catch (backendError) {
    console.error('❌ 统一抓取服务器失败，尝试使用代理服务器...', backendError);
    
    // 检查是否是连接拒绝错误
    if (backendError instanceof Error && backendError.message.includes('Failed to fetch')) {
      console.warn('⚠️  抓取服务器未运行。请运行: npm start');
    }
    
    // 后端API失败，尝试使用代理服务器（不支持图片下载和高级功能）
    console.log('🔄 使用代理服务器进行基础抓取...');
    return await fallbackToProxyServers(url);
  }
};

/**
 * 回退到代理服务器抓取
 */
async function fallbackToProxyServers(url: string): Promise<ScrapedContent> {
  let lastError = '所有代理服务器都失败了';
  
  for (const proxyUrl of PROXY_SERVERS) {
    try {
      console.log(`尝试使用代理: ${proxyUrl}`);
      
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Upgrade-Insecure-Requests': '1'
      };
      
      const response = await fetch(`${proxyUrl}${encodeURIComponent(url)}`, {
        method: 'GET',
        headers,
        credentials: 'omit',
        redirect: 'follow',
      });
      
      if (!response.ok) {
        lastError = `HTTP error! status: ${response.status}`;
        console.log(`代理 ${proxyUrl} 失败: ${lastError}`);
        continue;
      }
      
      const html = await response.text();
      
      // 创建一个DOM解析器来解析HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // 获取页面标题
      const title = doc.querySelector('title')?.textContent || '未知标题';
      
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
      
      for (const selector of articleSelectors) {
        contentElement = doc.querySelector(selector);
        if (contentElement && contentElement.textContent && contentElement.textContent.trim().length > 100) {
          break;
        }
      }
      
      if (!contentElement || !contentElement.textContent || contentElement.textContent.trim().length < 100) {
        contentElement = doc.body;
      }
      
      // 移除不需要的元素
      const elementsToRemove = contentElement.querySelectorAll('nav, header, footer, aside, .sidebar, .comments, .ad, .advertisement, script, style');
      elementsToRemove.forEach((el: Element) => el.remove());
      
      // 处理图片信息（代理模式下不能下载图片）
      const images: ImageInfo[] = [];
      const imgElements = contentElement.querySelectorAll('img');
      imgElements.forEach((img: Element) => {
        const imgEl = img as HTMLImageElement;
        const src = imgEl.getAttribute('src');
        if (src && !src.startsWith('data:')) {
          images.push({
            originalUrl: src,
            alt: imgEl.getAttribute('alt') || '',
            title: imgEl.getAttribute('title') || '',
            downloaded: false
          });
        }
      });
      
      // 清理并获取HTML内容
      const cleanHtmlContent = DOMPurify.sanitize(contentElement.innerHTML);
      
      // 获取纯文本内容
      const textContent = contentElement.textContent?.trim() || '';
      
      console.log(`✅ 代理抓取成功: ${title}`);
      
      return {
        title,
        content: textContent,
        htmlContent: cleanHtmlContent,
        images,
        imageCount: images.length,
        downloadedImageCount: 0,
        url,
        method: 'http'
      };
      
    } catch (error) {
      lastError = error instanceof Error ? error.message : '代理请求失败';
      console.log(`代理 ${proxyUrl} 失败: ${lastError}`);
      continue;
    }
  }
  
  // 所有代理都失败了
  throw new Error(`抓取失败: ${lastError}`);
}

/**
 * 从HTML内容中提取纯文本
 * 
 * @param htmlContent HTML内容
 * @returns 提取的纯文本
 */
export const extractTextFromHtml = (htmlContent: string): string => {
  // 创建一个临时的DOM元素来解析HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = DOMPurify.sanitize(htmlContent);
  
  // 获取纯文本内容
  return tempDiv.textContent || tempDiv.innerText || '';
};
