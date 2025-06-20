import { describe, test, expect } from 'vitest';
import { supabase } from '../lib/supabase';

describe('简单连接测试', () => {
  test('应该能够进行最基本的健康检查', async () => {
    console.log('🔍 开始最简单的连接测试...');
    
    // 最基本的健康检查
    const { data, error } = await supabase
      .from('articles')
      .select('count', { count: 'exact', head: true });
    
    console.log('📊 数据:', data);
    console.log('❗ 错误:', error);
    
    if (error) {
      console.error('详细错误信息:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      expect(error.message).toBeDefined();
    } else {
      console.log('✅ 基本连接成功！');
      expect(data).toBeDefined();
    }
  });
}); 