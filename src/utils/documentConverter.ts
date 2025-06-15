// 使用动态导入避免浏览器解析失败
// @ts-ignore
// import mammoth from 'mammoth';
// @ts-ignore
// import * as XLSX from 'xlsx';
// @ts-ignore
// import rtfParser from 'rtf-parser';

// 文档转换工具 - 支持可选依赖的动态加载
// 如果依赖不存在，会显示友好的提示信息

/**
 * 安全的动态导入函数
 * @param moduleName 模块名称
 * @returns Promise<any | null>
 */
async function safeImport(moduleName: string): Promise<any> {
  try {
    const module = await import(/* @vite-ignore */ moduleName);
    return module;
  } catch (error) {
    console.warn(`模块 ${moduleName} 未安装或加载失败`);
    return null;
  }
}

/**
 * 将DOCX文档转换为HTML
 * @param buffer DOCX文件的ArrayBuffer
 * @returns Promise<string> 转换后的HTML字符串
 */
export const docxToHtml = async (buffer: ArrayBuffer): Promise<string> => {
  try {
    // 尝试动态加载 mammoth 库
    const mammothModule = await safeImport('mammoth/mammoth.browser.min.js');
    
    if (!mammothModule) {
      return `<div class="article-content">
        <p>⚠️ DOCX文档转换功能不可用</p>
        <p>要启用此功能，请运行: <code>npm install mammoth</code></p>
        <small>然后重新启动应用</small>
      </div>`;
    }

    const mammoth = mammothModule.default || mammothModule;
    const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
    return `<div class="article-content">${result.value}</div>`;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    console.error('DOCX转换错误:', errorMessage);
    return `<div class="article-content">
      <p>❌ DOCX文档转换失败</p>
      <p>错误信息: ${errorMessage}</p>
    </div>`;
  }
};

/**
 * 将XLSX电子表格转换为HTML表格
 * @param buffer XLSX文件的ArrayBuffer
 * @returns Promise<string> 转换后的HTML表格
 */
export const xlsxToHtml = async (buffer: ArrayBuffer): Promise<string> => {
  try {
    // 尝试动态加载 xlsx 库
    const XLSX = await safeImport('xlsx');
    
    if (!XLSX) {
      return `<div class="article-content">
        <p>⚠️ Excel文档转换功能不可用</p>
        <p>要启用此功能，请运行: <code>npm install xlsx</code></p>
        <small>然后重新启动应用</small>
      </div>`;
    }

    // 读取电子表格
    const workbook = XLSX.read(buffer, { type: 'array' });
    
    // 获取第一个工作表
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // 转换为HTML
    const html = XLSX.utils.sheet_to_html(worksheet);
    
    return `<div class="article-content">
      <h2>${firstSheetName}</h2>
      ${html}
    </div>`;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    console.error('XLSX转换错误:', errorMessage);
    return `<div class="article-content">
      <p>❌ Excel文档转换失败</p>
      <p>错误信息: ${errorMessage}</p>
    </div>`;
  }
};

/**
 * 将RTF文档转换为HTML
 * @param buffer RTF文件内容的ArrayBuffer或字符串
 * @returns Promise<string> 转换后的HTML字符串
 */
export const rtfToHtml = async (buffer: ArrayBuffer | string): Promise<string> => {
  try {
    // 尝试动态加载 rtf-parser
    const rtfParserModule = await safeImport('rtf-parser');
    
    if (!rtfParserModule) {
      return `<div class="article-content">
        <p>⚠️ RTF文档转换功能不可用</p>
        <p>要启用此功能，请运行: <code>npm install rtf-parser</code></p>
        <small>然后重新启动应用</small>
      </div>`;
    }

    const rtfParser = rtfParserModule.default || rtfParserModule;
    
    return new Promise((resolve) => {
      const rtfContent = typeof buffer === 'string'
        ? buffer
        : new TextDecoder('utf-8').decode(buffer);
      
      rtfParser.string(rtfContent, (err: Error | null, doc: any) => {
        if (err) {
          console.error('RTF解析错误:', err);
          resolve(`<div class="article-content">
            <p>❌ RTF文档转换失败</p>
            <p>错误信息: ${err.message}</p>
          </div>`);
          return;
        }
        
        // 将RTF文档结构转换为HTML
        let html = '<div class="article-content">';
        
        // 处理文档内容
        if (doc && doc.content) {
          doc.content.forEach((section: any) => {
            if (section.type === 'paragraph') {
              html += '<p>';
              
              if (section.content) {
                section.content.forEach((item: any) => {
                  let text = item.value || '';
                  
                  // 应用样式
                  if (item.style) {
                    if (item.style.bold) text = `<strong>${text}</strong>`;
                    if (item.style.italic) text = `<em>${text}</em>`;
                    if (item.style.underline) text = `<u>${text}</u>`;
                  }
                  
                  html += text;
                });
              }
              
              html += '</p>';
            } else if (section.type === 'table') {
              // 处理表格
              html += '<table border="1" cellpadding="5">';
              
              if (section.content) {
                section.content.forEach((row: any) => {
                  html += '<tr>';
                  
                  if (row.content) {
                    row.content.forEach((cell: any) => {
                      html += '<td>';
                      
                      if (cell.content) {
                        cell.content.forEach((para: any) => {
                          html += `<p>${para.content?.map((item: any) => item.value || '').join('') || ''}</p>`;
                        });
                      }
                      
                      html += '</td>';
                    });
                  }
                  
                  html += '</tr>';
                });
              }
              
              html += '</table>';
            }
          });
        }
        
        html += '</div>';
        resolve(html);
      });
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    console.error('RTF转换错误:', errorMessage);
    return `<div class="article-content">
      <p>❌ RTF文档转换失败</p>
      <p>错误信息: ${errorMessage}</p>
    </div>`;
  }
};

/**
 * 检查是否支持某种文档格式
 * @param format 文档格式 ('docx' | 'xlsx' | 'rtf')
 * @returns Promise<boolean>
 */
export const isFormatSupported = async (format: 'docx' | 'xlsx' | 'rtf'): Promise<boolean> => {
  const moduleMap = {
    docx: 'mammoth/mammoth.browser.min.js',
    xlsx: 'xlsx',
    rtf: 'rtf-parser'
  };

  const moduleName = moduleMap[format];
  if (!moduleName) return false;

  const module = await safeImport(moduleName);
  return module !== null;
};

/**
 * 获取支持的文档格式列表
 * @returns Promise<string[]>
 */
export const getSupportedFormats = async (): Promise<string[]> => {
  const formats = ['docx', 'xlsx', 'rtf'] as const;
  const supportedFormats: string[] = [];

  for (const format of formats) {
    if (await isFormatSupported(format)) {
      supportedFormats.push(format);
    }
  }

  return supportedFormats;
}; 