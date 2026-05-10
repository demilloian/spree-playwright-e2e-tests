const fs = require('node:fs');
const path = require('node:path');

const resultsDir = path.resolve(process.cwd(), 'allure-results');
fs.mkdirSync(resultsDir, { recursive: true });

const environment = [
  `Application=Spree Commerce Demo`,
  `Base URL=${process.env.SPREE_BASE_URL ?? 'https://demo.spreecommerce.org/us/en'}`,
  `Node=${process.version}`,
  `CI=${process.env.CI ? 'true' : 'false'}`,
  `Framework=Playwright TypeScript`,
].join('\n');

fs.writeFileSync(path.join(resultsDir, 'environment.properties'), `${environment}\n`);

const categories = [
  {
    name: 'Product defect',
    matchedStatuses: ['failed'],
    messageRegex: '.*(expect|Assertion|toBeVisible|toHaveURL).*',
  },
  {
    name: 'Test automation issue',
    matchedStatuses: ['broken'],
  },
];

fs.writeFileSync(path.join(resultsDir, 'categories.json'), JSON.stringify(categories, null, 2));
