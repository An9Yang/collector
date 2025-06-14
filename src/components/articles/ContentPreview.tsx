import React, { useState, useEffect } from 'react';
import { ContentFormat, detectContentFormat, processContent } from '../../utils/formatDetection';
import { docxToHtml, xlsxToHtml, rtfToHtml } from '../../utils/documentConverter';
import ImageGallery from './ImageGallery';

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

interface ContentPreviewProps {
  content: string;
  binaryData?: ArrayBuffer;
  format?: ContentFormat;
  images?: ImageInfo[];
  onChange?: (processedContent: string) => void;
}

const ContentPreview: React.FC<ContentPreviewProps> = ({ 
  content, 
  binaryData, 
  format: providedFormat,
  images,
  onChange 
}) => {
  const [format, setFormat] = useState<ContentFormat>(providedFormat || 'plaintext');
  const [processedContent, setProcessedContent] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  useEffect(() => {
    const processContentData = async () => {
      setIsProcessing(true);
      
      try {
        // 如果提供了格式，使用提供的格式，否则检测格式
        const detectedFormat = providedFormat || detectContentFormat(content);
        setFormat(detectedFormat);
        
        let processed = '';
        
        // 处理二进制格式
        if (binaryData) {
          switch (detectedFormat) {
            case 'docx':
              processed = await docxToHtml(binaryData);
              break;
            case 'xlsx':
              processed = await xlsxToHtml(binaryData);
              break;
            case 'rtf':
              processed = await rtfToHtml(binaryData);
              break;
            default:
              // 对于其他类型，尝试将二进制数据转换为文本
              processed = processContent(
                new TextDecoder('utf-8').decode(binaryData), 
                detectedFormat
              );
          }
        } else {
          // 处理文本内容
          processed = processContent(content, detectedFormat);
        }
        
        setProcessedContent(processed);
        
        // 通知父组件处理后的内容
        if (onChange) {
          onChange(processed);
        }
      } catch (error: any) {
        console.error('内容处理错误:', error);
        setProcessedContent(`<div class="article-content"><p>内容处理失败: ${error?.message || '未知错误'}</p></div>`);
      } finally {
        setIsProcessing(false);
      }
    };
    
    if (!content.trim() && !binaryData) {
      setProcessedContent('');
      return;
    }
    
    processContentData();
  }, [content, binaryData, providedFormat, onChange]);
  
  // 如果没有内容且不是处理中，显示提示
  if ((!content.trim() && !binaryData) && !isProcessing && (!images || images.length === 0)) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-700 rounded-md">
        请粘贴内容或添加链接以预览
      </div>
    );
  }
  
  // 处理中显示加载状态
  if (isProcessing) {
    return (
      <div className="p-4 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="mt-2 text-gray-600 dark:text-gray-400">处理中，请稍候...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 图片画廊 */}
      {images && images.length > 0 && (
        <ImageGallery images={images} />
      )}

      {/* 内容预览 */}
      {processedContent && (
        <div className="border rounded-md">
          {/* 格式指示器 */}
          <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">检测到的格式:</span>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                {format === 'html' ? 'HTML' : 
                 format === 'markdown' ? 'Markdown' : 
                 format === 'docx' ? 'Word文档' :
                 format === 'xlsx' ? 'Excel表格' :
                 format === 'rtf' ? 'RTF文档' :
                 '纯文本'}
              </span>
            </div>
          </div>
          
          {/* 内容预览 */}
          <div className="p-4 max-h-96 overflow-y-auto">
            <div 
              className="prose prose-lg max-w-none dark:prose-invert prose-img:rounded-lg prose-img:shadow-lg"
              dangerouslySetInnerHTML={{ __html: processedContent }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentPreview; 