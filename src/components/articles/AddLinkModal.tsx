import React, { useState, useRef } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { X, Link as LinkIcon, FileText, Eye, Edit2, Upload, Download } from 'lucide-react';
import { getSourceFromUrl } from '../../utils/sourceUtils';
import ContentPreview from './ContentPreview';
import { detectFormatFromText, ContentFormat } from '../../utils/formatDetection';
import { scrapeWebContent } from '../../services/webScraper';
import DOMPurify from 'dompurify';

interface AddLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLink: (url: string) => void;
  onAddContent?: (content: string) => void;
  isLoading: boolean;
}

const AddLinkModal: React.FC<AddLinkModalProps> = ({
  isOpen,
  onClose,
  onAddLink,
  onAddContent,
  isLoading,
}) => {
  const [url, setUrl] = useState('');
  const [content, setContent] = useState('');
  const [processedContent, setProcessedContent] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'url' | 'content'>('url');
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [binaryData, setBinaryData] = useState<ArrayBuffer | null>(null);
  const [detectedFormat, setDetectedFormat] = useState<ContentFormat | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFetchingContent, setIsFetchingContent] = useState(false);
  const [urlFetched, setUrlFetched] = useState(false);
  const [fetchedTitle, setFetchedTitle] = useState('');

  if (!isOpen) return null;

  // 从URL获取网页内容
  const fetchUrlContent = async () => {
    // 验证URL
    if (!url.trim()) {
      setError('请输入URL');
      return;
    }
    
    try {
      // 验证URL格式
      new URL(url);
      setError('');
      
      // 开始抓取
      setIsFetchingContent(true);
      
      // 调用抓取服务
      const scraped = await scrapeWebContent(url);
      
      if (scraped.error) {
        setError(`抓取失败：${scraped.error}`);
        setIsFetchingContent(false);
        return;
      }
      
      // 使用最适合的内容格式
      // 优先使用结构化内容，然后是HTML内容，最后是纯文本
      let contentToUse = '';
      let formatToUse: ContentFormat = 'plaintext';
      
      if (scraped.structuredContent) {
        contentToUse = scraped.structuredContent;
        formatToUse = 'markdown'; // 结构化内容通常会格式化为Markdown
      } else if (scraped.htmlContent) {
        contentToUse = scraped.htmlContent;
        formatToUse = 'html';
      } else {
        contentToUse = scraped.content || scraped.plainText || '';
        formatToUse = 'plaintext';
      }
      
      // 设置抓取的内容
      setContent(contentToUse);
      setFetchedTitle(scraped.title);
      setUrlFetched(true);
      
      // 自动切换到内容模式
      setMode('content');
      
      // 设置为预览模式
      setViewMode('preview');
      
      // 设置检测到的格式
      setDetectedFormat(formatToUse);
      
      console.log(`抓取内容成功: 来源类型=[${scraped.sourceType || '未知'}], 格式=[${formatToUse}]`);
      
    } catch (err) {
      console.error('抓取内容失败:', err);
      setError(err instanceof Error ? err.message : '请输入有效的URL');
    } finally {
      setIsFetchingContent(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'url') {
      // Basic validation
      if (!url.trim()) {
        setError('请输入URL');
        return;
      }
      
      // Simple URL validation
      try {
        new URL(url);
        setError('');
        
        // 如果已经抓取了内容，就提交内容而不是URL
        if (urlFetched && content.trim()) {
          onAddContent?.(processedContent || content);
        } else {
          // 否则提交URL
          onAddLink(url);
        }
      } catch (err) {
        setError('请输入有效的URL');
      }
    } else {
      // Content validation
      if (!content.trim() && !binaryData) {
        setError('请输入或上传内容');
        return;
      }
      
      setError('');
      // 使用处理后的内容或原始内容
      onAddContent?.(processedContent || content);
    }
  };

  // 处理文件上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      if (!event.target || !event.target.result) return;
      
      const result = event.target.result as ArrayBuffer;
      setBinaryData(result);
      
      // 根据文件类型设置检测到的格式
      if (file.name.endsWith('.docx')) {
        setDetectedFormat('docx');
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setDetectedFormat('xlsx');
      } else if (file.name.endsWith('.rtf')) {
        setDetectedFormat('rtf');
      } else if (file.name.endsWith('.md')) {
        setDetectedFormat('markdown');
        // 对于文本格式，读取为文本而非二进制
        const text = new TextDecoder('utf-8').decode(result);
        setContent(text);
        setBinaryData(null);
      } else if (file.name.endsWith('.html') || file.name.endsWith('.htm')) {
        setDetectedFormat('html');
        // 对于HTML格式，读取为文本而非二进制
        const text = new TextDecoder('utf-8').decode(result);
        setContent(text);
        setBinaryData(null);
      } else {
        // 对于未知格式，尝试作为文本读取
        try {
          const text = new TextDecoder('utf-8').decode(result);
          setContent(text);
          setBinaryData(null);
          setDetectedFormat('plaintext');
        } catch (e) {
          // 如果不是文本格式，保留为二进制
          console.error('无法将文件读取为文本:', e);
          setBinaryData(result);
          setDetectedFormat('plaintext');
        }
      }
      
      // 自动切换到预览模式
      setViewMode('preview');
    };
    
    reader.onerror = () => {
      setError('文件读取失败');
    };
    
    reader.readAsArrayBuffer(file);
  };

  // 处理粘贴事件
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    // 尝试获取HTML内容（如果可用）
    const pastedHtml = e.clipboardData.getData('text/html');
    const pastedText = e.clipboardData.getData('text/plain');
    
    if (!pastedText && !pastedHtml) return;
    
    // 优先使用HTML内容（如果可用且有效）
    if (pastedHtml && pastedHtml.trim().length > 0 && /<[a-z][\s\S]*>/i.test(pastedHtml)) {
      // 清理HTML内容
      const cleanHtml = DOMPurify.sanitize(pastedHtml, {
        ALLOWED_TAGS: ['p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'ul', 'ol', 'li', 'strong', 'em', 'u', 's', 'a', 'img', 'pre', 'code', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'title', 'style', 'class'],
        ALLOW_DATA_ATTR: false
      });
      
      setContent(cleanHtml);
      setDetectedFormat('html');
      setViewMode('preview'); // 自动切换到预览模式
      e.preventDefault(); // 阻止默认粘贴行为
      return;
    }
    
    // 如果没有HTML或HTML无效，使用文本格式检测
    const format = detectFormatFromText(pastedText);
    
    // 设置检测到的格式
    setDetectedFormat(format);
    
    // 如果是URL，自动切换到URL模式
    if (format === 'url') {
      try {
        new URL(pastedText);
        setUrl(pastedText);
        setMode('url');
        e.preventDefault(); // 阻止默认粘贴行为
        return;
      } catch (err) {
        // 不是有效的URL，继续作为普通文本处理
      }
    }
    
    // 对于其他格式，保持在内容模式下
    setContent(pastedText);
    
    // 如果检测到格式是Markdown，自动切换到预览模式
    if (format === 'markdown') {
      setViewMode('preview');
    }
    
    console.log(`粘贴内容格式: ${format}`);
  };

  // Determine badge color based on URL
  const getBadge = () => {
    if (!url) return null;
    
    try {
      const source = getSourceFromUrl(url);
      if (!source) return null;
      
      // 根据来源设置颜色
      let badgeColor = '';
      let sourceName = '';
      
      // 使用类型安全的方式处理
      // getSourceFromUrl 只能返回 'wechat', 'linkedin', 'reddit' 或 'other'
      if (source === 'wechat') {
        badgeColor = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        sourceName = 'WeChat';
      } else if (source === 'linkedin') {
        badgeColor = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
        sourceName = 'LinkedIn';
      } else if (source === 'reddit') {
        badgeColor = 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
        sourceName = 'Reddit';
      } else {
        // 处理 'other' 类型和其他未知类型
        badgeColor = 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
        sourceName = 'Web';
      }
      
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium ${badgeColor}`}>
          {sourceName}
        </span>
      );
    } catch (e) {
      return null;
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    
    // 如果内容为空，重置格式
    if (!e.target.value.trim()) {
      setDetectedFormat(null);
    }
  };

  // 处理内容变化回调
  const handleProcessedContentChange = (processed: string) => {
    setProcessedContent(processed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="w-full max-w-3xl">
        <div className="flex flex-col bg-white dark:bg-gray-900 rounded-lg shadow-lg max-h-[90vh] overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">添加内容</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="p-4 overflow-y-auto">
            {/* 选项卡切换 */}
            <div className="flex mb-4 border-b dark:border-gray-700">
              <button
                type="button"
                onClick={() => {
                  setMode('url');
                  setUrlFetched(false);
                  setError('');
                }}
                className={`py-2 px-4 ${mode === 'url' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
              >
                <div className="flex items-center">
                  <LinkIcon size={16} className="mr-2" />
                  链接
                </div>
              </button>
              <button
                type="button"
                onClick={() => setMode('content')}
                className={`py-2 px-4 ${mode === 'content' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
              >
                <div className="flex items-center">
                  <FileText size={16} className="mr-2" />
                  粘贴内容
                </div>
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              {mode === 'url' ? (
                <div className="mb-4">
                  <label htmlFor="url-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    URL
                  </label>
                  <div className="relative">
                    <Input
                      type="url"
                      id="url-input"
                      placeholder="输入文章链接..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="pr-10"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <LinkIcon className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                  
                  {/* 添加抓取内容按钮 */}
                  <div className="mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={fetchUrlContent}
                      className="w-full flex items-center justify-center"
                      isLoading={isFetchingContent}
                      disabled={isFetchingContent || !url.trim()}
                    >
                      {isFetchingContent ? '抓取中...' : 
                       urlFetched ? '重新抓取内容' : '抓取网页内容'}
                      {!isFetchingContent && <Download size={16} className="ml-2" />}
                    </Button>
                  </div>
                  
                  {/* 抓取成功信息显示 */}
                  {urlFetched && !isFetchingContent && (
                    <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                      <p className="text-sm text-green-700 dark:text-green-400">
                        ✓ 已成功抓取: {fetchedTitle || '网页内容'}
                      </p>
                    </div>
                  )}
                  
                  {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
                </div>
              ) : (
                <div className="mb-4">
                  {/* 内容模式下的视图切换 */}
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor="content-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      内容
                    </label>
                    
                    <div className="flex items-center space-x-2">
                      {/* 文件上传按钮 */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center px-3 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
                      >
                        <Upload size={12} className="mr-1" />
                        上传文件
                      </button>
                      
                      {/* 隐藏的文件输入 */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                        accept=".docx,.xlsx,.xls,.md,.txt,.rtf,.html,.htm"
                      />
                      
                      {/* 编辑/预览切换 */}
                      <div className="flex border rounded-md overflow-hidden">
                        <button 
                          type="button"
                          onClick={() => setViewMode('edit')}
                          className={`flex items-center px-3 py-1 text-xs ${
                            viewMode === 'edit' 
                              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          <Edit2 size={12} className="mr-1" />
                          编辑
                        </button>
                        <button 
                          type="button"
                          onClick={() => setViewMode('preview')}
                          className={`flex items-center px-3 py-1 text-xs ${
                            viewMode === 'preview' 
                              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          <Eye size={12} className="mr-1" />
                          预览
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 编辑/预览区域 */}
                  {viewMode === 'edit' ? (
                    <textarea
                      id="content-input"
                      placeholder="在此粘贴您的文章内容..."
                      value={content}
                      onChange={handleContentChange}
                      onPaste={handlePaste}
                      className="w-full h-64 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:border-gray-700"
                      required={!binaryData}
                    />
                  ) : (
                    <div className="h-64 border rounded-md overflow-y-auto">
                      <ContentPreview 
                        content={content} 
                        binaryData={binaryData || undefined}
                        format={detectedFormat || undefined}
                        onChange={handleProcessedContentChange}
                      />
                    </div>
                  )}
                  
                  {/* 文件信息显示（如果有） */}
                  {binaryData && detectedFormat && (
                    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        已加载 
                        {detectedFormat === 'docx' ? ' Word 文档' : 
                         detectedFormat === 'xlsx' ? ' Excel 表格' :
                         detectedFormat === 'rtf' ? ' RTF 文档' : ' 文件'}
                      </p>
                    </div>
                  )}
                  
                  {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
                </div>
              )}
              
              {mode === 'url' && getBadge() && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">检测到的来源:</p>
                  {getBadge()}
                </div>
              )}
              
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  isLoading={isLoading}
                  disabled={isLoading}
                >
                  {isLoading ? '保存中...' : '保存内容'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddLinkModal;
