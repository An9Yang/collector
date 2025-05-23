import { supabase } from './config/supabase';

// 测试 Supabase 连接
async function testSupabaseConnection() {
  try {
    console.log('🔗 正在测试 Supabase 连接...');
    
    // 尝试查询数据库
    const { data, error } = await supabase
      .from('articles')
      .select('count(*)')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase 连接失败:', error.message);
      return false;
    }
    
    console.log('✅ Supabase 连接成功！');
    console.log('📊 当前文章数量:', data);
    return true;
  } catch (error) {
    console.error('❌ 连接测试出错:', error);
    return false;
  }
}

// 仅在直接运行此文件时执行测试
if (import.meta.url === new URL(import.meta.url).href) {
  testSupabaseConnection();
}

export { testSupabaseConnection }; 