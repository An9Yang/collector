export async function directApiTest() {
  console.log('🔗 直接 API 测试...');
  
  const url = 'https://xhetlctjefqpjwkjdwc.supabase.co/rest/v1/articles?select=count';
  const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoZXRsY2N0amVmcXBqd2tqZHdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NTc3ODAsImV4cCI6MjA2MzUzMzc4MH0.21VBG2WbU6piVcHPAuzOoEmyDTS54dKw5fY3tM08b88';
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact'
      }
    });
    
    console.log('📊 响应状态:', response.status);
    console.log('📊 响应头:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ 错误响应:', errorText);
      return false;
    }
    
    const data = await response.text();
    console.log('✅ 成功响应:', data);
    return true;
    
  } catch (error) {
    console.error('❌ 请求异常:', error);
    return false;
  }
} 