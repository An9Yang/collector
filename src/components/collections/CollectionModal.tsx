import React, { useState, useEffect } from 'react';
import { Collection, CollectionInsert, CollectionUpdate } from '../../types';
import { useCollections } from '../../context/CollectionsContext';
import { X } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface CollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection?: Collection; // 如果提供，则为编辑模式
  mode: 'create' | 'edit';
}

// 预设的图标选项
const ICON_OPTIONS = [
  '📁', '📋', '📚', '📝', '📊', '📈', '💼', '🎯', '⭐', '🔖',
  '🏷️', '🗂️', '📖', '📑', '📄', '📰', '🧾', '📘', '📙', '📗',
  '📕', '📓', '🔥', '💡', '🎨', '⚡', '🚀', '🎪', '🎭', '🏆'
];

// 预设的颜色选项
const COLOR_OPTIONS = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#10B981', // green
  '#F59E0B', // yellow
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#84CC16', // lime
  '#F97316', // orange
  '#6366F1', // indigo
];

const CollectionModal: React.FC<CollectionModalProps> = ({
  isOpen,
  onClose,
  collection,
  mode
}) => {
  const { createCollection, updateCollection, isLoading } = useCollections();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '📁',
    color: '#3B82F6'
  });
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // 编辑模式时初始化表单数据
  useEffect(() => {
    if (mode === 'edit' && collection) {
      setFormData({
        name: collection.name,
        description: collection.description || '',
        icon: collection.icon,
        color: collection.color
      });
    } else {
      // 创建模式时重置表单
      setFormData({
        name: '',
        description: '',
        icon: '📁',
        color: '#3B82F6'
      });
    }
    setErrors({});
  }, [mode, collection, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '收藏夹名称不能为空';
    }
    
    if (formData.name.trim().length > 50) {
      newErrors.name = '收藏夹名称不能超过50个字符';
    }
    
    if (formData.description.length > 200) {
      newErrors.description = '描述不能超过200个字符';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (mode === 'create') {
        const newCollectionData: CollectionInsert = {
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          icon: formData.icon,
          color: formData.color,
          is_default: false
        };
        
        await createCollection(newCollectionData);
      } else if (mode === 'edit' && collection) {
        const updateData: CollectionUpdate = {
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          icon: formData.icon,
          color: formData.color
        };
        
        await updateCollection(collection.id, updateData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving collection:', error);
      setErrors({ general: '保存失败，请重试' });
    }
  };

  const handleIconSelect = (icon: string) => {
    setFormData(prev => ({ ...prev, icon }));
  };

  const handleColorSelect = (color: string) => {
    setFormData(prev => ({ ...prev, color }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {mode === 'create' ? '创建收藏夹' : '编辑收藏夹'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {/* 收藏夹名称 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              收藏夹名称 *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="输入收藏夹名称..."
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                errors.name ? 'border-red-500' : ''
              }`}
              maxLength={50}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          {/* 描述 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="添加收藏夹描述..."
              className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none ${
                errors.description ? 'border-red-500' : ''
              }`}
              rows={3}
              maxLength={200}
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description}</p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formData.description.length}/200
            </p>
          </div>

          {/* 图标选择 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              选择图标
            </label>
            <div className="grid grid-cols-10 gap-2 max-h-24 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-md p-2">
              {ICON_OPTIONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => handleIconSelect(icon)}
                  className={`p-2 text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors ${
                    formData.icon === icon
                      ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500'
                      : ''
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* 颜色选择 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              选择颜色
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleColorSelect(color)}
                  className={`w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:scale-110 transition-transform ${
                    formData.color === color
                      ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-gray-800'
                      : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* 预览 */}
          <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">预览:</p>
            <div className="flex items-center space-x-3">
              <span className="text-lg">{formData.icon}</span>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formData.name || '收藏夹名称'}
                </p>
                {formData.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formData.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 错误信息 */}
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-red-600 dark:text-red-400 text-sm">{errors.general}</p>
            </div>
          )}

          {/* 按钮 */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              取消
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              disabled={isLoading}
            >
              {mode === 'create' ? '创建' : '保存'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CollectionModal; 