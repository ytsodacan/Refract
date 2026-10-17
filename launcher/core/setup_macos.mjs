import { run } from './runtime.mjs';

async function python() {
  const check = { id: 'python', title: 'Python' };
  try { return { ...check, ok: true, detail: (await run('python3', ['--version'], { timeout: 15000 })).trim() }; }
  catch { return { ...check, ok: false, detail: 'Refract reads game packages with Python 3. Install python3 and run setup again.' }; }
}

async function node() {
  const check = { id: 'node', title: 'Node.js' };
  try { return { ...check, ok: true, detail: (await run('node', ['--version'], { timeout: 15000 })).trim() }; }
  catch { return { ...check, ok: false, detail: 'Node.js is required for the launcher backend. Install Node.js 22 or newer.' }; }
}

async function runtimeStatus() {
  return {
    id: 'runtime',
    title: 'Game runtime',
    ok: false,
    detail: 'Running Android games on macOS is not supported yet. You can use the launcher UI and account/download management.',
  };
}

export async function checkSetupMac() {
  const [py, js, runtime] = await Promise.all([python(), node(), runtimeStatus()]);
  return [py, js, runtime];
}

export async function fixSetupMac(_root, _settings, action) {
  throw new Error(action === 'runtime' ? 'Running games on macOS is not supported yet.' : 'Automatic setup fixes are not available on macOS yet.');
}

export async function headsetStatusMac() {
  return { connected: false, runtime: '', title: 'Unavailable on macOS', detail: 'VR play on macOS is not supported yet.' };
}
