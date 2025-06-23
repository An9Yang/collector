# ClipNote 项目设置和运行指南

## 测试结果总结

✅ **成功的部分：**
- 前端依赖安装正常
- 后端服务器依赖安装正常
- TypeScript编译无错误
- 前端构建成功
- 数据库连接和操作测试通过（5/7个测试）

⚠️ **需要注意的问题：**
- ESLint有37个警告/错误（不影响运行）
- 2个网络测试失败（DNS解析问题）

## 快速开始

### 1. 安装依赖
```bash
# 安装前端依赖
npm install

# 安装后端依赖（会在启动时自动安装）
cd server && npm install
```

### 2. 配置环境变量

#### 前端配置（根目录创建 .env）
```env
VITE_API_URL=http://localhost:3001/api
VITE_PROXY_URL=https://corsproxy.io/?
```

#### 后端配置（server目录创建 .env）
```env
# Server
PORT=3001
FRONTEND_URL=http://localhost:5173

# Supabase（需要替换为真实值）
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Azure OpenAI（可选）
AZURE_OPENAI_KEY=your_azure_openai_key
AZURE_OPENAI_ENDPOINT=your_azure_openai_endpoint
AZURE_OPENAI_DEPLOYMENT=your_azure_openai_deployment

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. 启动项目

```bash
# 同时启动前端和后端
npm start
```

这会：
- 在 http://localhost:5173 启动前端开发服务器
- 在 http://localhost:3001 启动后端API服务器

### 4. 其他命令

```bash
# 仅启动前端
npm run dev

# 仅启动后端
npm run server

# 构建生产版本
npm run build

# 运行测试
npm test

# 运行ESLint
npm run lint
```

## 项目架构

```
/
├── src/              # 前端源代码
│   ├── components/   # React组件
│   ├── services/     # API服务
│   ├── context/      # React Context
│   ├── hooks/        # 自定义Hooks
│   └── utils/        # 工具函数
├── server/           # 后端API服务器
│   ├── routes/       # API路由
│   ├── services/     # 业务逻辑
│   └── middleware/   # 中间件
└── dist/             # 构建输出目录
```

## 主要改进

1. **架构优化**
   - 创建了独立的后端API服务器
   - 前端不再直接访问数据库
   - 实现了前后端分离

2. **性能优化**
   - 实现了文章列表分页
   - 添加了React Query数据缓存
   - 优化了爬虫服务器资源占用

3. **代码质量**
   - 提取了通用错误处理逻辑
   - 添加了全局加载状态
   - 改进了错误提示组件

4. **目录结构**
   - 合并了lib和utils目录
   - 统一了代码组织结构

## 注意事项

⚠️ **安全警告：** 
- 确保不要将真实的API密钥提交到版本控制
- 生产环境必须配置环境变量
- 启用Supabase的Row Level Security

## 故障排查

### 问题：网络连接错误
如果遇到 "ENOTFOUND xhetlctjefqpjwkjdwc.supabase.co" 错误：
- 检查Supabase URL是否正确
- 确认网络连接正常
- 验证环境变量配置

### 问题：构建失败
如果构建失败：
- 运行 `npm install` 确保所有依赖已安装
- 检查TypeScript错误：`npx tsc --noEmit`
- 查看具体错误信息

### 问题：API连接失败
如果前端无法连接后端：
- 确认后端服务器正在运行（端口3001）
- 检查VITE_API_URL环境变量
- 查看浏览器控制台错误