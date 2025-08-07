# 🚀 Google Cloud Run 部署指南（完整步骤）

## 📋 前置准备

- [ ] Google 账号
- [ ] 信用卡（用于激活免费额度，不会收费）
- [ ] 终端/命令行工具
- [ ] 项目代码已准备好

## 🔧 步骤一：安装 Google Cloud SDK

### macOS
```bash
# 使用 Homebrew 安装（推荐）
brew install google-cloud-sdk

# 或者使用官方安装脚本
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

### Windows
```bash
# 下载安装器
https://cloud.google.com/sdk/docs/install#windows
```

### 验证安装
```bash
gcloud version
# 应该显示版本信息
```

## 🔐 步骤二：登录 Google Cloud

```bash
# 1. 登录账号（会打开浏览器）
gcloud auth login

# 2. 设置应用默认凭据
gcloud auth application-default login
```

## 📦 步骤三：创建 Google Cloud 项目

```bash
# 1. 创建新项目（项目ID必须全球唯一，可以改成你的名字+日期）
gcloud projects create collector-scraper-2025 --name="Collector Scraper"

# 2. 设置当前项目
gcloud config set project collector-scraper-2025

# 3. 查看项目列表确认
gcloud projects list
```

## 💳 步骤四：关联 Billing Account

```bash
# 1. 查看可用的 billing accounts
gcloud billing accounts list

# 2. 如果没有，需要在网页上添加
# 访问: https://console.cloud.google.com/billing
# 添加信用卡（免费额度不会收费）

# 3. 关联 billing 到项目
gcloud billing projects link collector-scraper-2025 --billing-account=YOUR_BILLING_ACCOUNT_ID
```

## 🛠️ 步骤五：启用必要的 APIs

```bash
# 启用 Cloud Build API
gcloud services enable cloudbuild.googleapis.com

# 启用 Cloud Run API  
gcloud services enable run.googleapis.com

# 启用 Container Registry API
gcloud services enable containerregistry.googleapis.com

# 验证 APIs 已启用
gcloud services list --enabled
```

## 📁 步骤六：准备部署文件

```bash
# 1. 进入项目目录
cd /Users/annanyang/Downloads/Prototype\ and\ test/collector

# 2. 确认以下文件存在
ls -la server/Dockerfile.gcp    # Docker 配置文件
ls -la cloudbuild.yaml          # Cloud Build 配置
ls -la deploy-gcp.sh            # 部署脚本

# 3. 给脚本添加执行权限
chmod +x deploy-gcp.sh
```

## 🚀 步骤七：执行部署

### 方法A：使用一键脚本（推荐）
```bash
# 运行部署脚本
./deploy-gcp.sh

# 脚本会询问：
# 1. 项目ID: 输入 collector-scraper-2025
# 2. 选择区域: 输入 1 (us-central1)
# 3. 选择构建方式: 输入 1 (Cloud Build)
```

### 方法B：手动部署（如果脚本失败）
```bash
# 1. 使用 Cloud Build 构建和部署
gcloud builds submit --config cloudbuild.yaml

# 2. 或者手动部署
# 构建镜像
gcloud builds submit --tag gcr.io/collector-scraper-2025/collector-scraper ./server

# 部署到 Cloud Run
gcloud run deploy collector-scraper \
  --image gcr.io/collector-scraper-2025/collector-scraper \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 5 \
  --port 3001
```

## 📡 步骤八：获取服务 URL

```bash
# 获取部署的 URL
gcloud run services describe collector-scraper \
  --region us-central1 \
  --format 'value(status.url)'

# 保存这个 URL，类似：
# https://collector-scraper-xxxxx-uc.a.run.app
```

## 🎨 步骤九：配置前端

### 1. 创建生产环境配置
```bash
# 复制环境变量文件
cp .env .env.production

# 编辑 .env.production
nano .env.production
# 或用其他编辑器
```

### 2. 更新环境变量
```env
# 把 VITE_API_URL 改为你的 Cloud Run URL
VITE_API_URL=https://collector-scraper-xxxxx-uc.a.run.app/api
VITE_PROXY_URL=https://corsproxy.io/?
VITE_NODE_ENV=production
VITE_SUPABASE_URL=你的Supabase_URL
VITE_SUPABASE_ANON_KEY=你的Supabase_Key
```

## 🌐 步骤十：部署前端到 Vercel

### 1. 安装 Vercel CLI
```bash
npm i -g vercel
```

### 2. 部署前端
```bash
# 在项目根目录运行
vercel

