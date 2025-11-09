const fs = require('fs');
const path = require('path');

const testFiles = [
  'tests/integration/api/licenses/create.test.ts',
  'tests/integration/api/licenses/update.test.ts'
];

testFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Update the mock to include isValidDomain
  const oldMock = `vi.mock('@/lib/license/domain', () => ({
  normalizeDomain: vi.fn((domain: string) => domain.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '')),
}));`;

  const newMock = `vi.mock('@/lib/license/domain', () => ({
  normalizeDomain: vi.fn((domain: string) => domain.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '')),
  isValidDomain: vi.fn((domain: string) => {
    // Simple validation for tests
    return domain.length > 0 && domain.includes('.') && !domain.startsWith('.') && !domain.endsWith('.');
  }),
}));`;

  content = content.replace(oldMock, newMock);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file}`);
});

console.log('Done!');
