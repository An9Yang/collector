# 更新日志

## [未发布]

### 新增
- 添加了多格式内容检测和渲染功能
  - 支持自动检测 HTML、Markdown 和纯文本格式
  - 支持在添加内容时预览格式化后的效果
  - 改进了内容解析和处理逻辑
- 增强了格式检测功能
  - 添加对 Office 格式(DOCX/XLSX)的支持
  - 添加对 RTF 格式的支持
  - 支持从粘贴事件中检测各种格式
  - 添加文件上传功能，支持常见文档格式

### 技术改进
- 添加了内容格式检测工具 `formatDetection.ts`
- 创建了文档转换工具 `documentConverter.ts`，用于处理各种文档格式
- 创建了新组件 `ContentPreview.tsx` 用于内容预览
- 更新了 `AddLinkModal.tsx`，添加了内容编辑和预览切换功能
- 增强了粘贴和文件上传功能
- 改进了 `mockData.ts` 中的内容处理逻辑，支持从不同格式提取标题和摘要

### 依赖
- 添加 `mammoth` 库用于解析 DOCX 文件
- 添加 `xlsx` 库用于解析电子表格
- 添加 `rtf-parser` 库用于解析 RTF 文档
- 添加 `file-type` 库用于检测文件类型 