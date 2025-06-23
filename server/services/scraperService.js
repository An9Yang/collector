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
      await page.setDefaultNavigationTimeout(30000);
      await page.setViewport({ width: 1366, height: 768 });
      
      // Navigate to URL
      await page.goto(url, { waitUntil: 'networkidle2' });
      
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
        
        // Get main content
        const contentSelectors = ['main', 'article', '.content', '#content', 'body'];
        let mainContent = '';
        
        for (const selector of contentSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            mainContent = element.innerHTML;
            break;
          }
        }
        
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
                      'blockquote', 'a', 'em', 'strong', 'code', 'pre', 'img'],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'title']
      });
      
      // Extract text preview
      const textContent = content.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      content.preview = textContent.substring(0, 200) + (textContent.length > 200 ? '...' : '');
      
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