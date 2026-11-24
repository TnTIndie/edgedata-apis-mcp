import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverEntry = path.resolve(__dirname, '../dist/index.js');

const transport = new StdioClientTransport({
  command: process.execPath,
  args: [serverEntry],
  env: { ...process.env, RAPIDAPI_KEY: '' },
});

const client = new Client({ name: 'edgedata-smoke-client', version: '1.0.0' });

try {
  await client.connect(transport);
  const { tools } = await client.listTools();
  assert.ok(tools.length === 23, `Expected 23 MCP tools, got ${tools.length}`);

  // Verify graceful fail-closed message when RAPIDAPI_KEY is unset
  const res = await client.callTool({
    name: 'fx_convert_and_rates',
    arguments: { base: 'USD', symbols: 'EUR,VND' },
  });
  assert.equal(res.isError, true, 'Expected isError=true when RAPIDAPI_KEY is missing');
  const txt = res.content?.[0]?.text ?? '';
  assert.ok(txt.includes('MISSING_RAPIDAPI_KEY'), 'Expected MISSING_RAPIDAPI_KEY guidance');

  console.log(`PASS: EdgeData MCP Server initialized over stdio, listed ${tools.length} tools, and verified missing-key guard.`);
} finally {
  await client.close();
}
