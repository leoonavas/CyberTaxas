const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SELF_PATH = path.resolve(__filename);
const EXTENSIONS = ['.html', '.css', '.js'];

function isSectionComment(text) {
  const trimmed = String(text).trim();
  if (!trimmed) return false;
  if (trimmed.length > 60) return false;
  if (trimmed.includes('\n')) return false;
  return /^[A-ZÀ-Ÿ0-9 _()\-]+$/.test(trimmed);
}

function getFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getFiles(fullPath));
    } else if (EXTENSIONS.includes(path.extname(entry.name))) {
      if (path.resolve(fullPath) !== SELF_PATH) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

function cleanHtml(content) {
  return content.replace(/<!--([\s\S]*?)-->/g, (full, inner) => {
    return isSectionComment(inner) ? full : '';
  });
}

function cleanCss(content) {
  return content.replace(/\/\*([\s\S]*?)\*\//g, (full, inner) => {
    return isSectionComment(inner) ? full : '';
  });
}

function cleanJs(content) {
  let result = '';
  let i = 0;
  const len = content.length;
  let state = 'normal';

  while (i < len) {
    const char = content[i];

    if (state === 'normal') {
      if (content.startsWith('//', i)) {
        const end = content.indexOf('\n', i);
        const commentText = content.slice(i + 2, end === -1 ? len : end);
        if (isSectionComment(commentText)) {
          result += '//' + commentText;
        }
        if (end === -1) {
          break;
        }
        result += '\n';
        i = end + 1;
        continue;
      }

      if (content.startsWith('/*', i)) {
        const end = content.indexOf('*/', i + 2);
        if (end === -1) {
          const commentText = content.slice(i + 2);
          if (isSectionComment(commentText)) {
            result += '/*' + commentText + '*/';
          }
          break;
        }
        const commentText = content.slice(i + 2, end);
        if (isSectionComment(commentText)) {
          result += '/*' + commentText + '*/';
        }
        i = end + 2;
        continue;
      }

      if (char === '"') {
        state = 'double';
      } else if (char === "'") {
        state = 'single';
      } else if (char === '`') {
        state = 'template';
      }

      result += char;
      i += 1;
      continue;
    }

    result += char;
    if (char === '\\') {
      if (i + 1 < len) {
        result += content[i + 1];
        i += 2;
        continue;
      }
    } else if (state === 'double' && char === '"') {
      state = 'normal';
    } else if (state === 'single' && char === "'") {
      state = 'normal';
    } else if (state === 'template' && char === '`') {
      state = 'normal';
    }

    i += 1;
  }

  return result;
}

function main() {
  const files = getFiles(ROOT);
  const updatedFiles = [];

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8');
    let cleaned = content;

    if (filePath.endsWith('.html')) {
      cleaned = cleanHtml(content);
    } else if (filePath.endsWith('.css')) {
      cleaned = cleanCss(content);
    } else if (filePath.endsWith('.js')) {
      cleaned = cleanJs(content);
    }

    if (cleaned !== content) {
      fs.writeFileSync(filePath, cleaned, 'utf8');
      updatedFiles.push(filePath);
    }
  }

  console.log(`Completed clean. Updated ${updatedFiles.length} file(s):`);
  updatedFiles.forEach((file) => console.log(`- ${file}`));
}

main();
