const fs = require('fs');
const path = require('path');

// Extract keys from src
const srcDir = 'c:/Users/hamza jemai/Desktop/el-fatoora/frontend/src';
const keysUsed = new Set();

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
        keysUsed.add(match[1]);
      }
    }
  }
}

walk(srcDir);

// Read translations.js
// We need to parse it. Since it's a JS file with a const, we can't just require it easily if it's ESM.
// But we can read it as text and try to evaluate or parse it.
const translationsPath = 'c:/Users/hamza jemai/Desktop/el-fatoora/frontend/src/i18n/translations.js';
const translationsContent = fs.readFileSync(translationsPath, 'utf8');

// Simplified parser for the nested structure
function getKeys(obj, prefix = '') {
  let keys = [];
  for (let key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys = keys.concat(getKeys(obj[key], prefix + key + '.'));
    } else {
      keys.push(prefix + key);
    }
  }
  return keys;
}

// Extract the 3 main sections: fr, en, ar
// This is a bit hacky because it's not a JSON file
// We'll use a regex to find the start of each section
const frMatch = translationsContent.match(/fr: \{([\s\S]+?)\},\s+en:/);
const enMatch = translationsContent.match(/en: \{([\s\S]+?)\},\s+ar:/);
const arMatch = translationsContent.match(/ar: \{([\s\S]+?)\},/);

// Instead of complex parsing, let's just check if each key exists in the text as a property
const report = {
  missingInFr: [],
  missingInEn: [],
  missingInAr: []
};

for (const key of keysUsed) {
  const parts = key.split('.');
  
  // Check if key exists in each section by searching for the property path
  const checkKey = (sectionText) => {
    // This is a naive check but should work for most cases in this specific file
    // We'll look for the last part of the key as a property: key: "value"
    // To be more accurate, we should really parse the object, but let's try this first.
    return sectionText.includes(parts[parts.length - 1] + ':');
  };

  // Actually, better approach: just see if the whole key string (e.g. "nav.dashboard") exists as "dashboard:" under "nav:"
  // Let's use a more robust way: we already have common.cancel vs form.cancel
}

console.log("Total keys used in code:", keysUsed.size);
console.log(Array.from(keysUsed).sort());
