import fs from 'fs';
const logs = JSON.parse(fs.readFileSync('C:/Users/LAPTOP-HP/.gemini/antigravity/brain/46b26298-6c5a-43d9-9d5f-5c17170485fa/.system_generated/steps/907/output.txt', 'utf8'));

const formatted = logs.result.result.map(l => {
  return `${new Date(l.timestamp / 1000).toISOString()} | ${l.method} | ${l.status_code} | ${l.event_message}`;
}).join('\n');

fs.writeFileSync('formatted_logs.txt', formatted);
console.log("Formatted logs written to formatted_logs.txt");
