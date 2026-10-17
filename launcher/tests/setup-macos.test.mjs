import test from 'node:test';
import assert from 'node:assert/strict';
import { checkSetupMac, headsetStatusMac } from '../core/setup_macos.mjs';

test('macOS setup reports runtime as unavailable', async () => {
  const checks = await checkSetupMac();
  const runtime = checks.find(c => c.id === 'runtime');
  assert.equal(runtime?.ok, false);
  assert.match(runtime?.detail || '', /not supported yet/i);
});

test('macOS headset status reports unsupported runtime', async () => {
  const status = await headsetStatusMac();
  assert.equal(status.connected, false);
  assert.match(status.detail, /not supported yet/i);
});
