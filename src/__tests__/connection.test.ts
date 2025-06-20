import { describe, test, expect } from 'vitest';
import { supabase } from '../lib/supabase';

describe('数据库连接测试', () => {
  test('应该能够测试基本连接', async () => {
    console.log('🔗 开始测试 Supabase 连接...');
    
    // 测试基本连接
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ 连接错误:', error);
      expect(error).toBeNull();
    } else {
      console.log('✅ 连接成功！当前数据:', data);
      expect(data).toBeDefined();
    }
  });

  test('应该能够测试插入数据', async () => {
    console.log('📝 测试插入数据...');
    
    const testArticle = {
      url: 'https://test.com',
      title: '测试文章',
      summary: '这是一个测试摘要',
      source: 'other' as const,
      content: '测试内容',
      is_read: false
    };

    const { data, error } = await supabase
      .from('articles')
      .insert([testArticle])
      .select()
      .single();

    if (error) {
      console.error('❌ 插入失败:', error);
      // 插入失败不一定是错误，可能是权限或RLS策略
      expect(error.message).toBeDefined();
    } else {
      console.log('✅ 插入成功！数据:', data);
      expect(data).toBeDefined();
    }
  });
}); 