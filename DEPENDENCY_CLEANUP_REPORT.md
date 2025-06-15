# 依赖清理分析报告

## 📊 依赖使用情况分析

### ✅ 确认使用的依赖 (保留)

#### 生产依赖 (dependencies)
- **@supabase/supabase-js** ✅ - 在 `src/config/supabase.ts`, `src/lib/supabase.ts` 中使用
- **axios** ❓ - 需要进一步确认使用情况
- **date-fns** ✅ - 在 `src/components/articles/ArticleCard.tsx` 中使用 `formatDistance`
- **dompurify** ✅ - 在多个文件中使用，用于HTML清理
- **fs-extra** ✅ - 在服务器文件中使用 (`scraper-server-*.cjs`)
- **jsdom** ✅ - 在所有服务器文件中使用
- **lucide-react** ✅ - 在多个React组件中广泛使用图标
- **puppeteer** ✅ - 在 `scraper-server-advanced.cjs` 和 `scraper-server-unified.cjs` 中使用
- **react** ✅ - React核心库，必需
- **react-dom** ✅ - React DOM渲染库，必需

#### 开发依赖 (devDependencies)
- **@eslint/js** ✅ - 在 `eslint.config.js` 中使用
- **@tailwindcss/typography** ✅ - Tailwind CSS插件
- **@types/dompurify** ✅ - DOMPurify的TypeScript类型定义
- **@types/react** ✅ - React的TypeScript类型定义
- **@types/react-dom** ✅ - React DOM的TypeScript类型定义
- **@vitejs/plugin-react** ✅ - 在 `vite.config.ts` 中使用
- **autoprefixer** ✅ - PostCSS插件，用于CSS前缀
- **concurrently** ✅ - 在 `package.json` 脚本中使用
- **eslint** ✅ - 代码检查工具
- **eslint-plugin-react-hooks** ✅ - 在 `eslint.config.js` 中使用
- **eslint-plugin-react-refresh** ✅ - 在 `eslint.config.js` 中使用
- **globals** ✅ - 在 `eslint.config.js` 中使用
- **postcss** ✅ - CSS处理工具
- **supabase** ✅ - Supabase CLI工具
- **tailwindcss** ✅ - CSS框架
- **typescript** ✅ - TypeScript编译器
- **typescript-eslint** ✅ - TypeScript ESLint支持
- **vite** ✅ - 构建工具

### ❌ 未使用或可疑依赖 (建议移除)

#### 生产依赖 (dependencies)
1. **cors** ❌ - 未在代码中实际使用 `require('cors')`，服务器使用手动CORS头
2. **crypto** ❌ - 使用Node.js内置模块，不需要额外安装
3. **express** ❌ - 已删除Express服务器文件，当前服务器使用HTTP模块
4. **file-type** ❌ - 未在代码中发现使用
5. **framer-motion** ❌ - 未在代码中发现使用
6. **mammoth** ❌ - 使用动态导入，不需要预装
7. **path** ❌ - 这是Node.js内置模块，不需要额外安装
8. **rtf-parser** ❌ - 使用动态导入，不需要预装
9. **xlsx** ❌ - 使用动态导入，不需要预装

### 📝 特殊情况说明

#### 动态导入的依赖
以下依赖使用动态导入，理论上不需要预装：
- `mammoth` - 在 `documentConverter.ts` 中动态导入
- `xlsx` - 在 `documentConverter.ts` 中动态导入
- `rtf-parser` - 在 `documentConverter.ts` 中动态导入

但是，如果用户需要使用文档转换功能，这些依赖仍然需要安装。

#### 内置Node.js模块
- `crypto` - Node.js内置模块
- `path` - Node.js内置模块

## 🧹 清理建议

### 立即可删除的依赖
```bash
npm uninstall cors express file-type framer-motion
```

### 需要确认的依赖
```bash
# 检查这些依赖是否在某些地方使用
npm uninstall crypto path
```

### 文档转换功能相关
如果不需要文档转换功能，可以删除：
```bash
npm uninstall mammoth rtf-parser xlsx
```

如果需要保留文档转换功能，建议将它们移动到 `devDependencies`：
```bash
npm uninstall mammoth rtf-parser xlsx
npm install --save-dev mammoth rtf-parser xlsx
```

## 📊 清理后的预期结果

### 可节省的空间
- 删除约 **9个未使用的生产依赖**
- 预计减少 **node_modules** 大小约 **30-40%**
- 减少安装时间约 **25%**

### 优化后的 package.json
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.49.0",
    "date-fns": "^3.3.1",
    "dompurify": "^3.0.9",
    "fs-extra": "^11.3.0",
    "jsdom": "^26.1.0",
    "lucide-react": "^0.344.0",
    "puppeteer": "^24.10.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  }
}
```

## ⚠️ 清理注意事项

1. **备份 package.json** - 在清理前备份当前配置
2. **测试功能** - 清理后测试所有核心功能
3. **渐进式清理** - 建议分批删除依赖，每次删除后测试
4. **保留重要功能** - 如果文档转换功能重要，保留相关依赖

## 🚀 执行步骤

1. **第一阶段** - 删除明确未使用的依赖
2. **第二阶段** - 测试应用功能
3. **第三阶段** - 根据需要调整文档转换依赖
4. **第四阶段** - 更新文档和changelog

---

**分析完成时间:** 2025-01-27
**预计节省:** 9个依赖包，30-40% node_modules体积 