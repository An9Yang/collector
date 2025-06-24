import puppeteer from 'puppeteer';
import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

export class ScraperService {
  constructor() {
    this.browser = null;
    this.browserIdleTimer = null;
    this.IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-zygote',
          '--single-process'
        ]
      });
    }
    
    // Reset idle timer
    this.resetIdleTimer();
  }
  
  resetIdleTimer() {
    if (this.browserIdleTimer) {
      clearTimeout(this.browserIdleTimer);
    }
    
    this.browserIdleTimer = setTimeout(() => {
      this.cleanup();
    }, this.IDLE_TIMEOUT);
  }

  async scrapeUrl(url) {
    await this.initBrowser();
    const page = await this.browser.newPage();
    
    try {
      // Optimize page loading
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        const resourceType = request.resourceType();
        if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
          request.abort();
        } else {
          request.continue();
        }
      });
      // Set timeout and viewport
      await page.setDefaultNavigationTimeout(60000); // 增加到60秒
      await page.setViewport({ width: 1366, height: 768 });
      
      // Navigate to URL with appropriate wait strategy
      if (url.includes('cookbook.openai.com') || url.includes('docs.') || url.includes('documentation')) {
        console.log('🔍 Detected documentation site, using special handling...');
        await page.goto(url, { waitUntil: ['domcontentloaded', 'networkidle0'] });
        
        // 特殊处理：等待所有内容区块加载
        await page.evaluate(() => {
          return new Promise((resolve) => {
            // 等待所有图片加载
            const images = Array.from(document.querySelectorAll('img'));
            let loadedImages = 0;
            
            if (images.length === 0) {
              resolve();
              return;
            }
            
            images.forEach(img => {
              if (img.complete) {
                loadedImages++;
              } else {
                img.addEventListener('load', () => {
                  loadedImages++;
                  if (loadedImages === images.length) {
                    resolve();
                  }
                });
                img.addEventListener('error', () => {
                  loadedImages++;
                  if (loadedImages === images.length) {
                    resolve();
                  }
                });
              }
            });
            
            // 如果所有图片已加载
            if (loadedImages === images.length) {
              resolve();
            }
            
            // 超时保护
            setTimeout(resolve, 10000);
          });
        });
        
        // 等待所有懒加载内容
        await page.evaluate(() => {
          // 模拟滚动到底部再回到顶部，触发所有懒加载
          window.scrollTo(0, document.body.scrollHeight);
          return new Promise(resolve => setTimeout(resolve, 1000));
        });
        
        await page.evaluate(() => {
          window.scrollTo(0, 0);
          return new Promise(resolve => setTimeout(resolve, 1000));
        });
        
        // 检查是否有锚点导航，如果有，确保滚动到正确位置
        if (url.includes('#')) {
          const anchor = url.split('#')[1];
          await page.evaluate((anchor) => {
            const element = document.getElementById(decodeURIComponent(anchor));
            if (element) {
              element.scrollIntoView();
            }
          }, anchor);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // 额外等待确保动态内容加载
        await new Promise(resolve => setTimeout(resolve, 3000));
      } else {
        // 标准网页等待网络空闲
        await page.goto(url, { waitUntil: 'networkidle2' });
      }
      
      // 等待主要内容加载
      try {
        await page.waitForSelector('article, main, .content, #content', { timeout: 5000 });
      } catch (e) {
        console.log('No main content selector found, proceeding anyway');
      }
      
      // 滚动页面多次以触发所有懒加载
      await page.evaluate(async () => {
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
        
        // 获取页面高度
        const getHeight = () => {
          return Math.max(
            document.body.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.clientHeight,
            document.documentElement.scrollHeight,
            document.documentElement.offsetHeight
          );
        };
        
        // 滚动到底部
        let previousHeight = 0;
        let currentHeight = getHeight();
        let scrollAttempts = 0;
        const maxAttempts = 10;
        
        while (previousHeight !== currentHeight && scrollAttempts < maxAttempts) {
          previousHeight = currentHeight;
          
          // 滚动到当前底部
          window.scrollTo(0, currentHeight);
          
          // 等待新内容加载
          await delay(2000);
          
          currentHeight = getHeight();
          scrollAttempts++;
          
          console.log(`Scroll attempt ${scrollAttempts}: height ${previousHeight} -> ${currentHeight}`);
        }
        
        // 滚动回顶部再到底部，确保所有图片和内容都加载
        window.scrollTo(0, 0);
        await delay(500);
        window.scrollTo(0, currentHeight);
        await delay(1000);
      });
      
      // 检查是否有"展开全文"或"查看更多"按钮
      await page.evaluate(() => {
        const expandButtons = [
          '展开全文', '查看更多', '阅读全文', '显示全部', 
          'Read more', 'Show more', 'View more', 'Expand',
          '展开', '更多', '继续阅读'
        ];
        
        const buttons = Array.from(document.querySelectorAll('button, a, span, div'));
        
        for (const button of buttons) {
          const text = button.textContent?.trim() || '';
          if (expandButtons.some(btnText => text.includes(btnText))) {
            console.log(`Found expand button: "${text}"`);
            if (button.click) {
              button.click();
              console.log('Clicked expand button');
            }
          }
        }
      });
      
      // 再等待一下让展开的内容加载
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Get page content
      const content = await page.evaluate(() => {
        // Remove scripts and styles
        const scripts = document.querySelectorAll('script, style');
        scripts.forEach(el => el.remove());
        
        // Get title
        const title = document.title || 
                     document.querySelector('h1')?.textContent || 
                     'Untitled';
        
        // Get meta description
        const description = document.querySelector('meta[name="description"]')?.content ||
                          document.querySelector('meta[property="og:description"]')?.content ||
                          '';
        
        // Get main content - 改进内容选择逻辑
        const contentSelectors = [
          // 文档类网站常见选择器
          '.prose',
          '.markdown-body',
          '.doc-content',
          '.documentation-content',
          'main .content',
          'main article',
          'article[role="main"]',
          'article',
          'main',
          '[role="main"]',
          '.post-content',
          '.entry-content', 
          '.article-content',
          '.content-body',
          '.story-body',
          '#content',
          '.content',
          'div[itemprop="articleBody"]',
          'section.content',
          // OpenAI Cookbook 特定
          '.nextra-content',
          'article.nextra-body'
        ];
        
        let mainContent = '';
        let selectedElement = null;
        
        // 尝试找到最合适的内容容器
        let maxContentLength = 0;
        
        for (const selector of contentSelectors) {
          const elements = document.querySelectorAll(selector);
          for (const element of elements) {
            const textLength = element.textContent.trim().length;
            // 选择内容最多的元素
            if (textLength > maxContentLength) {
              maxContentLength = textLength;
              selectedElement = element;
            }
          }
        }
        
        // 如果找到的内容太少，尝试组合多个内容块
        if (!selectedElement || maxContentLength < 1000) {
          console.log('Content too short, trying to combine multiple sections...');
          const allContent = [];
          
          // 尝试获取所有可能的内容区域
          const contentAreas = document.querySelectorAll('article, section, .content, .prose, main > div');
          contentAreas.forEach(area => {
            // 排除导航、侧边栏等
            if (!area.closest('nav, aside, header, footer') && 
                area.textContent.trim().length > 100) {
              allContent.push(area.outerHTML);
            }
          });
          
          if (allContent.length > 0) {
            selectedElement = document.createElement('div');
            selectedElement.innerHTML = allContent.join('\n');
          }
        }
        
        // 特殊处理：查找可能包含分页或折叠内容的容器
        if (selectedElement) {
          // 查找隐藏的内容
          const hiddenContent = selectedElement.querySelectorAll('[style*="display:none"], [style*="display: none"], .hidden, [hidden]');
          hiddenContent.forEach(el => {
            el.style.display = 'block';
            el.removeAttribute('hidden');
            el.classList.remove('hidden');
          });
          
          // 查找可能被截断的内容
          const truncatedElements = selectedElement.querySelectorAll('[class*="truncate"], [class*="ellipsis"], [class*="clamp"]');
          truncatedElements.forEach(el => {
            // 移除可能的截断类
            el.className = el.className.replace(/truncate|ellipsis|clamp/gi, '');
            // 移除可能的高度限制
            el.style.maxHeight = 'none';
            el.style.height = 'auto';
            el.style.overflow = 'visible';
          });
        }
        
        // 如果没找到，使用body但尝试移除非内容元素
        if (!selectedElement) {
          selectedElement = document.body.cloneNode(true);
          // 移除常见的非内容元素
          const removeSelectors = ['header', 'nav', 'footer', 'aside', '.sidebar', '.comments', '#comments', '.related', '.advertisement', '.ads'];
          removeSelectors.forEach(sel => {
            selectedElement.querySelectorAll(sel).forEach(el => el.remove());
          });
        }
        
        mainContent = selectedElement.innerHTML;
        
        return {
          title: title.trim(),
          description: description.trim(),
          content: mainContent,
          url: window.location.href
        };
      });
      
      // Sanitize content
      const window = new JSDOM('').window;
      const purify = DOMPurify(window);
      
      content.content = purify.sanitize(content.content, {
        ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 
                      'blockquote', 'a', 'em', 'strong', 'code', 'pre', 'img',
                      'div', 'span', 'section', 'article', 'figure', 'figcaption',
                      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'br', 'hr',
                      'b', 'i', 'u', 's', 'sub', 'sup', 'small', 'mark'],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'style']
      });
      
      // Extract text preview
      const textContent = content.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      content.preview = textContent.substring(0, 200) + (textContent.length > 200 ? '...' : '');
      
      // 添加调试信息
      console.log(`📊 Scraped content stats for ${url}:`);
      console.log(`   - HTML length: ${content.content.length} characters`);
      console.log(`   - Text length: ${textContent.length} characters`);
      console.log(`   - Title: ${content.title}`);
      
      // 如果内容太短，尝试获取整个页面的文本
      if (textContent.length < 5000) {  // 提高阈值到5000字符
        console.log('⚠️ Content seems too short, trying alternative extraction methods...');
        
        // 方法1：获取整个页面的结构化HTML
        const fullPageHTML = await page.evaluate(() => {
          // 克隆body
          const bodyClone = document.body.cloneNode(true);
          
          // 移除不需要的元素
          const removeSelectors = [
            'script', 'style', 'noscript', 'iframe',
            'nav', 'header > nav', 'aside.sidebar',
            '.ad', '.advertisement', '[class*="banner"]',
            'footer', '.footer'
          ];
          
          removeSelectors.forEach(selector => {
            bodyClone.querySelectorAll(selector).forEach(el => el.remove());
          });
          
          // 获取main或article区域，如果没有就用整个body
          const mainContent = bodyClone.querySelector('main, article, [role="main"], .main-content') || bodyClone;
          
          return mainContent.innerHTML;
        });
        
        // 方法2：使用Readability算法提取
        const readabilityContent = await page.evaluate(() => {
          // 简化的readability算法
          const paragraphs = Array.from(document.querySelectorAll('p, div, section, article'));
          const contentBlocks = [];
          
          paragraphs.forEach(elem => {
            const text = elem.innerText || elem.textContent || '';
            const wordCount = text.split(/\s+/).length;
            
            // 只保留有实质内容的段落
            if (wordCount > 10 && !elem.closest('nav, aside, footer, header')) {
              contentBlocks.push({
                html: elem.outerHTML,
                text: text,
                wordCount: wordCount
              });
            }
          });
          
          // 按内容长度排序，组合最长的内容块
          contentBlocks.sort((a, b) => b.wordCount - a.wordCount);
          
          // 获取前100个最长的内容块
          return contentBlocks
            .slice(0, 100)
            .map(block => block.html)
            .join('\n');
        });
        
        // 选择内容最多的方法
        const fullPageTextLength = (fullPageHTML || '').replace(/<[^>]*>/g, '').length;
        const readabilityLength = (readabilityContent || '').replace(/<[^>]*>/g, '').length;
        
        console.log(`📊 Alternative extraction results:`);
        console.log(`   - Full page HTML text length: ${fullPageTextLength}`);
        console.log(`   - Readability text length: ${readabilityLength}`);
        
        if (fullPageTextLength > textContent.length || readabilityLength > textContent.length) {
          if (readabilityLength > fullPageTextLength) {
            console.log(`📈 Using Readability extraction: ${readabilityLength} characters`);
            content.content = readabilityContent;
          } else {
            console.log(`📈 Using full page extraction: ${fullPageTextLength} characters`);
            content.content = fullPageHTML;
          }
          
          // 重新计算预览
          const newTextContent = content.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          content.preview = newTextContent.substring(0, 200) + '...';
        }
      }
      
      // 对于OpenAI Cookbook等特定网站，尝试特殊处理
      if (url.includes('cookbook.openai.com') && textContent.length < 10000) {
        console.log('🎯 Special handling for OpenAI Cookbook...');
        
        const cookbookContent = await page.evaluate(() => {
          // 获取所有内容区域
          const contentSections = [];
          
          // 查找所有章节
          document.querySelectorAll('h1, h2, h3, h4').forEach(heading => {
            let content = heading.outerHTML;
            let sibling = heading.nextElementSibling;
            
            // 获取标题后的所有内容，直到下一个同级或更高级标题
            while (sibling && !sibling.matches('h1, h2, h3, h4')) {
              content += sibling.outerHTML;
              sibling = sibling.nextElementSibling;
            }
            
            contentSections.push(content);
          });
          
          return contentSections.join('\n');
        });
        
        if (cookbookContent && cookbookContent.length > content.content.length) {
          console.log(`🎯 Found more content with special handling: ${cookbookContent.length} characters`);
          content.content = cookbookContent;
        }
      }
      
      return content;
    } catch (error) {
      console.error('Scraping error:', error);
      throw new Error(`Failed to scrape URL: ${error.message}`);
    } finally {
      await page.close();
      this.resetIdleTimer();
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

// Cleanup on process exit
process.on('SIGINT', async () => {
  const service = new ScraperService();
  await service.cleanup();
  process.exit(0);
});