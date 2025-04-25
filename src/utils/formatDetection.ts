import DOMPurify from 'dompurify';

/**
 * 内容格式类型
 */
export type ContentFormat = 'html' | 'markdown' | 'plaintext' | 'docx' | 'xlsx' | 'rtf';

/**
 * 二进制数据检测结果
 */
interface BinaryFormatResult {
  format: ContentFormat;
  data: ArrayBuffer;
}

/**
 * 检测内容格式
 */
export const detectContentFormat = (content: string): ContentFormat => {
  // 检测 Office 格式的特征 (简单检测，实际项目中应使用更健壮的方法)
  if (content.startsWith('PK\u0003\u0004')) {
    // 可能是DOCX/XLSX (ZIP格式文件的标记)
    if (content.includes('word/document.xml')) {
      return 'docx';
    } else if (content.includes('xl/workbook.xml')) {
      return 'xlsx';
    }
  }
  
  // 检测 RTF 格式
  if (content.startsWith('{\\rtf1')) {
    return 'rtf';
  }
  
  // 检测 HTML 格式
  if (/<\/?[a-z][\s\S]*>/i.test(content)) {
    return 'html';
  }
  
  // 检测 Markdown 格式
  const markdownPatterns = [
    /^#+\s+.+$/m, // 标题
    /\[.+\]\(.+\)/, // 链接
    /!\[.+\]\(.+\)/, // 图片
    /^>\s+.+$/m, // 引用
    /^(\*|-|\+)\s+.+$/m, // 无序列表
    /^[0-9]+\.\s+.+$/m, // 有序列表
    /^```[\s\S]*```$/m, // 代码块
    /\*\*.+\*\*/, // 粗体
    /\*.+\*/, // 斜体
    /~~.+~~/, // 删除线
    /^\|(.+\|)+$/m, // 表格
  ];
  
  if (markdownPatterns.some(pattern => pattern.test(content))) {
    return 'markdown';
  }
  
  // 默认为纯文本
  return 'plaintext';
};

/**
 * 从粘贴事件中检测格式
 * 可以处理二进制数据和剪贴板格式
 */
export const detectFormatFromPaste = async (e: ClipboardEvent): Promise<ContentFormat | BinaryFormatResult> => {
  // 检查是否有HTML内容
  if (e.clipboardData?.types.includes('text/html')) {
    return 'html';
  }
  
  // 检查是否有RTF内容
  if (e.clipboardData?.types.includes('text/rtf') || e.clipboardData?.types.includes('application/rtf')) {
    return 'rtf';
  }
  
  // 检查是否有文件
  if (e.clipboardData?.files.length) {
    const file = e.clipboardData.files[0];
    const buffer = await file.arrayBuffer();
    
    // 根据文件类型检测
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return { format: 'docx', data: buffer };
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      return { format: 'xlsx', data: buffer };
    } else if (file.type === 'application/rtf') {
      return { format: 'rtf', data: buffer };
    }
  }
  
  // 回退到文本内容检测
  const text = e.clipboardData?.getData('text/plain') || '';
  return detectContentFormat(text);
};

/**
 * 处理不同格式的内容并转换为HTML
 */
export const processContent = (content: string, format: ContentFormat): string => {
  switch (format) {
    case 'html':
      // 清理并返回HTML内容
      return DOMPurify.sanitize(content, {
        ALLOWED_TAGS: [
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'b', 'i', 'strong', 
          'em', 'mark', 'small', 'del', 'ins', 'sub', 'sup', 'a', 'img', 
          'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'ul', 'ol', 
          'li', 'blockquote', 'code', 'pre', 'hr', 'div', 'span'
        ],
        ALLOWED_ATTR: [
          'href', 'src', 'alt', 'title', 'style', 'target', 'rel',
          'width', 'height', 'class', 'id', 'name'
        ]
      });
      
    case 'plaintext':
      // 将纯文本转换为HTML段落
      return `<div class="article-content">
        ${content.split('\n\n')
          .filter(p => p.trim())
          .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
          .join('\n')}
      </div>`;
      
    case 'markdown':
      // 简单的Markdown转HTML处理 (此处需要实现或引入Markdown库)
      // 这是一个简单的示例，实际项目应该使用成熟的Markdown库
      let html = content
        // 替换表格
        .replace(/^\|(.+\|)+$/gm, match => {
          const rows = match.split('\n').filter(row => row.trim() && !row.trim().startsWith('|-'));
          if (rows.length < 1) return match;
          
          const headerRow = rows[0];
          const cells = headerRow.split('|').filter(cell => cell.trim()).map(cell => cell.trim());
          
          let tableHtml = '<table border="1" cellpadding="5"><thead><tr>';
          cells.forEach(cell => {
            tableHtml += `<th>${cell}</th>`;
          });
          tableHtml += '</tr></thead>';
          
          if (rows.length > 1) {
            tableHtml += '<tbody>';
            for (let i = 1; i < rows.length; i++) {
              const row = rows[i];
              const cells = row.split('|').filter(cell => cell.trim()).map(cell => cell.trim());
              
              tableHtml += '<tr>';
              cells.forEach(cell => {
                tableHtml += `<td>${cell}</td>`;
              });
              tableHtml += '</tr>';
            }
            tableHtml += '</tbody>';
          }
          
          tableHtml += '</table>';
          return tableHtml;
        })
        // 替换标题
        .replace(/^#{1,6}\s+(.+)$/gm, (match, text) => {
          const level = match.match(/#+/);
          if (level && level[0]) {
            return `<h${level[0].length}>${text}</h${level[0].length}>`;
          }
          return `<h1>${text}</h1>`;
        })
        // 替换加粗
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        // 替换斜体
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        // 替换链接
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
        // 替换图片
        .replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1">')
        // 替换引用
        .replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>')
        // 替换无序列表项
        .replace(/^(\*|-|\+)\s+(.+)$/gm, '<li>$2</li>')
        // 包装列表项
        .replace(/(<li>.+<\/li>\n)+/g, match => `<ul>${match}</ul>`)
        // 替换有序列表项
        .replace(/^[0-9]+\.\s+(.+)$/gm, '<li>$1</li>')
        // 包装有序列表项
        .replace(/(<li>.+<\/li>\n)+/g, match => `<ol>${match}</ol>`)
        // 替换删除线
        .replace(/~~(.+?)~~/g, '<del>$1</del>')
        // 替换换行
        .replace(/\n\n/g, '</p><p>')
        // 替换代码块
        .replace(/```(.+?)```/gs, '<pre><code>$1</code></pre>');
        
      // 包装到article-content div中
      return DOMPurify.sanitize(`<div class="article-content"><p>${html}</p></div>`);
      
    case 'docx':
    case 'xlsx':
    case 'rtf':
      // 这些格式需要特殊处理，在前端直接处理可能不现实
      // 下面的代码只是占位，实际项目中应该使用服务器端处理或专用库
      return `<div class="article-content">
        <p>检测到 ${format.toUpperCase()} 格式内容。处理中...</p>
        <p>建议使用专门的库（如mammoth.js、xlsx.js、rtf-parser等）处理此类格式。</p>
      </div>`;
      
    default:
      return `<div class="article-content"><p>${content}</p></div>`;
  }
}; 