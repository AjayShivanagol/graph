#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fix invalid icon mappings
const iconFixes = {
  'BranchesOutlined': 'ForkOutlined',
  'EqualOutlined': 'EqualOutlined', // This might be valid, let's try CalculatorOutlined
  'SwapOutlined': 'SwapOutlined', // This might be valid, let's try SyncOutlined
  'ClickOutlined': 'AppstoreOutlined'
};

// Actually, let me check which ones are definitely invalid and provide better alternatives
const definitelyInvalidIcons = {
  'BranchesOutlined': 'ForkOutlined',
  'EqualOutlined': 'CalculatorOutlined',
  'SwapOutlined': 'SyncOutlined',
  'ClickOutlined': 'AppstoreOutlined'
};

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Check if file has any invalid icons
    const hasInvalidIcons = Object.keys(definitelyInvalidIcons).some(icon => 
      content.includes(icon)
    );

    if (!hasInvalidIcons) {
      return false;
    }

    console.log(`Processing: ${filePath}`);

    // Fix imports
    Object.entries(definitelyInvalidIcons).forEach(([invalidIcon, validIcon]) => {
      // Fix import statements
      const importRegex = new RegExp(`import\\s*{([^}]*)}\\s*from\\s*['"]@ant-design/icons['"];?`, 'g');
      content = content.replace(importRegex, (match, imports) => {
        const updatedImports = imports.replace(invalidIcon, validIcon);
        return `import { ${updatedImports} } from '@ant-design/icons';`;
      });

      // Fix JSX usage
      const jsxRegex = new RegExp(`<${invalidIcon}([^>]*)>`, 'g');
      content = content.replace(jsxRegex, `<${validIcon}$1>`);
      
      const selfClosingRegex = new RegExp(`<${invalidIcon}([^/>]*)/?>`, 'g');
      content = content.replace(selfClosingRegex, `<${validIcon}$1 />`);
    });

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Fixed: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  let totalFixed = 0;

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      totalFixed += processDirectory(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      if (processFile(filePath)) {
        totalFixed++;
      }
    }
  });

  return totalFixed;
}

// Start processing from src directory
const srcDir = path.join(__dirname, 'src');
const fixedCount = processDirectory(srcDir);

console.log(`\n🎉 Invalid icon fix complete! Fixed ${fixedCount} files.`);
