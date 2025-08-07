# 快速修复Vercel部署问题

## 当前问题
你的应用在Vercel上无法工作，因为前端还在尝试连接 `localhost:3001`（本地后端）。

## 最快解决方案

### 步骤1：部署后端到Railway（最简单）

1. 访问 [Railway](https://railway.app)
2. 点击 "Start a New Project"
3. 选择 "Deploy from GitHub repo"
4. 授权并选择你的 `collector` 仓库
5. 在设置中：
   - **Root Directory**: 设置为 `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`

6. 点击 "Variables" 添加环境变量：
```
PORT=3001
NODE_ENV=production
SUPABASE_URL=https://xhetlcctjefqpjwkjdwc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoZXRsY2N0amVmcXBqd2tqZHdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NTc3ODAsImV4cCI6MjA2MzUzMzc4MH0.21VBG2WbU6piVcHPAuzOoEmyDTS54dKw5fY3tM08b88
```

7. 部署完成后，Railway会给你一个URL，例如：
   `https://collector-server-production.up.railway.app`

### 步骤2：在Vercel配置后端URL

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的 `collector` 项目
3. 进入 Settings → Environment Variables
4. 添加以下环境变量：

```
VITE_API_URL=https://collector-server-production.up.railway.app/api
```
（替换为你在Railway获得的实际URL）

5. 点击 "Save"
6. 重新部署：
   - 进入 Deployments 标签
   - 点击最新部署旁边的三个点
   - 选择 "Redeploy"

## 验证

部署完成后：
1. 访问你的Vercel应用：`https://collector-siik-annan-team.vercel.app`
2. 打开浏览器开发者工具（F12）
3. 查看Network标签，确认API请求指向Railway URL而不是localhost

## 备选方案

如果Railway不工作，可以尝试：

### Render.com（免费但启动慢）
1. 访问 [Render](https://render.com)
2. New → Web Service
3. 连接GitHub仓库
4. 设置：
   - Root Directory: `server`
   - Build: `npm install`
   - Start: `node server.js`
5. 添加相同的环境变量
6. 获取URL后在Vercel配置

### 注意事项
- Railway免费版有限制（每月500小时）
- Render免费版会在15分钟无活动后休眠
- 爬虫功能在这些平台上可能受限（需要Puppeteer）

## 临时解决方案（无后端）

如果你暂时不想部署后端，可以创建一个直连Supabase的版本：
1. 修改 `src/services/api.ts` 直接使用Supabase客户端
2. 但这样会失去爬虫功能

## 需要帮助？
- 检查Railway日志：Dashboard → 你的项目 → Logs
- 检查Vercel日志：Dashboard → Functions → Logs
- 确保环境变量正确设置且已重新部署