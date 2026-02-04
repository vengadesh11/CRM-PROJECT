const fs = require('fs');
const path = 'frontend/src/pages/LeadsPage.tsx';
const replacement = fs.readFileSync('columnsReplacement.txt', 'utf8');
let text = fs.readFileSync(path, 'utf8');
const start = text.indexOf('<div className= relative mb-4>');
const end = text.indexOf('<div className=mt-6 flex items-center justify-end gap-3>', start);
if (start === -1 || end === -1) {
  console.error('markers not found');
  process.exit(1);
}
text = text.slice(0, start) + replacement + text.slice(end);
fs.writeFileSync(path, text);
