import { Article } from '../types';
import { getSourceFromUrl, getSourceName } from './sourceUtils';
import { detectContentFormat, processContent } from './formatDetection';

const mockContent = `
<div class="article-content">
  <p>This is a sample article that has been clipped by ClipNote. The content is formatted to look like a real article that would be found online.</p>
  
  <h2>Why Content Clipping Matters</h2>
  <p>In the age of information overload, having a reliable way to save and organize content is essential. Here are some reasons why:</p>
  
  <ul>
    <li>Information is scattered across multiple platforms</li>
    <li>Good content often gets lost in the noise</li>
    <li>Having a central repository improves productivity</li>
  </ul>
  
  <p>ClipNote solves these problems by providing a seamless way to save and organize content from various sources.</p>
  
  <h2>Features That Make a Difference</h2>
  <p>What sets good content clipping tools apart is their ability to preserve the original content while making it more accessible. This includes:</p>
  
  <ol>
    <li>Clean presentation that focuses on the content</li>
    <li>Smart categorization and tagging</li>
    <li>Useful summaries that capture the essence</li>
    <li>Cross-platform accessibility</li>
  </ol>
  
  <p>By focusing on these features, ClipNote aims to provide the best possible experience for users who want to save and organize content from around the web.</p>
  
  <h2>Looking Ahead</h2>
  <p>The future of content clipping tools looks promising, with advances in AI making it possible to extract more value from saved content. Imagine being able to:</p>
  
  <ul>
    <li>Automatically categorize content based on topics</li>
    <li>Generate insights across multiple saved articles</li>
    <li>Receive personalized recommendations</li>
  </ul>
  
  <p>These advancements will make content clipping tools even more valuable in the years to come.</p>
</div>
`;

// Generate mock article data
export const generateMockArticle = (url: string, isRead = false, index = 0): Article => {
  const source = getSourceFromUrl(url);
  
  return {
    id: `mock-article-${index + 1}`,
    url,
    title: `Sample article from ${getSourceName(source)}`,
    summary: "This is an automatically generated summary of the article. It contains three sentences that capture the essence of the content. The AI has extracted the most important information.",
    source,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_read: isRead,
    content: mockContent,
    cover_image: "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
  };
};

// Generate mock article from pasted content
export const generateMockArticleFromContent = (content: string, index = 0): Article => {
  const format = detectContentFormat(content);
  const processedHtml = processContent(content, format);
  
  let title = '无标题文章';
  
  if (format === 'html') {
    const titleMatch = content.match(/<h1[^>]*>(.*?)<\/h1>/i) || 
                      content.match(/<h2[^>]*>(.*?)<\/h2>/i) ||
                      content.match(/<h3[^>]*>(.*?)<\/h3>/i) ||
                      content.match(/<title[^>]*>(.*?)<\/title>/i);
    
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
    } else {
      const firstParagraph = content.match(/<p[^>]*>(.*?)<\/p>/i);
      if (firstParagraph && firstParagraph[1]) {
        title = firstParagraph[1].replace(/<[^>]*>/g, '').trim().slice(0, 60);
      }
    }
  } else if (format === 'markdown') {
    const titleMatch = content.match(/^#\s+(.*)/m) || 
                      content.match(/^##\s+(.*)/m) ||
                      content.match(/^###\s+(.*)/m);
    
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
    } else {
      title = content.split('\n')[0].trim().slice(0, 60);
    }
  } else {
    title = content.split('\n')[0].trim().slice(0, 60);
  }
  
  let summary = '';
  
  if (format === 'html') {
    summary = content
      .replace(/<[^>]*>/g, '') 
      .replace(/\s+/g, ' ')    
      .trim()
      .slice(0, 200) + '...';
  } else {
    summary = content
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 200) + '...';
  }
  
  return {
    id: `mock-content-article-${index + 1}`,
    url: '',
    title,
    summary,
    source: 'other',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_read: false,
    content: processedHtml, 
    cover_image: "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
  };
};

// Sample mock data
export const getMockArticles = (): Article[] => [
  {
    id: "mock-1",
    url: "https://mp.weixin.qq.com/s/sample-wechat",
    title: "Understanding the Digital Transformation in Modern Business",
    summary: "Digital transformation is reshaping how businesses operate in the modern world. Companies must adapt to new technologies or risk falling behind competitors. The article explores key strategies for successful implementation.",
    source: "wechat",
    created_at: "2023-05-10T14:30:00Z",
    updated_at: "2023-05-10T14:30:00Z",
    is_read: true,
    content: mockContent,
    cover_image: "https://images.pexels.com/photos/3183183/pexels-photo-3183183.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
  },
  {
    id: "mock-2",
    url: "https://www.linkedin.com/posts/sample-linkedin",
    title: "5 Emerging Trends in Tech Leadership You Should Know About",
    summary: "Tech leadership is evolving with new methodologies and approaches gaining traction. Remote work has accelerated the need for adaptive leadership styles. Leaders who embrace empathy and continuous learning are seeing the best results.",
    source: "linkedin",
    created_at: "2023-05-15T09:45:00Z",
    updated_at: "2023-05-15T09:45:00Z",
    is_read: false,
    content: mockContent,
    cover_image: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
  },
  {
    id: "mock-3",
    url: "https://www.reddit.com/r/programming/comments/sample-reddit",
    title: "Why TypeScript Is Taking Over Frontend Development",
    summary: "TypeScript continues to gain popularity in frontend development circles. The type safety and tooling improvements provide significant advantages over plain JavaScript. Many major frameworks now recommend TypeScript as the default choice.",
    source: "reddit",
    created_at: "2023-05-18T16:20:00Z",
    updated_at: "2023-05-18T16:20:00Z",
    is_read: false,
    content: mockContent,
    cover_image: "https://images.pexels.com/photos/4164418/pexels-photo-4164418.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
  },
  {
    id: "mock-4",
    url: "https://www.example.com/blog/sample-article",
    title: "The Future of Sustainable Technology: Beyond Green Washing",
    summary: "Sustainable technology is moving beyond marketing hype to deliver real environmental benefits. Companies are finding that genuine sustainability initiatives can also improve the bottom line. The article examines case studies of successful implementations across various industries.",
    source: "other",
    created_at: "2023-05-20T11:15:00Z",
    updated_at: "2023-05-20T11:15:00Z",
    is_read: false,
    content: mockContent,
    cover_image: "https://images.pexels.com/photos/325111/pexels-photo-325111.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
  }
];