import { supabase } from './config/supabase';

// 简单的连接测试
export async function testConnection() {
  console.log('🔗 开始测试 Supabase 连接...');
  
  try {
    // 测试基本连接
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ 连接错误:', error);
      return false;
    }
    
    console.log('✅ 连接成功！当前数据:', data);
    return true;
  } catch (err) {
    console.error('❌ 连接异常:', err);
    return false;
  }
}

// 测试插入数据
export async function testInsert() {
  console.log('📝 测试插入数据...');
  
  try {
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
      return false;
    }

    console.log('✅ 插入成功！数据:', data);
    return true;
  } catch (err) {
    console.error('❌ 插入异常:', err);
    return false;
  }
} 