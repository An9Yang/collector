# 项目重组计划

## 🎯 目标
整理项目结构，移除冗余文件，优化目录结构，提高代码可维护性。

## 📋 需要整理的问题

### 1. 服务器文件冗余
**现状**: 多个功能重复的服务器文件
- `server.js` (Express + CommonJS)
- `server.mjs` (Express + ES Modules)
- `scraper-server.js` (HTTP模块)
- `scraper-server.cjs` (CommonJS版本)
- `scraper-server-unified.cjs` (统一版本)
- `scraper-server-advanced.cjs` (高级版本)
- `scraper-server-with-images.cjs` (图片支持版本)

**建议**: 保留一个主要的和一个备用的服务器文件
- 保留: `scraper-server-unified.cjs` (作为主要服务器)
- 保留: `scraper-server-advanced.cjs` (作为功能增强版本)
- 删除: 其他所有服务器文件

### 2. 目录结构重组
**现状**: 
- `backend/public/images/` 和 `public/images/` 重复
- `backend/` 目录结构不合理

**建议**: 
- 删除 `backend/` 目录
- 统一使用 `public/images/` 目录
- 创建合理的服务器文件目录结构

### 3. 测试文件归类
**现状**: 测试文件散落在 `src/` 目录
- `test-supabase.ts`
- `test-connection.ts`
- `test-network.ts`
- `test-simple.ts`
- `direct-test.ts`

**建议**: 
- 创建 `src/__tests__/` 目录
- 移动所有测试文件到该目录
- 重命名测试文件使其更符合规范

### 4. 配置文件优化
**现状**: 缺少环境变量示例文件
**建议**: 
- 创建 `.env.example` 文件
- 优化 `.gitignore` 文件
- 添加日志文件忽略规则

### 5. 文档和脚本优化
**建议**: 
- 更新 `package.json` 脚本
- 创建项目使用说明
- 更新 `CHANGELOG.md`

## 🔧 实施步骤

### 第一阶段: 清理冗余文件
1. 删除冗余的服务器文件
2. 删除重复的目录结构
3. 移动测试文件到正确位置

### 第二阶段: 结构优化
1. 创建合理的目录结构
2. 更新配置文件
3. 创建示例文件

### 第三阶段: 文档更新
1. 更新 `README.md`
2. 更新 `package.json` 脚本
3. 更新 `CHANGELOG.md`

## 📁 建议的最终目录结构

```
collector/
├── src/                    # 前端源代码
│   ├── components/
│   ├── services/
│   ├── utils/
│   ├── types/
│   ├── config/
│   ├── context/
│   ├── lib/
│   └── __tests__/         # 测试文件
├── public/                # 静态资源
│   └── images/
├── server/                # 服务器代码
│   ├── scraper-unified.js # 主要爬虫服务器
│   └── scraper-advanced.js # 高级爬虫服务器
├── supabase/             # 数据库配置
│   └── migrations/
├── logs/                 # 日志文件 (gitignore)
├── dist/                 # 构建输出
├── node_modules/         # 依赖包
├── .env.example          # 环境变量示例
├── .env.local           # 本地环境变量 (gitignore)
├── .gitignore
├── package.json
├── README.md
├── CHANGELOG.md
└── 其他配置文件...
```

## ⚠️ 注意事项
1. 在删除文件前，请确保备份重要代码
2. 更新 `package.json` 中的脚本引用
3. 测试所有功能以确保重组后正常工作
4. 逐步实施，避免一次性改动过多

## 🎯 预期收益
- 减少约 40% 的冗余文件
- 提高代码可维护性
- 更清晰的项目结构
- 更好的开发体验 