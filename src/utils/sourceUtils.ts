import { Article } from '../types';

// Determine source based on URL
export const getSourceFromUrl = (url: string): Article['source'] => {
  if (url.includes('weixin') || url.includes('wechat')) {
    return 'wechat';
  } else if (url.includes('linkedin')) {
    return 'linkedin';
  } else if (url.includes('reddit')) {
    return 'reddit';
  } else if (url.includes('twitter.com') || url.includes('t.co')) {
    return 'twitter';
  } else if (url.includes('x.com')) {
    return 'x';
  } else if (url.includes('github.com')) {
    return 'github';
  }
  return 'other';
};

// Get source icon color
export const getSourceColor = (source: Article['source']): string => {
  switch (source) {
    case 'wechat':
      return 'bg-green-500';
    case 'linkedin':
      return 'bg-blue-500';
    case 'reddit':
      return 'bg-orange-500';
    case 'twitter':
    case 'x':
      return 'bg-blue-500';
    case 'github':
      return 'bg-gray-500';
    default:
      return 'bg-gray-500';
  }
};

// Get source display name
export const getSourceName = (source: Article['source']): string => {
  switch (source) {
    case 'wechat':
      return 'WeChat';
    case 'linkedin':
      return 'LinkedIn';
    case 'reddit':
      return 'Reddit';
    case 'twitter':
      return 'Twitter';
    case 'x':
      return 'X';
    case 'github':
      return 'GitHub';
    default:
      return 'Web';
  }
};