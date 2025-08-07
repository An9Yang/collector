# Vercel部署指南（无后端版本）

## 快速部署步骤

### 1. 在Vercel设置环境变量

登录到 [Vercel Dashboard](https://vercel.com/dashboard)，进入你的项目设置：

1. 点击你的项目 `collector`
2. 进入 `Settings` → `Environment Variables`
3. 添加以下环境变量：

```
VITE_API_URL=direct
VITE_SUPABASE_URL=https://xhetlcctjefqpjwkjdwc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoZXRsY2N0amVmcXBqd2tqZHdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NTc3ODAsImV4cCI6MjA2MzUzMzc4MH0.21VBG2WbU6piVcHPAuzOoEmyDTS54dKw5fY3tM08b88
VITE_PROXY_URL=https://corsproxy.io/?
VITE_NODE_ENV=production
```

### 2. 重新部署

设置完环境变量后：
1. 进入 `Deployments` 标签
2. 找到最新的部署
3. 点击右侧的三个点 `...`
4. 选择 `Redeploy`
5. 在弹出的对话框中点击 `Redeploy`

### 3. 验证部署

部署完成后（通常需要1-2分钟）：
1. 访问你的应用：https://collector-siik-annan-team.vercel.app
2. 应用应该能正常加载
3. 可以添加、查看、删除文章
4. 可以创建和管理收藏夹

## 功能说明

### 可用功能
✅ 查看文章列表
✅ 阅读文章内容
✅ 添加纯文本内容
✅ 创建和管理收藏夹
✅ 文章分类和标签
✅ AI聊天功能（使用Azure OpenAI）
✅ 深色模式切换
✅ 响应式设计

### 暂时不可用功能
❌ 网页爬虫（需要后端服务器）
❌ 自动提取网页内容
❌ 网页截图

## 如何添加内容

由于没有后端爬虫，你有两种方式添加内容：

1. **复制粘贴文本**
   - 点击 "Add New"
   - 选择 "粘贴内容"
   - 粘贴文章文本
   - 点击保存

2. **手动输入**
   - 直接在输入框中输入或编辑内容

## 后续升级

如果你想要完整的爬虫功能，可以：

1. **部署后端服务器**
   - 参考 `GOOGLE_CLOUD_DEPLOYMENT_GUIDE.md` 使用Google Cloud
   - 或使用 Railway/Render 等服务

2. **更新Vercel环境变量**
   - 将 `VITE_API_URL` 改为你的后端服务器地址
   - 例如：`VITE_API_URL=https://your-backend.railway.app/api`

3. **重新部署**
   - Vercel会自动使用新的环境变量

## 故障排除

### 如果看到连接错误
1. 检查环境变量是否正确设置
2. 确保 `VITE_API_URL=direct`（不是localhost）
3. 重新部署应用

### 如果数据无法加载
1. 检查Supabase配置
2. 确认Supabase项目是否正常运行
3. 查看浏览器控制台错误信息

### 如果需要帮助
- 查看浏览器控制台（F12）的错误信息
- 检查Vercel的Function日志
- 确保所有环境变量都已正确设置