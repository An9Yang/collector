export async function testNetworkAccess() {
  console.log('🌐 测试网络访问...');
  
  const testUrls = [
    'https://httpbin.org/get', // 通用测试接口
    'https://jsonplaceholder.typicode.com/posts/1', // 另一个测试接口
    'https://xhetlctjefqpjwkjdwc.supabase.co', // Supabase 根域名
    'https://xhetlctjefqpjwkjdwc.supabase.co/rest/v1/articles?select=count' // 完整 API
  ];
  
  for (const url of testUrls) {
    try {
      console.log(`🔗 测试: ${url}`);
      const response = await fetch(url, { 
        method: 'HEAD',
        mode: 'no-cors' // 避免 CORS 问题
      });
      console.log(`✅ ${url} - 状态: ${response.status || '可访问'}`);
    } catch (error) {
      console.error(`❌ ${url} - 错误:`, error);
    }
  }
}

export async function testSupabaseDirectly() {
  console.log('🎯 直接测试 Supabase API...');
  
  const headers = {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoZXRsY2N0amVmcXBqd2tqZHdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NTc3ODAsImV4cCI6MjA2MzUzMzc4MH0.21VBG2WbU6piVcHPAuzOoEmyDTS54dKw5fY3tM08b88',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoZXRsY2N0amVmcXBqd2tqZHdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NTc3ODAsImV4cCI6MjA2MzUzMzc4MH0.21VBG2WbU6piVcHPAuzOoEmyDTS54dKw5fY3tM08b88',
    'Content-Type': 'application/json'
  };
  
  try {
    const response = await fetch(
      'https://xhetlctjefqpjwkjdwc.supabase.co/rest/v1/articles?select=count', 
      { 
        method: 'GET',
        headers 
      }
    );
    
    console.log('📊 状态码:', response.status);
    console.log('📊 状态文本:', response.statusText);
    
    if (response.ok) {
      const data = await response.text();
      console.log('✅ 响应数据:', data);
      return true;
    } else {
      const errorText = await response.text();
      console.error('❌ 错误内容:', errorText);
      return false;
    }
    
  } catch (error) {
    console.error('❌ 网络异常:', error);
    return false;
  }
} 