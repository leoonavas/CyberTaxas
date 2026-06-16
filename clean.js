const fs = require('fs');
const path = require('path');

const root = path.resolve('.');
const exts = ['.html', '.css', '.js'];

function isSectionComment(text) {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 40) return false;
  if (/[^A-ZÀ-Ÿ0-9 \-()]/.test(trimmed)) return false;
  if (/\.{1,}|\!|\?|\:|\;/.test(trimmed)) return false;
  return true;
}

function scanDir(dir) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const item of items) {
    if (item.isDirectory()) {
      files.push(...scanDir(path.join(dir, item.name)));
    } else if (exts.includes(path.extname(item.name))) {
      files.push(path.join(dir, item.name));
    }
  }
  return files;
}

function removeHtmlComments(text) {
  return text.replace(/<!--([\s\S]*?)-->/g, (match, content) => {
    return isSectionComment(content) ? match : '';
  });
}

function removeCssComments(text) {
  return text.replace(/\/\*([\s\S]*?)\*\
    return isSectionComment(content) ? match : '';
  });
}

function removeJsComments(text) {
  let result = '';
  let i = 0;
  const len = text.length;
  let state = 'normal';
  while (i < len) {
    if (state === 'normal') {
      if (text.startsWith('//', i)) {
        const end = text.indexOf('\n', i);
        const comment = text.slice(i + 2, end === -1 ? len : end);
        if (isSectionComment(comment)) {
          result += '//' + comment;
        }
        if (end === -1) break;
        result += '\n';
        i = end + 1;
        continue;
      }
      if (text.startsWith('/*', i)) {
        const end = text.indexOf('*/', i + 2);
        const comment = end === -1 ? text.slice(i + 2) : text.slice(i + 2, end);
        if (isSectionComment(comment)) {
          result += '/*' + comment + '*/';
        }
        i = end === -1 ? len : end + 2;
        continue;
      }
      const ch = text[i];
      result += ch;
      if (ch === '"') state = 'double';
      else if (ch === "'") state = 'single';
      else if (ch === '`') state = 'template';
      i += 1;
    } else if (state === 'double') {
      const ch = text[i];
      result += ch;
      if (ch === '\\') {
        if (i + 1 < len) { result += text[i+1]; i += 2; continue; }
      } else if (ch === '"') state = 'normal';
      i += 1;
    } else if (state === 'single') {
      const ch = text[i];
      result += ch;
      if (ch === '\\') {
        if (i + 1 < len) { result += text[i+1]; i += 2; continue; }
      } else if (ch === "'") state = 'normal';
      i += 1;
    } else if (state === 'template') {
      const ch = text[i];
      result += ch;
      if (ch === '\\') {
        if (i + 1 < len) { result += text[i+1]; i += 2; continue; }
      } else if (ch === '`') state = 'normal';
      i += 1;
    }
  }
  return result;
}

const files = scanDir(root);
const processed = [];
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  let updated = content;
  if (file.endsWith('.html')) updated = removeHtmlComments(content);
  else if (file.endsWith('.css')) updated = removeCssComments(content);
  else if (file.endsWith('.js')) updated = removeJsComments(content);
  if (updated !== content) {
    fs.writeFileSync(file, updated, 'utf8');
    processed.push(file);
  }
}
console.log('Updated files:', processed.length);
for (const file of processed) console.log(file);
