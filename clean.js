<<<<<<< HEAD
﻿const fs = require('fs');
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
=======
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
>>>>>>> d3b346dd4f91f69ead2a8a12ea9ad28de74e9af0
    }
  }
  return files;
}

<<<<<<< HEAD
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
=======
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
>>>>>>> d3b346dd4f91f69ead2a8a12ea9ad28de74e9af0
        result += '\n';
        i = end + 1;
        continue;
      }
<<<<<<< HEAD

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
=======
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
>>>>>>> d3b346dd4f91f69ead2a8a12ea9ad28de74e9af0
