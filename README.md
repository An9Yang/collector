# ClipNote - 文章收集和管理应用

一个现代化的文章收集、管理和阅读应用，支持从网页抓取内容、分类管理和AI对话。

## 快速开始

### 1. 环境准备

确保已安装：
- Node.js (v16+)
- npm

### 2. 安装依赖

```bash
# 安装前端和后端依赖
npm install
```

### 3. 环境变量配置

项目已配置好环境变量文件：
- `.env` - 前端环境变量
- `server/.env` - 后端环境变量

### 4. 启动应用

```bash
# 同时启动前端和后端
npm start
```

应用将在以下地址运行：
- 前端：http://localhost:5173 (如果端口被占用会自动切换)
- 后端API：http://localhost:3001

## 功能特性

- 📋 **文章收集** - 保存网页链接或直接粘贴内容
- 🗂️ **收藏夹管理** - 创建和管理不同的收藏夹
- 🏷️ **标签系统** - 为文章添加标签，方便分类查找
- 🤖 **AI对话** - 与AI助手讨论文章内容
- 📄 **分页浏览** - 高效浏览大量文章
- 🌙 **深色模式** - 支持明暗主题切换
- 🔍 **智能爬虫** - 自动抓取网页内容

## 技术架构

### 前端
- React 18 + TypeScript
- Vite 构建工具
- Tailwind CSS 样式
- React Query 数据管理
- Lucide React 图标

### 后端
- Express.js API服务器
- Puppeteer 网页爬虫
- Supabase 数据库
- Rate Limiting 限流保护

## 项目结构

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
└── dist/             # 构建输出
```

## 开发命令

```bash
# 开发模式
npm start          # 同时启动前端和后端
npm run dev        # 仅启动前端
npm run server     # 仅启动后端

# 构建和测试
npm run build      # 构建生产版本
npm test           # 运行测试
npm run lint       # 代码检查

# Supabase设置
npm run setup-supabase  # 运行数据库设置脚本
```

## 注意事项

1. **安全性**：确保不要将 `.env` 文件提交到版本控制
2. **数据库**：项目使用 Supabase，需要有效的数据库连接
3. **爬虫限制**：爬虫功能有速率限制，避免频繁请求

## 故障排查

### 端口被占用
如果默认端口被占用，应用会自动使用其他端口。查看终端输出确认实际使用的端口。

### 数据库连接失败
检查 `server/.env` 中的 Supabase 配置是否正确。

### 爬虫功能异常
确保 Puppeteer 依赖正确安装，某些系统可能需要额外的系统依赖。

## License

MIT