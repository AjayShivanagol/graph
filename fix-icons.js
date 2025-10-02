#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Icon mapping from Lucide React to Ant Design
const iconMapping = {
  'Globe': 'GlobalOutlined',
  'Mail': 'MailOutlined',
  'Square': 'StopOutlined',
  'Database': 'DatabaseOutlined',
  'Play': 'PlayCircleOutlined',
  'Equal': 'EqualOutlined',
  'Edit3': 'EditOutlined',
  'CreditCard': 'CreditCardOutlined',
  'X': 'CloseOutlined',
  'Settings': 'SettingOutlined',
  'Trash2': 'DeleteOutlined',
  'FileText': 'FileTextOutlined',
  'ArrowRight': 'ArrowRightOutlined',
  'Check': 'CheckOutlined',
  'Target': 'AimOutlined',
  'Edit': 'EditOutlined',
  'Search': 'SearchOutlined',
  'ArrowUpDown': 'SwapOutlined',
  'Plus': 'PlusOutlined',
  'MousePointer': 'ClickOutlined',
  'MessageSquare': 'MessageOutlined',
  'Bell': 'BellOutlined',
  'Smartphone': 'MobileOutlined',
  'GitBranch': 'BranchesOutlined',
  'Zap': 'ThunderboltOutlined',
  'CheckSquare': 'CheckSquareOutlined',
  'Clock': 'ClockCircleOutlined',
  'User': 'UserOutlined',
  'Mic': 'AudioOutlined',
  'Code': 'CodeOutlined',
  'Bot': 'RobotOutlined',
  'ChevronDown': 'DownOutlined',
  'ChevronUp': 'UpOutlined',
  'Download': 'DownloadOutlined',
  'Upload': 'UploadOutlined'
};

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Check if file has lucide-react imports
    if (!content.includes('lucide-react')) {
      return false;
    }

    console.log(`Processing: ${filePath}`);

    // Replace import statement
    const importRegex = /import\s*{([^}]+)}\s*from\s*['"]lucide-react['"];?/g;
    const importMatch = content.match(importRegex);
    
    if (importMatch) {
      const importStatement = importMatch[0];
      const iconsInImport = importStatement.match(/{([^}]+)}/)[1]
        .split(',')
        .map(icon => icon.trim());

      const antdIcons = iconsInImport
        .map(icon => iconMapping[icon] || icon)
        .filter(Boolean);

      if (antdIcons.length > 0) {
        const newImport = `import { ${antdIcons.join(', ')} } from '@ant-design/icons';`;
        content = content.replace(importRegex, newImport);
        modified = true;
      }
    }

    // Replace icon usages in JSX
    Object.entries(iconMapping).forEach(([lucideIcon, antdIcon]) => {
      // Replace className usage: <Icon className="..." />
      const classNameRegex = new RegExp(`<${lucideIcon}\\s+className="([^"]*)"\\s*/>`, 'g');
      content = content.replace(classNameRegex, (match, className) => {
        // Convert Tailwind classes to inline styles
        const sizeMatch = className.match(/w-(\d+)\s+h-(\d+)/);
        const fontSize = sizeMatch ? parseInt(sizeMatch[1]) * 4 : 16;
        return `<${antdIcon} style={{ fontSize: ${fontSize} }} />`;
      });

      // Replace simple usage: <Icon />
      const simpleRegex = new RegExp(`<${lucideIcon}\\s*/>`, 'g');
      content = content.replace(simpleRegex, `<${antdIcon} />`);

      // Replace with style prop: <Icon style={...} />
      const styleRegex = new RegExp(`<${lucideIcon}\\s+(style={[^}]+})\\s*/>`, 'g');
      content = content.replace(styleRegex, `<${antdIcon} $1 />`);
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Fixed: ${filePath}`);
      return true;
    }

    return false;
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

console.log(`\n🎉 Migration complete! Fixed ${fixedCount} files.`);
