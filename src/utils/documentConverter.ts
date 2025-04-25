// 使用动态导入避免浏览器解析失败
// @ts-ignore
// import mammoth from 'mammoth';
// @ts-ignore
// import * as XLSX from 'xlsx';
// @ts-ignore
// import rtfParser from 'rtf-parser';

/**
 * 将DOCX文档转换为HTML
 * @param buffer DOCX文件的ArrayBuffer
 * @returns Promise<string> 转换后的HTML字符串
 */
export const docxToHtml = async (buffer: ArrayBuffer): Promise<string> => {
  try {
    // 浏览器端加载 mammoth 浏览器版本
    const mammothModule = await import('mammoth/mammoth.browser.min.js');
    const mammoth = mammothModule.default || mammothModule;
    const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
    return `<div class="article-content">${result.value}</div>`;
  } catch (error) {
    console.error('DOCX转换错误:', error);
    return `<div class="article-content"><p>DOCX文档转换失败</p></div>`;
  }
};

/**
 * 将XLSX电子表格转换为HTML表格
 * @param buffer XLSX文件的ArrayBuffer
 * @returns Promise<string> 转换后的HTML表格
 */
export const xlsxToHtml = async (buffer: ArrayBuffer): Promise<string> => {
  try {
    // 动态加载 xlsx 库
    const XLSX = await import('xlsx');
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
    console.error('XLSX转换错误:', error);
    return `<div class="article-content"><p>XLSX电子表格转换失败</p></div>`;
  }
};

/**
 * 将RTF文档转换为HTML
 * @param buffer RTF文件内容的ArrayBuffer或字符串
 * @returns Promise<string> 转换后的HTML字符串
 */
export const rtfToHtml = async (buffer: ArrayBuffer | string): Promise<string> => {
  try {
    // 动态加载 rtf-parser
    const rtfParser = (await import('rtf-parser')).default;
    
    return new Promise((resolve) => {
      const rtfContent = typeof buffer === 'string'
        ? buffer
        : new TextDecoder('utf-8').decode(buffer);
      
      rtfParser.string(rtfContent, (err: Error | null, doc: any) => {
        if (err) {
          console.error('RTF解析错误:', err);
          resolve(`<div class="article-content"><p>RTF文档转换失败</p></div>`);
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
  } catch (err) {
    console.error('RTF转换加载失败:', err);
    return `<div class="article-content"><p>RTF文档转换失败</p></div>`;
  }
}; 