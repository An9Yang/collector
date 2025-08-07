// 调试环境变量
export function debugEnvironmentVariables() {
  console.log('=== 环境变量调试信息 ===');
  console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
  console.log('VITE_API_URL type:', typeof import.meta.env.VITE_API_URL);
  console.log('VITE_API_URL === "direct":', import.meta.env.VITE_API_URL === 'direct');
  console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '已设置' : '未设置');
  console.log('VITE_AZURE_OPENAI_ENDPOINT:', import.meta.env.VITE_AZURE_OPENAI_ENDPOINT ? '已设置' : '未设置');
  console.log('VITE_AZURE_OPENAI_KEY:', import.meta.env.VITE_AZURE_OPENAI_KEY ? '已设置' : '未设置');
  
  const USE_SUPABASE_DIRECT = !import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL === 'direct';
  console.log('USE_SUPABASE_DIRECT:', USE_SUPABASE_DIRECT);
  console.log('======================');
}