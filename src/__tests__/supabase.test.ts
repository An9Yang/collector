import { describe, test, expect } from 'vitest';
import { supabase } from '../utils/supabase';

describe('Supabase 连接测试', () => {
  test('应该能够成功连接到 Supabase', async () => {
    console.log('🔗 正在测试 Supabase 连接...');
    
    // 尝试查询数据库
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase 连接失败:', error.message);
      expect(error).toBeNull();
    } else {
      console.log('✅ Supabase 连接成功！');
      console.log('📊 查询到的数据:', data);
      expect(data).toBeDefined();
    }
  });
}); 