# 回答问题：
# Setup and deploy? Y
# Which scope? 选择你的账号
# Link to existing project? N  
# Project name? collector-app
# In which directory? ./
# Override settings? N
```

### 3. 设置生产环境变量
```bash
# 添加 API URL
vercel env add VITE_API_URL production
# 输入: https://collector-scraper-xxxxx-uc.a.run.app/api

# 添加 Supabase URL
vercel env add VITE_SUPABASE_URL production
# 输入你的 Supabase URL

# 添加 Supabase Key
vercel env add VITE_SUPABASE_ANON_KEY production
# 输入你的 Supabase Key
```

### 4. 重新部署生产版本
```bash
vercel --prod
```

## ✅ 步骤十一：测试部署

### 1. 测试后端
```bash
# 测试健康检查
curl https://collector-scraper-xxxxx-uc.a.run.app/health

# 应该返回: {"status":"ok","timestamp":"..."}
```

### 2. 测试前端
```bash
# 访问 Vercel 提供的 URL
https://collector-app.vercel.app
```

### 3. 功能测试
- 打开网站
- 尝试添加一个链接
- 检查爬虫是否正常工作

## 🔍 步骤十二：监控和日志

### 查看 Cloud Run 日志
```bash
gcloud run logs read --service collector-scraper --region us-central1
```

### 查看服务状态
```bash
gcloud run services describe collector-scraper --region us-central1
```

### 查看费用
```bash
# 访问控制台
https://console.cloud.google.com/billing
```

## 🚨 常见问题解决

### 问题 1：APIs 未启用
```bash
ERROR: (gcloud.builds.submit) User does not have permission
```
**解决方案：**
```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### 问题 2：Billing 未设置
```bash
ERROR: The project must be linked to a billing account
```
**解决方案：**
- 访问 https://console.cloud.google.com/billing
- 添加信用卡
- 关联到项目

### 问题 3：构建超时
```bash
ERROR: Build timeout
```
**解决方案：**
```bash
# 增加超时时间
gcloud config set builds/timeout 1200
```

### 问题 4：内存不足
```bash
ERROR: Container failed to start
```
**解决方案：**
```bash
# 增加内存配置
gcloud run deploy --memory 4Gi
```

### 问题 5：权限错误
```bash
ERROR: Permission denied
```
**解决方案：**
```bash
# 添加必要的角色
gcloud projects add-iam-policy-binding collector-scraper-2025 \
  --member="user:你的邮箱@gmail.com" \
  --role="roles/run.admin"
```

## 📊 费用预估

### Google Cloud 免费额度（每月）
- Cloud Run: 200万请求
- 内存: 360,000 GB-秒
- CPU: 180,000 vCPU-秒
- 网络: 1GB 出口流量

### 预计使用
- 日均 1000 次爬虫请求
- 每次 5 秒，2GB 内存
- **月费用: $0**（完全在免费额度内）

## 🎯 后续优化

### 1. 设置自定义域名
```bash
gcloud run domain-mappings create \
  --service collector-scraper \
  --domain api.yourdomain.com \
  --region us-central1
```

### 2. 设置 CI/CD
- 连接 GitHub
- 自动构建部署

### 3. 性能优化
- 添加 Redis 缓存
- 配置 CDN

## 📝 备忘录

### 重要 URLs
- **Google Cloud Console**: https://console.cloud.google.com
- **Cloud Run 控制台**: https://console.cloud.google.com/run
- **Billing 页面**: https://console.cloud.google.com/billing
- **Vercel Dashboard**: https://vercel.com/dashboard

### 常用命令
```bash
# 查看日志
gcloud run logs read --service collector-scraper

# 更新服务
gcloud run deploy collector-scraper --image gcr.io/PROJECT_ID/IMAGE

# 查看费用
gcloud billing accounts list

# 删除服务（如果需要）
gcloud run services delete collector-scraper
```

## ✅ 完成检查清单

- [ ] Google Cloud SDK 已安装
- [ ] 已登录 Google Cloud
- [ ] 项目已创建
- [ ] Billing 已关联
- [ ] APIs 已启用
- [ ] 后端已部署到 Cloud Run
- [ ] 获取了后端 URL
- [ ] 前端环境变量已配置
- [ ] 前端已部署到 Vercel
- [ ] 整体功能测试通过

## 🆘 需要帮助？

如果遇到问题：
1. 检查错误信息
2. 查看上面的常见问题
3. 查看 Google Cloud 日志
4. 记录错误信息，寻求帮助

---

**祝部署顺利！** 🎉