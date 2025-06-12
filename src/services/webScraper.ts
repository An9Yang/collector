import DOMPurify from 'dompurify';

interface ScrapedContent {
  title: string;
  content: string;
  htmlContent?: string;
  structuredContent?: string; // 结构化内容（保留格式）
  plainText?: string;        // 纯文本内容
  error?: string;
  url?: string;
  sourceType?: 'article' | 'news' | 'blog' | 'other';
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
 * 首先尝试使用后端API，如果失败则回退到使用代理服务器
 * 
 * @param url 要抓取的网页URL
 * @returns 包含网页标题和内容的对象
 */
export const scrapeWebContent = async (url: string): Promise<ScrapedContent> => {
  // 先尝试使用后端API
  try {
    console.log('🔄 尝试使用后端API抓取内容...');
    // 使用本地运行的爬虫服务器
    const backendUrl = 'http://localhost:3001/api/scrape';
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url })
    });
    
    if (!response.ok) {
      throw new Error(`后端API错误: ${response.status}`);
    }
    
    const data = await response.json();
    
    // 检查从后端获取的数据格式是否完整
    if (data.title && (data.htmlContent || data.content)) {
      console.log('✅ 后端API抓取成功');
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
    console.error('❌ 后端API抓取失败，尝试使用代理服务器...', backendError);
    
    // 检查是否是连接拒绝错误
    if (backendError instanceof Error && backendError.message.includes('Failed to fetch')) {
      console.warn('⚠️  后端抓取服务器未运行。请运行: npm run scraper');
    }
    
    // 后端API失败，尝试使用代理服务器
    let lastError = backendError instanceof Error ? backendError.message : '后端API调用失败';
    
    // 遍历所有代理服务器尝试抓取
    for (const proxyUrl of PROXY_SERVERS) {
      try {
        console.log(`尝试使用代理: ${proxyUrl}`);
        
        // 设置请求头，模拟浏览器行为
        const headers = {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Upgrade-Insecure-Requests': '1'
        };
        
        // 使用代理服务器抓取内容
        const response = await fetch(`${proxyUrl}${encodeURIComponent(url)}`, {
          method: 'GET',
          headers,
          credentials: 'omit',
          redirect: 'follow',
        });
        
        if (!response.ok) {
          lastError = `HTTP error! status: ${response.status}`;
          console.log(`代理 ${proxyUrl} 失败: ${lastError}`);
          continue; // 尝试下一个代理
        }
        
        const html = await response.text();
        
        // 创建一个DOM解析器来解析HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // 获取页面标题
        const title = doc.querySelector('title')?.textContent || '未知标题';
        
        // 尝试获取文章主体内容
        // 这里使用常见的文章容器选择器，但可能需要针对特定网站调整
        const articleSelectors = [
          'article', // 通用文章标签
          '[role="main"]', // 主要内容区域
          '.post-content', // 常见的博客文章内容类
          '.article-content', 
          '.entry-content',
          '.content-area',
          'main',
          '#content'
        ];
        
        let contentElement = null;
        
        // 尝试所有选择器，直到找到内容
        for (const selector of articleSelectors) {
          contentElement = doc.querySelector(selector);
          if (contentElement && contentElement.textContent && contentElement.textContent.trim().length > 100) {
            break;
          }
        }
        
        // 如果没有找到明确的内容容器，则使用body作为后备
        if (!contentElement || !contentElement.textContent || contentElement.textContent.trim().length < 100) {
          contentElement = doc.body;
        }
        
        // 移除不需要的元素
        const elementsToRemove = contentElement.querySelectorAll('nav, header, footer, aside, .sidebar, .comments, .ad, .advertisement, script, style');
        elementsToRemove.forEach((el: Element) => el.remove());
        
        // 清理并获取HTML内容
        const cleanHtmlContent = DOMPurify.sanitize(contentElement.innerHTML);
        
        // 获取纯文本内容
        const textContent = contentElement.textContent?.trim() || '';
        
        return {
          title,
          content: textContent,
          htmlContent: cleanHtmlContent,
          url
        };
      } catch (error) {
        // 记录错误但继续尝试其他代理
        lastError = error instanceof Error ? error.message : '未知错误';
        console.error(`使用代理 ${proxyUrl} 抓取失败:`, lastError);
      }
    }
    
    // 所有代理都失败了
    console.error('所有代理服务器都失败了');
    return {
      title: '抓取失败',
      content: '',
      error: lastError || '所有代理服务器都失败了'
    };
  }
};

/**
 * 从HTML内容中提取纯文本
 * 
 * @param htmlContent HTML内容
 * @returns 提取的纯文本
 */
export const extractTextFromHtml = (htmlContent: string): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  
  // 移除不需要的元素
  const elementsToRemove = doc.querySelectorAll('nav, header, footer, aside, .sidebar, .comments, .ad, .advertisement, script, style');
  elementsToRemove.forEach((el: Element) => el.remove());
  
  return doc.body.textContent?.trim() || '';
};
