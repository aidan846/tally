import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const version = packageJson.version;
const tag = `v${version}`;
const tauriConfigPath = resolve(root, 'src-tauri/tauri.conf.json');
const packageLockPath = resolve(root, 'package-lock.json');
const tauriConfig = JSON.parse(readFileSync(tauriConfigPath, 'utf8'));

function run(command, args, options = {}) {
    const result = execFileSync(command, args, {
        cwd: root,
        encoding: 'utf8',
        stdio: options.quiet ? 'pipe' : 'inherit'
    });

    return options.quiet ? result.trim() : '';
}

function output(command, args) {
    return run(command, args, { quiet: true });
}

if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error(`package.json has an invalid semantic version: ${version}`);
}

if (tauriConfig.version !== version) {
    tauriConfig.version = version;
    writeFileSync(tauriConfigPath, `${JSON.stringify(tauriConfig, null, 2)}\n`);
}

const packageLock = JSON.parse(readFileSync(packageLockPath, 'utf8'));
if (packageLock.version !== version || packageLock.packages?.[''].version !== version) {
    packageLock.version = version;
    packageLock.packages ??= {};
    packageLock.packages[''] ??= {};
    packageLock.packages[''].version = version;
    writeFileSync(packageLockPath, `${JSON.stringify(packageLock, null, 2)}\n`);
}

const branch = output('git', ['branch', '--show-current']);
if (!branch) throw new Error('Release requires a checked-out branch.');

run('git', ['diff', '--check']);
if (process.platform === 'win32') {
    run('cmd.exe', ['/d', '/s', '/c', 'npm test']);
} else {
    run('npm', ['test']);
}

if (output('git', ['tag', '--list', tag]) || output('git', ['ls-remote', '--tags', 'origin', `refs/tags/${tag}`])) {
    throw new Error(`Tag ${tag} already exists locally or on origin.`);
}

run('git', ['add', '--all']);
if (output('git', ['diff', '--cached', '--name-only'])) {
    run('git', ['commit', '-m', `Release ${tag}`]);
}

run('git', ['tag', '-a', tag, '-m', `Release ${tag}`]);
run('git', ['push', 'origin', branch, tag]);

console.log(`Published ${tag}. GitHub Actions will now build and publish the release.`);
