import { supabase } from './config/supabase';

export async function simpleTest() {
  console.log('🔍 开始最简单的连接测试...');
  
  try {
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
      return false;
    }
    
    console.log('✅ 基本连接成功！');
    return true;
  } catch (err) {
    console.error('❌ 异常:', err);
    return false;
  }
} 