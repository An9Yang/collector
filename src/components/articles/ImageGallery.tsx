import React, { useState } from 'react';
import { Image, Download, ExternalLink, Eye, EyeOff } from 'lucide-react';

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

interface ImageGalleryProps {
  images: ImageInfo[];
  title?: string;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images }) => {
  const [showGallery, setShowGallery] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageInfo | null>(null);

  if (!images || images.length === 0) {
    return null;
  }

  const downloadedImages = images.filter(img => img.downloaded);
  const failedImages = images.filter(img => !img.downloaded);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const downloadImage = async (imageInfo: ImageInfo) => {
    if (!imageInfo.localUrl) return;
    
    try {
      const response = await fetch(`http://localhost:3001${imageInfo.localUrl}`);
      if (!response.ok) throw new Error('下载失败');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = imageInfo.filename || 'image';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('下载图片失败:', error);
    }
  };

  return (
    <div className="border rounded-lg bg-gray-50 dark:bg-gray-800 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Image className="w-5 h-5 text-blue-500" />
          <h3 className="font-medium text-gray-900 dark:text-gray-100">
            图片内容 ({images.length} 张)
          </h3>
          {downloadedImages.length > 0 && (
            <span className="text-sm text-green-600 dark:text-green-400">
              {downloadedImages.length} 张已下载
            </span>
          )}
          {failedImages.length > 0 && (
            <span className="text-sm text-orange-600 dark:text-orange-400">
              {failedImages.length} 张下载失败
            </span>
          )}
        </div>
        <button
          onClick={() => setShowGallery(!showGallery)}
          className="flex items-center space-x-1 px-3 py-1 text-sm rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
        >
          {showGallery ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span>{showGallery ? '隐藏' : '显示'}</span>
        </button>
      </div>

      {showGallery && (
        <div className="space-y-4">
          {/* 成功下载的图片 */}
          {downloadedImages.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                本地图片 ({downloadedImages.length})
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {downloadedImages.map((image, index) => (
                  <div key={index} className="group relative">
                    <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                      <img
                        src={`http://localhost:3001${image.localUrl}`}
                        alt={image.alt}
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => setSelectedImage(image)}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 text-xs">加载失败</div>';
                          }
                        }}
                      />
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => downloadImage(image)}
                        className="p-1 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70"
                        title="下载图片"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                    </div>
                    {image.alt && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate" title={image.alt}>
                        {image.alt}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {formatFileSize(image.size)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 下载失败的图片 */}
          {failedImages.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                外部图片 ({failedImages.length})
              </h4>
              <div className="space-y-2">
                {failedImages.map((image, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded border">
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                        {image.alt || '无描述'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {image.originalUrl}
                      </p>
                    </div>
                    <button
                      onClick={() => window.open(image.originalUrl, '_blank')}
                      className="ml-2 p-1 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400"
                      title="在新窗口打开"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 图片预览模态框 */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-4xl max-h-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    {selectedImage.alt || '图片预览'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatFileSize(selectedImage.size)} • {selectedImage.contentType}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadImage(selectedImage);
                    }}
                    className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                  >
                    下载
                  </button>
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </div>
            <div className="max-h-96 overflow-auto">
              <img
                src={`http://localhost:3001${selectedImage.localUrl}`}
                alt={selectedImage.alt}
                className="w-full h-auto"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery; 