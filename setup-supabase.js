#!/usr/bin/env node

import https from 'https';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase 项目配置
const SUPABASE_CONFIG = {
  url: 'https://xhetlcctjefqpjwkjdwc.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoZXRsY2N0amVmcXBqd2tqZHdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NTc3ODAsImV4cCI6MjA2MzUzMzc4MH0.21VBG2WbU6piVcHPAuzOoEmyDTS54dKw5fY3tM08b88'
};

// 数据库表创建 SQL
const CREATE_TABLES_SQL = `
-- 创建文章表
CREATE TABLE IF NOT EXISTS articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('wechat', 'linkedin', 'reddit', 'other')),
  content TEXT,
  cover_image TEXT,
  tags TEXT[],
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建更新时间的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_articles_updated_at 
  BEFORE UPDATE ON articles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_source ON articles(source);
CREATE INDEX IF NOT EXISTS idx_articles_is_read ON articles(is_read);
CREATE INDEX IF NOT EXISTS idx_articles_tags ON articles USING GIN(tags);

-- 禁用行级安全 (开发阶段)
ALTER TABLE articles DISABLE ROW LEVEL SECURITY;
`;

async function makeSupabaseRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'xhetlcctjefqpjwkjdwc.supabase.co',
      port: 443,
      path: path,
      method: method,
      headers: {
        'apikey': SUPABASE_CONFIG.anonKey,
        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      }
    };

    if (body) {
      const bodyString = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(bodyString);
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const result = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function executeSQL(sql) {
  console.log('🔄 执行 SQL 命令...');
  
  try {
    // 注意：这个方法可能需要服务端密钥，我们改用 REST API 方式
    const result = await makeSupabaseRequest('/rest/v1/rpc/exec_sql', 'POST', { sql });
    
    if (result.status >= 200 && result.status < 300) {
      console.log('✅ SQL 执行成功');
      return true;
    } else {
      console.log('❌ SQL 执行失败:', result.data);
      return false;
    }
  } catch (error) {
    console.error('❌ SQL 执行错误:', error.message);
    return false;
  }
}

async function testConnection() {
  console.log('🔗 测试 Supabase 连接...');
  
  try {
    const result = await makeSupabaseRequest('/rest/v1/articles?select=count');
    
    if (result.status === 200) {
      console.log('✅ Supabase 连接成功！');
      return true;
    } else if (result.status === 404) {
      console.log('⚠️  连接成功，但 articles 表不存在');
      return true;
    } else {
      console.log('❌ 连接失败:', result.status, result.data);
      return false;
    }
  } catch (error) {
    console.error('❌ 连接错误:', error.message);
    return false;
  }
}

async function insertSampleData() {
  console.log('📝 插入示例数据...');
  
  const sampleArticle = {
    url: 'https://example.com/sample',
    title: '欢迎使用文章收集器',
    summary: '这是一个示例文章，展示应用的基本功能。',
    source: 'other',
    content: '欢迎使用这个文章收集器！你可以保存链接、添加内容，并且跨设备同步。',
    is_read: false
  };

  try {
    const result = await makeSupabaseRequest('/rest/v1/articles', 'POST', sampleArticle);
    
    if (result.status >= 200 && result.status < 300) {
      console.log('✅ 示例数据插入成功');
      return true;
    } else {
      console.log('❌ 示例数据插入失败:', result.data);
      return false;
    }
  } catch (error) {
    console.error('❌ 插入数据错误:', error.message);
    return false;
  }
}

async function createEnvFile() {
  console.log('📄 创建环境变量文件...');
  
  const envContent = `# Supabase 配置
VITE_SUPABASE_URL=${SUPABASE_CONFIG.url}
VITE_SUPABASE_ANON_KEY=${SUPABASE_CONFIG.anonKey}
`;

  try {
    fs.writeFileSync('.env.local', envContent);
    console.log('✅ .env.local 文件创建成功');
    return true;
  } catch (error) {
    console.error('❌ 创建环境文件失败:', error.message);
    return false;
  }
}

async function updateSupabaseConfig() {
  console.log('🔧 更新 Supabase 配置文件...');
  
  const configContent = `import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'

const supabaseUrl = process.env.VITE_SUPABASE_URL || '${SUPABASE_CONFIG.url}'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '${SUPABASE_CONFIG.anonKey}'

export const supabase = createClient<Database>(supabaseUrl, supabaseKey)
`;

  try {
    fs.writeFileSync('src/config/supabase.ts', configContent);
    console.log('✅ Supabase 配置文件更新成功');
    return true;
  } catch (error) {
    console.error('❌ 更新配置文件失败:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 开始自动化设置 Supabase...\n');

  // 1. 测试连接
  const connected = await testConnection();
  if (!connected) {
    console.log('\n❌ 无法连接到 Supabase，请检查网络或项目配置');
    process.exit(1);
  }

  // 2. 创建环境文件
  await createEnvFile();

  // 3. 更新配置文件
  await updateSupabaseConfig();

  // 4. 执行 SQL（这步可能需要手动操作）
  console.log('\n⚠️  注意：由于安全限制，需要手动在 Supabase 控制台执行 SQL');
  console.log('请复制以下 SQL 到 Supabase SQL Editor 中执行：');
  console.log('\n' + '='.repeat(50));
  console.log(CREATE_TABLES_SQL);
  console.log('='.repeat(50) + '\n');

  // 5. 测试表是否创建成功
  console.log('⏳ 等待 10 秒，然后测试表是否创建...');
  await new Promise(resolve => setTimeout(resolve, 10000));

  const tableExists = await testConnection();
  if (tableExists) {
    // 6. 插入示例数据
    await insertSampleData();
  }

  console.log('\n🎉 Supabase 设置完成！');
  console.log('现在可以启动应用：npm run dev');
}

// 运行主函数
main().catch(console.error);

export { testConnection, insertSampleData, createEnvFile, updateSupabaseConfig }; 