import test from 'node:test';
import assert from 'node:assert/strict';
import { platformAssets } from '../core/update.mjs';

test('update asset names are selected per platform', () => {
  assert.deepEqual(platformAssets('win32', 'x64'), ['win64.zip']);
  assert.deepEqual(platformAssets('linux', 'x64'), ['linux-x86_64.tar.gz']);
  assert.deepEqual(platformAssets('darwin', 'arm64'), ['macos-arm64.tar.gz', 'macos-universal.tar.gz']);
  assert.deepEqual(platformAssets('darwin', 'x64'), ['macos-x64.tar.gz', 'macos-universal.tar.gz']);
  assert.deepEqual(platformAssets('freebsd', 'x64'), []);
});
