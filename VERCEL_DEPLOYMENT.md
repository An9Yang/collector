# Vercel部署说明

## 问题分析
你的应用在Vercel上无法访问后端API，因为：
1. 前端仍在尝试连接 `http://localhost:3001`（本地后端）
2. 后端服务器（爬虫功能）没有部署到云端

## 解决方案

### 方案1：临时方案 - 直接使用Supabase（无爬虫功能）
如果你暂时不需要爬虫功能，可以让前端直接连接Supabase。

在Vercel项目设置中添加环境变量：
```
VITE_USE_DIRECT_SUPABASE=true
VITE_SUPABASE_URL=https://xhetlcctjefqpjwkjdwc.supabase.co
VITE_SUPABASE_ANON_KEY=你的supabase_anon_key
```

### 方案2：完整方案 - 部署后端服务器

#### 选项A：使用Google Cloud Run（推荐，免费额度充足）
1. 参考 `GOOGLE_CLOUD_DEPLOYMENT_GUIDE.md` 部署后端
2. 部署成功后，获得URL如：`https://your-service-xxx.run.app`
3. 在Vercel设置环境变量：
   ```
   VITE_API_URL=https://your-service-xxx.run.app/api
   ```

#### 选项B：使用Railway（简单但有限制）
1. 访问 [Railway](https://railway.app)
2. 创建新项目，连接GitHub仓库
3. 设置根目录为 `/server`
4. 添加环境变量：
   ```
   PORT=3001
   SUPABASE_URL=https://xhetlcctjefqpjwkjdwc.supabase.co
   SUPABASE_ANON_KEY=你的key
   SUPABASE_SERVICE_KEY=你的service_key
   AZURE_OPENAI_API_KEY=你的key
   AZURE_OPENAI_ENDPOINT=你的endpoint
   AZURE_OPENAI_DEPLOYMENT=gpt-5-mini
   ```
5. 部署后获得URL，在Vercel设置：
   ```
   VITE_API_URL=https://your-app.railway.app/api
   ```

#### 选项C：使用Render（免费但有限制）
1. 访问 [Render](https://render.com)
2. 创建Web Service
3. 连接GitHub仓库
4. 设置：
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `node server.js`
5. 添加环境变量（同Railway）
6. 部署后在Vercel设置API URL

### 在Vercel设置环境变量的步骤
1. 登录Vercel Dashboard
2. 选择你的项目
3. 进入 Settings → Environment Variables
4. 添加变量：
   - `VITE_API_URL`: 你的后端服务器URL
   - `VITE_SUPABASE_URL`: Supabase URL
   - `VITE_SUPABASE_ANON_KEY`: Supabase Anon Key
5. 重新部署项目

### CORS配置
确保后端服务器允许来自Vercel域名的请求。在 `server/server.js` 中已配置：
```javascript
app.use(cors({
  origin: true, // 允许所有源，生产环境建议指定具体域名
  credentials: true
}));
```

生产环境建议修改为：
```javascript
app.use(cors({
  origin: ['https://collector-siik-annan-team.vercel.app', 'http://localhost:5173'],
  credentials: true
}));
```

## 快速测试
部署完成后，访问以下URL测试：
- 前端：`https://collector-siik-annan-team.vercel.app`
- 后端健康检查：`https://你的后端URL/health`
- API测试：`https://你的后端URL/api/articles`

## 注意事项
1. 爬虫功能需要后端服务器支持Puppeteer
2. 免费托管服务可能有以下限制：
   - 请求超时（通常10-30秒）
   - 内存限制（512MB-1GB）
   - 每月请求数限制
3. 建议使用Google Cloud Run，有充足免费额度且支持Puppeteer