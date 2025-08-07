# Vercel环境变量配置（最新版）

## 必需的环境变量

在Vercel Dashboard → Settings → Environment Variables 中添加以下变量：

### 1. 启用直连模式（必需）
```
VITE_API_URL=direct
```

### 2. Supabase配置（必需）
```
VITE_SUPABASE_URL=https://xhetlcctjefqpjwkjdwc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoZXRsY2N0amVmcXBqd2tqZHdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NTc3ODAsImV4cCI6MjA2MzUzMzc4MH0.21VBG2WbU6piVcHPAuzOoEmyDTS54dKw5fY3tM08b88
```

### 3. Azure OpenAI配置（用于AI聊天）
```
VITE_AZURE_OPENAI_ENDPOINT=https://indieapp.openai.azure.com/openai/deployments/gpt-5-mini/chat/completions?api-version=2025-04-01-preview
VITE_AZURE_OPENAI_KEY=你的Azure_OpenAI_API密钥
```
注意：使用你实际的Azure OpenAI API密钥

## 关于GPT-5-mini

- **部署名称**: gpt-5-mini
- **API版本**: 2025-04-01-preview
- **Token限制**: 不设置限制，让模型发挥最大能力
- **预期能力**: 
  - 上下文窗口：至少200K tokens
  - 最大输出：至少100K tokens
  - 知识截止：最新

## 注意事项

1. **VITE_API_URL=direct** 是最关键的，它启用了直连Supabase模式
2. Azure endpoint必须是完整URL，包含deployment名称和API版本
3. 不设置token限制，让GPT-5-mini自行决定最佳输出长度
4. 设置完成后需要重新部署才能生效

## 验证部署

部署后访问你的应用，检查：
- 能否正常加载文章
- AI聊天是否正常工作
- 是否能添加和管理收藏夹

如果看到连接错误，检查浏览器控制台（F12）确认环境变量是否正确加载。