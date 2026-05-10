const fs = require('node:fs');
const path = require('node:path');

const reportDirs = ['allure-results', 'allure-report', 'playwright-report', 'test-results', 'blob-report'];

for (const dir of reportDirs) {
  const fullPath = path.resolve(process.cwd(), dir);
  if (fs.existsSync(fullPath)) {
    fs.rmSync(fullPath, { recursive: true, force: true });
    console.log(`Removed ${dir}`);
  }
}
