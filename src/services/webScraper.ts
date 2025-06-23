import { api } from './api';

interface ScrapedContent {
  title: string;
  content: string;
  preview?: string;
  url: string;
  error?: string;
}

export class WebScraper {
  static async scrapeUrl(url: string): Promise<ScrapedContent> {
    try {
      const result = await api.scrapeUrl(url);
      return result;
    } catch (error) {
      console.error('Error scraping URL:', error);
      throw new Error(`Failed to scrape URL: ${error.message}`);
    }
  }
}