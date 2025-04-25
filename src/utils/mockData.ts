import { Article } from '../types';
import { getSourceFromUrl, getSourceName } from './sourceUtils';
import { v4 as uuidv4 } from 'uuid';
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
export const generateMockArticle = (url: string, isRead = false): Article => {
  const source = getSourceFromUrl(url);
  
  return {
    id: uuidv4(),
    url,
    title: `Sample article from ${getSourceName(source)}`,
    summary: "This is an automatically generated summary of the article. It contains three sentences that capture the essence of the content. The AI has extracted the most important information.",
    source,
    createdAt: new Date().toISOString(),
    isRead,
    content: mockContent,
    coverImage: "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
  };
};

// Generate mock article from pasted content
export const generateMockArticleFromContent = (content: string): Article => {
  // 检测内容的格式并处理
  const format = detectContentFormat(content);
  const processedHtml = processContent(content, format);
  
  // 提取标题（尝试从 HTML 或原始内容中获取第一行作为标题）
  let title = '无标题文章';
  
  if (format === 'html') {
    // 尝试从 HTML 中提取标题
    const titleMatch = content.match(/<h1[^>]*>(.*?)<\/h1>/i) || 
                      content.match(/<h2[^>]*>(.*?)<\/h2>/i) ||
                      content.match(/<h3[^>]*>(.*?)<\/h3>/i) ||
                      content.match(/<title[^>]*>(.*?)<\/title>/i);
    
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
    } else {
      // 从内容中提取第一段
      const firstParagraph = content.match(/<p[^>]*>(.*?)<\/p>/i);
      if (firstParagraph && firstParagraph[1]) {
        // 删除HTML标签
        title = firstParagraph[1].replace(/<[^>]*>/g, '').trim().slice(0, 60);
      }
    }
  } else if (format === 'markdown') {
    // 从 Markdown 中提取标题
    const titleMatch = content.match(/^#\s+(.*)/m) || 
                      content.match(/^##\s+(.*)/m) ||
                      content.match(/^###\s+(.*)/m);
    
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
    } else {
      // 使用第一行作为标题
      title = content.split('\n')[0].trim().slice(0, 60);
    }
  } else {
    // 纯文本，使用第一行
    title = content.split('\n')[0].trim().slice(0, 60);
  }
  
  // 生成摘要（简单地提取部分内容，实际应用中可能需要 AI 生成）
  let summary = '';
  
  if (format === 'html') {
    // 提取纯文本并用作摘要
    summary = content
      .replace(/<[^>]*>/g, '') // 移除 HTML 标签
      .replace(/\s+/g, ' ')    // 合并空白字符
      .trim()
      .slice(0, 200) + '...';
  } else {
    // Markdown 或纯文本
    summary = content
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 200) + '...';
  }
  
  return {
    id: uuidv4(),
    url: '',
    title,
    summary,
    source: 'other',
    createdAt: new Date().toISOString(),
    isRead: false,
    content: processedHtml, // 使用处理后的 HTML 内容
    coverImage: "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
  };
};

// Sample mock data
export const getMockArticles = (): Article[] => [
  {
    id: "1",
    url: "https://mp.weixin.qq.com/s/sample-wechat",
    title: "Understanding the Digital Transformation in Modern Business",
    summary: "Digital transformation is reshaping how businesses operate in the modern world. Companies must adapt to new technologies or risk falling behind competitors. The article explores key strategies for successful implementation.",
    source: "wechat",
    createdAt: "2023-05-10T14:30:00Z",
    isRead: true,
    content: mockContent,
    coverImage: "https://images.pexels.com/photos/3183183/pexels-photo-3183183.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
  },
  {
    id: "2",
    url: "https://www.linkedin.com/posts/sample-linkedin",
    title: "5 Emerging Trends in Tech Leadership You Should Know About",
    summary: "Tech leadership is evolving with new methodologies and approaches gaining traction. Remote work has accelerated the need for adaptive leadership styles. Leaders who embrace empathy and continuous learning are seeing the best results.",
    source: "linkedin",
    createdAt: "2023-05-15T09:45:00Z",
    isRead: false,
    content: mockContent,
    coverImage: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
  },
  {
    id: "3",
    url: "https://www.reddit.com/r/programming/comments/sample-reddit",
    title: "Why TypeScript Is Taking Over Frontend Development",
    summary: "TypeScript continues to gain popularity in frontend development circles. The type safety and tooling improvements provide significant advantages over plain JavaScript. Many major frameworks now recommend TypeScript as the default choice.",
    source: "reddit",
    createdAt: "2023-05-18T16:20:00Z",
    isRead: false,
    content: mockContent,
    coverImage: "https://images.pexels.com/photos/4164418/pexels-photo-4164418.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
  },
  {
    id: "4",
    url: "https://www.example.com/blog/sample-article",
    title: "The Future of Sustainable Technology: Beyond Green Washing",
    summary: "Sustainable technology is moving beyond marketing hype to deliver real environmental benefits. Companies are finding that genuine sustainability initiatives can also improve the bottom line. The article examines case studies of successful implementations across various industries.",
    source: "other",
    createdAt: "2023-05-20T11:15:00Z",
    isRead: false,
    content: mockContent,
    coverImage: "https://images.pexels.com/photos/325111/pexels-photo-325111.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
  }
];