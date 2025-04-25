import React, { useState, useRef } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { X, Link as LinkIcon, FileText, Eye, Edit2, Upload } from 'lucide-react';
import { getSourceFromUrl } from '../../utils/sourceUtils';
import ContentPreview from './ContentPreview';
import { detectFormatFromPaste, ContentFormat } from '../../utils/formatDetection';

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

  if (!isOpen) return null;

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
        onAddLink(url);
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
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    // 确保不会重复处理纯文本
    if (e.clipboardData.types.length === 1 && e.clipboardData.types[0] === 'text/plain') {
      return; // 让默认粘贴行为处理纯文本
    }
    
    try {
      // 检测粘贴的内容格式
      const formatResult = await detectFormatFromPaste(e.nativeEvent);
      
      if (typeof formatResult === 'string') {
        // 如果是字符串，表示是文本格式
        setDetectedFormat(formatResult);
        
        // 如果是HTML或富文本，获取HTML内容
        if (formatResult === 'html' && e.clipboardData.getData('text/html')) {
          e.preventDefault(); // 防止默认粘贴行为
          const htmlContent = e.clipboardData.getData('text/html');
          setContent(htmlContent);
        } else if (formatResult === 'rtf' && (e.clipboardData.getData('text/rtf') || e.clipboardData.getData('application/rtf'))) {
          e.preventDefault(); // 防止默认粘贴行为
          const rtfContent = e.clipboardData.getData('text/rtf') || e.clipboardData.getData('application/rtf');
          setContent(rtfContent);
        }
      } else {
        // 如果是对象，表示是二进制数据
        e.preventDefault(); // 防止默认粘贴行为
        setBinaryData(formatResult.data);
        setDetectedFormat(formatResult.format);
      }
      
      // 自动切换到预览模式
      setViewMode('preview');
    } catch (error) {
      console.error('粘贴处理错误:', error);
    }
  };

  // Determine badge color based on URL
  const getBadge = () => {
    if (!url || mode !== 'url') return null;
    
    try {
      new URL(url);
      const source = getSourceFromUrl(url);
      const sourceColors = {
        wechat: 'bg-green-500',
        linkedin: 'bg-blue-500',
        reddit: 'bg-orange-500',
        other: 'bg-gray-500',
      };
      
      const sourceNames = {
        wechat: 'WeChat',
        linkedin: 'LinkedIn',
        reddit: 'Reddit',
        other: 'Web Link',
      };
      
      return (
        <span className={`inline-block px-2 py-1 text-xs font-medium text-white rounded ${sourceColors[source]}`}>
          {sourceNames[source]}
        </span>
      );
    } catch (err) {
      return null;
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    // 清除二进制数据和检测到的格式
    setBinaryData(null);
    setDetectedFormat(null);
    // 当切换到编辑模式时，确保预览模式会更新
    if (viewMode === 'preview') {
      setViewMode('edit');
    }
  };

  // 处理内容变化回调
  const handleProcessedContentChange = (processed: string) => {
    setProcessedContent(processed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div 
        className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-3xl transform transition-all"
        style={{ 
          animation: 'modalSlideIn 0.3s ease-out forwards',
          maxHeight: '90vh',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X size={24} />
        </button>
        
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 2rem)' }}>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">添加新内容</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            通过URL添加内容或直接粘贴
          </p>

          {/* Mode selector */}
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setMode('url')}
              className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                mode === 'url'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              <LinkIcon size={16} className="mr-2" />
              通过URL添加
            </button>
            <button
              onClick={() => setMode('content')}
              className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                mode === 'content'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              <FileText size={16} className="mr-2" />
              粘贴内容
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            {mode === 'url' ? (
              <Input
                id="url-input"
                placeholder="https://example.com/article"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                error={error}
                label="URL"
                required
              />
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
                      accept=".docx,.xlsx,.xls,.rtf,.md,.html,.htm,.txt"
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
  );
};

export default AddLinkModal;