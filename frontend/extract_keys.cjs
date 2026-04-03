const fs = require('fs');
const path = require('path');

const srcDir = 'c:/Users/hamza jemai/Desktop/el-fatoora/frontend/src';
const keys = new Set();

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      walk(fullPath);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const matches = content.matchAll(/t\(['"]([^'"]+)['"]\)/g);
      for (const match of matches) {
        keys.add(match[1]);
      }
    }
  }
}

walk(srcDir);
console.log(JSON.stringify(Array.from(keys).sort(), null, 2));
