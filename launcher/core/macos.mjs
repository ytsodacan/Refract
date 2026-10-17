import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Runtime } from './runtime.mjs';
import { redact } from './emulator.mjs';

const unsupported = 'Running Android games on macOS is not supported yet.';

class EmptyLogcat {
  stop() {}
  async clear() {}
  read() { return { generation: 1, reset: false, entries: [], more: false, running: false, serial: '', error: '', capacity: 0 }; }
}

export class MacRuntime extends Runtime {
  get python() { return 'python3'; }
  get guestPackages() { return []; }
  adbExe() { return path.join(this.settings.sdk || '', 'platform-tools/adb'); }
  serial() { return ''; }
  async findPort() { return null; }
  async locate() { this.found = null; return null; }
  async avdProcessPort() { return null; }
  async checkHeadset() { throw new Error('VR play on macOS is not supported yet.'); }
  async ensure() { throw new Error(unsupported); }
  async prepare() { throw new Error(unsupported); }
  async install() { throw new Error(unsupported); }
  launch() { throw new Error(unsupported); }
  async stop() {}
  async stopAndroid() {}
  async shutdown() {}
}

export class MacEmulator {
  constructor(runtime, root, dataDirectory) { Object.assign(this, { runtime, root, dataDirectory, logcat: new EmptyLogcat() }); }
  async status() {
    return { state: 'stopped', port: null, serial: '', configuredPort: this.runtime.settings.port, avd: this.runtime.settings.avd, adopted: false, processes: [] };
  }
  async info() {
    return { collected: new Date().toISOString(), port: null, process: null, host: {
      os: `${os.type()} ${os.release()}`, memory: os.totalmem(), free: os.freemem(), cpu: os.cpus()[0]?.model || '', cores: os.cpus().length, threads: os.cpus().length,
      gpus: [], openxr: '', acceleration: { ok: false, detail: unsupported }, sdk: this.runtime.settings.sdk, emulatorVersion: '',
      adbVersion: '', multicoreQemu: false, node: process.version, launcherVersion: '', commit: '', root: this.root, data: this.dataDirectory,
    }, guest: null, components: [] };
  }
  async storage() {
    return { collected: new Date().toISOString(), port: null, guest: null, host: { exists: false, directory: path.join(os.homedir(), 'Library', 'Android') } };
  }
  async logFiles() {
    const file = path.join(this.dataDirectory, 'launcher-backend.log');
    const stat = await fs.stat(file).catch(() => null);
    return [{ id: 'launcher', label: 'Launcher backend', exists: Boolean(stat), size: stat?.size || 0, modified: stat?.mtime.toISOString() || '' }];
  }
  async logFile(id) {
    if (id !== 'launcher') throw new Error('Unknown log file.');
    const file = path.join(this.dataDirectory, 'launcher-backend.log');
    const text = await fs.readFile(file, 'utf8').catch(() => '');
    const stat = await fs.stat(file).catch(() => null);
    return { id, label: 'Launcher backend', file, exists: Boolean(stat), size: stat?.size || 0, modified: stat?.mtime.toISOString() || '', text: redact(text), truncated: false };
  }
  async shell() { return { code: 1, output: unsupported, ms: 0, serial: '' }; }
  async processes() { return []; }
  async exportDiagnostics(extra = {}) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const base = path.join(this.dataDirectory, 'diagnostics');
    const directory = path.join(base, `refract-diagnostics-${stamp}`);
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(path.join(directory, 'diagnostics.json'), redact(JSON.stringify({ ...extra, unsupported }, null, 2)));
    return { directory, zip: '', base };
  }
  async screenshot() { throw new Error(unsupported); }
  async clearCache() { throw new Error(unsupported); }
  async clearData() { throw new Error(unsupported); }
  async uninstall() { throw new Error(unsupported); }
  async deleteFiles() { throw new Error(unsupported); }
  async deleteSnapshots() { throw new Error(unsupported); }
  async diskSize() { throw new Error(unsupported); }
  async installGrowWrapper() { throw new Error(unsupported); }
  async enlargeDisk() { throw new Error(unsupported); }
  async markGrowPending() { throw new Error(unsupported); }
  async moveAvd() { throw new Error(unsupported); }
  async scheduleReset() { throw new Error(unsupported); }
}
